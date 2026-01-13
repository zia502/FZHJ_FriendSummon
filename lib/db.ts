import "server-only"

import Database from "better-sqlite3"
import path from "node:path"

let db: Database.Database | null = null
let schemaEnsured = false

function ensureSchema(database: Database.Database) {
  if (schemaEnsured) return

  database.exec(`
    CREATE TABLE IF NOT EXISTS monsters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      element TEXT NOT NULL DEFAULT '未设置',
      type TEXT NOT NULL CHECK (type IN ('神','魔','属性','其他')),
      mainEffect TEXT NOT NULL,
      hasFourStar INTEGER NOT NULL CHECK (hasFourStar IN (0,1)),
      fourStarEffect TEXT,
      imageUrl TEXT,
      note TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_monsters_createdAt ON monsters(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_monsters_type ON monsters(type);
    CREATE INDEX IF NOT EXISTS idx_monsters_element ON monsters(element);
    CREATE INDEX IF NOT EXISTS idx_monsters_name ON monsters(name);

    CREATE TABLE IF NOT EXISTS friend_summons (
      playerId TEXT PRIMARY KEY,
      slot0 TEXT,
      slot1 TEXT,
      slot2 TEXT,
      slot3 TEXT,
      slot4 TEXT,
      slot5 TEXT,
      slot6 TEXT,
      slot7 TEXT,
      slot8 TEXT,
      slot9 TEXT,
      likes INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_friend_summons_updatedAt ON friend_summons(updatedAt DESC);

    CREATE TABLE IF NOT EXISTS friend_summon_likes (
      playerId TEXT NOT NULL,
      voterId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (playerId, voterId)
    );

    CREATE INDEX IF NOT EXISTS idx_friend_summon_likes_playerId ON friend_summon_likes(playerId);
  `)

  try {
    database.exec(
      "CREATE UNIQUE INDEX IF NOT EXISTS uniq_monsters_name ON monsters(name COLLATE NOCASE)"
    )
  } catch {
    // If existing DB already has duplicate names, keep app-level checks as the source of truth.
  }

  // Lightweight migrations for existing DBs.
  const monsterColumns = database
    .prepare("PRAGMA table_info(monsters)")
    .all() as Array<{ name: string }>
  if (!monsterColumns.some((c) => c.name === "element")) {
    database.exec(
      "ALTER TABLE monsters ADD COLUMN element TEXT NOT NULL DEFAULT '未设置'"
    )
    database.exec(
      "CREATE INDEX IF NOT EXISTS idx_monsters_element ON monsters(element)"
    )
  }

  if (!monsterColumns.some((c) => c.name === "updatedAt")) {
    database.exec("ALTER TABLE monsters ADD COLUMN updatedAt TEXT")
    database.exec(
      "UPDATE monsters SET updatedAt = createdAt WHERE updatedAt IS NULL OR updatedAt = ''"
    )
  }

  if (!monsterColumns.some((c) => c.name === "note")) {
    database.exec("ALTER TABLE monsters ADD COLUMN note TEXT")
  }

  // Normalize legacy placeholder values for element.
  database.exec(
    "UPDATE monsters SET element = '未设置' WHERE element IS NULL OR element = '' OR element = '其他'"
  )

  // Expand allowed type values for older DBs that were created with a narrower CHECK constraint.
  // SQLite doesn't support altering CHECK constraints in place, so we rebuild the table when needed.
  const monstersSqlRow = database
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'monsters'"
    )
    .get() as { sql?: string } | undefined
  const monstersSql = monstersSqlRow?.sql ?? ""
  const hasTypeCheck = /CHECK\s*\(\s*type\s+IN\s*\(/i.test(monstersSql)
  const allowsOtherType = /CHECK\s*\(\s*type\s+IN\s*\([^)]*'其他'/i.test(monstersSql)
  if (hasTypeCheck && !allowsOtherType) {
    database.exec("BEGIN")
    try {
      database.exec(`
        CREATE TABLE monsters_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          element TEXT NOT NULL DEFAULT '未设置',
          type TEXT NOT NULL CHECK (type IN ('神','魔','属性','其他')),
          mainEffect TEXT NOT NULL,
          hasFourStar INTEGER NOT NULL CHECK (hasFourStar IN (0,1)),
          fourStarEffect TEXT,
          imageUrl TEXT,
          note TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT
        );
      `)

      database.exec(`
        INSERT INTO monsters_new (
          id,
          name,
          element,
          type,
          mainEffect,
          hasFourStar,
          fourStarEffect,
          imageUrl,
          note,
          createdAt,
          updatedAt
        )
        SELECT
          id,
          name,
          element,
          type,
          mainEffect,
          hasFourStar,
          fourStarEffect,
          imageUrl,
          note,
          createdAt,
          updatedAt
        FROM monsters;
      `)

      database.exec("DROP TABLE monsters")
      database.exec("ALTER TABLE monsters_new RENAME TO monsters")

      database.exec(`
        CREATE INDEX IF NOT EXISTS idx_monsters_createdAt ON monsters(createdAt DESC);
        CREATE INDEX IF NOT EXISTS idx_monsters_type ON monsters(type);
        CREATE INDEX IF NOT EXISTS idx_monsters_element ON monsters(element);
        CREATE INDEX IF NOT EXISTS idx_monsters_name ON monsters(name);
        CREATE INDEX IF NOT EXISTS idx_monsters_updatedAt ON monsters(updatedAt DESC);
      `)

      try {
        database.exec(
          "CREATE UNIQUE INDEX IF NOT EXISTS uniq_monsters_name ON monsters(name COLLATE NOCASE)"
        )
      } catch {
        // If existing DB already has duplicate names, keep app-level checks as the source of truth.
      }

      database.exec("COMMIT")
    } catch (error) {
      try {
        database.exec("ROLLBACK")
      } catch {
        // ignore
      }
      throw error
    }
  }

  // Safe to create after `updatedAt` exists (older DBs may not have the column yet).
  database.exec(
    "CREATE INDEX IF NOT EXISTS idx_monsters_updatedAt ON monsters(updatedAt DESC)"
  )

  database.exec(`
    CREATE TABLE IF NOT EXISTS weapon_boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      element TEXT,
      type TEXT,
      description TEXT,
      playerId TEXT,
      skillShareCode TEXT,
      boardImageUrl TEXT NOT NULL,
      predictionImageUrl TEXT,
      teamImageUrl0 TEXT,
      teamImageUrl1 TEXT,
      likes INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_weapon_boards_updatedAt ON weapon_boards(updatedAt DESC);
    CREATE INDEX IF NOT EXISTS idx_weapon_boards_likes ON weapon_boards(likes DESC);

    CREATE TABLE IF NOT EXISTS weapon_board_likes (
      boardId TEXT NOT NULL,
      voterId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (boardId, voterId)
    );

    CREATE INDEX IF NOT EXISTS idx_weapon_board_likes_boardId ON weapon_board_likes(boardId);
  `)

  const weaponBoardColumns = database
    .prepare("PRAGMA table_info(weapon_boards)")
    .all() as Array<{ name: string }>
  if (!weaponBoardColumns.some((c) => c.name === "element")) {
    database.exec("ALTER TABLE weapon_boards ADD COLUMN element TEXT")
  }
  if (!weaponBoardColumns.some((c) => c.name === "type")) {
    database.exec("ALTER TABLE weapon_boards ADD COLUMN type TEXT")
  }
  if (!weaponBoardColumns.some((c) => c.name === "skillShareCode")) {
    database.exec("ALTER TABLE weapon_boards ADD COLUMN skillShareCode TEXT")
  }

  // Create after columns exist (older DBs may not have them yet).
  database.exec(
    "CREATE INDEX IF NOT EXISTS idx_weapon_boards_element ON weapon_boards(element)"
  )
  database.exec(
    "CREATE INDEX IF NOT EXISTS idx_weapon_boards_type ON weapon_boards(type)"
  )

  const friendSummonColumns = database
    .prepare("PRAGMA table_info(friend_summons)")
    .all() as Array<{ name: string }>
  if (!friendSummonColumns.some((c) => c.name === "likes")) {
    database.exec("ALTER TABLE friend_summons ADD COLUMN likes INTEGER NOT NULL DEFAULT 0")
  }
  if (friendSummonColumns.some((c) => c.name === "likes")) {
    database.exec(
      "CREATE INDEX IF NOT EXISTS idx_friend_summons_likes ON friend_summons(likes DESC)"
    )
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS friend_summon_likes (
      playerId TEXT NOT NULL,
      voterId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (playerId, voterId)
    );

    CREATE INDEX IF NOT EXISTS idx_friend_summon_likes_playerId ON friend_summon_likes(playerId);
  `)

  schemaEnsured = true
}

function getDb() {
  if (!db) {
    const filename = path.join(process.cwd(), "data", "app.db")
    db = new Database(filename)
    db.pragma("journal_mode = WAL")
    db.pragma("foreign_keys = ON")
    schemaEnsured = false
  }

  ensureSchema(db)
  return db
}

export { getDb }
