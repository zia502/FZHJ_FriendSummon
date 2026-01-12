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
      element TEXT NOT NULL DEFAULT '其他',
      type TEXT NOT NULL CHECK (type IN ('神','魔','属性')),
      mainEffect TEXT NOT NULL,
      hasFourStar INTEGER NOT NULL CHECK (hasFourStar IN (0,1)),
      fourStarEffect TEXT,
      imageUrl TEXT,
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
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_friend_summons_updatedAt ON friend_summons(updatedAt DESC);
  `)

  try {
    database.exec(
      "CREATE UNIQUE INDEX IF NOT EXISTS uniq_monsters_name ON monsters(name COLLATE NOCASE)"
    )
  } catch {
    // If existing DB already has duplicate names, keep app-level checks as the source of truth.
  }

  // Lightweight migrations for existing DBs.
  const columns = database
    .prepare("PRAGMA table_info(monsters)")
    .all() as Array<{ name: string }>
  if (!columns.some((c) => c.name === "element")) {
    database.exec(
      "ALTER TABLE monsters ADD COLUMN element TEXT NOT NULL DEFAULT '其他'"
    )
    database.exec(
      "CREATE INDEX IF NOT EXISTS idx_monsters_element ON monsters(element)"
    )
  }

  if (!columns.some((c) => c.name === "updatedAt")) {
    database.exec("ALTER TABLE monsters ADD COLUMN updatedAt TEXT")
    database.exec(
      "UPDATE monsters SET updatedAt = createdAt WHERE updatedAt IS NULL OR updatedAt = ''"
    )
  }

  // Safe to create after `updatedAt` exists (older DBs may not have the column yet).
  database.exec(
    "CREATE INDEX IF NOT EXISTS idx_monsters_updatedAt ON monsters(updatedAt DESC)"
  )

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
