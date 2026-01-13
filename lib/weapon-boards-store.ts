import "server-only"

import { getDb } from "@/lib/db"

type WeaponBoardRecord = {
  id: string
  name: string
  description?: string
  playerId?: string
  boardImageUrl: string
  predictionImageUrl?: string
  teamImageUrl0?: string
  teamImageUrl1?: string
  likes: number
  createdAt: string
  updatedAt: string
}

type WeaponBoardSortMode = "time" | "likes"

type GetWeaponBoardsPageResult = {
  items: WeaponBoardRecord[]
  hasPrev: boolean
  hasNext: boolean
  page: number
  pageSize: number
}

type WeaponBoardRow = {
  id: string
  name: string
  description: string | null
  playerId: string | null
  boardImageUrl: string
  predictionImageUrl: string | null
  teamImageUrl0: string | null
  teamImageUrl1: string | null
  likes: number
  createdAt: string
  updatedAt: string
}

function normalizePage(raw: unknown) {
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 1) return 1
  return Math.floor(value)
}

async function getWeaponBoardsPage({
  page,
  pageSize,
  sort = "time",
}: {
  page: number
  pageSize: number
  sort?: WeaponBoardSortMode
}): Promise<GetWeaponBoardsPageResult> {
  const db = getDb()
  const safePage = normalizePage(page)
  const offset = (safePage - 1) * pageSize

  const orderBy =
    sort === "likes" ? "likes DESC, updatedAt DESC" : "updatedAt DESC"

  const rows = db
    .prepare(
      `
      SELECT
        id,
        name,
        description,
        playerId,
        boardImageUrl,
        predictionImageUrl,
        teamImageUrl0,
        teamImageUrl1,
        likes,
        createdAt,
        updatedAt
      FROM weapon_boards
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `
    )
    .all(pageSize + 1, offset) as WeaponBoardRow[]

  const sliced = rows.slice(0, pageSize)
  const hasNext = rows.length > pageSize
  const hasPrev = safePage > 1

  const items: WeaponBoardRecord[] = sliced.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    description: row.description ?? undefined,
    playerId: row.playerId ?? undefined,
    boardImageUrl: String(row.boardImageUrl),
    predictionImageUrl: row.predictionImageUrl ?? undefined,
    teamImageUrl0: row.teamImageUrl0 ?? undefined,
    teamImageUrl1: row.teamImageUrl1 ?? undefined,
    likes: Number(row.likes ?? 0) || 0,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }))

  return { items, hasPrev, hasNext, page: safePage, pageSize }
}

async function getWeaponBoardById(id: string): Promise<WeaponBoardRecord | null> {
  const db = getDb()
  const row = db
    .prepare(
      `
      SELECT
        id,
        name,
        description,
        playerId,
        boardImageUrl,
        predictionImageUrl,
        teamImageUrl0,
        teamImageUrl1,
        likes,
        createdAt,
        updatedAt
      FROM weapon_boards
      WHERE id = ?
    `
    )
    .get(id) as WeaponBoardRow | undefined

  if (!row) return null

  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description ?? undefined,
    playerId: row.playerId ?? undefined,
    boardImageUrl: String(row.boardImageUrl),
    predictionImageUrl: row.predictionImageUrl ?? undefined,
    teamImageUrl0: row.teamImageUrl0 ?? undefined,
    teamImageUrl1: row.teamImageUrl1 ?? undefined,
    likes: Number(row.likes ?? 0) || 0,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }
}

async function createWeaponBoard(record: WeaponBoardRecord) {
  const db = getDb()
  db.prepare(
    `
    INSERT INTO weapon_boards (
      id,
      name,
      description,
      playerId,
      boardImageUrl,
      predictionImageUrl,
      teamImageUrl0,
      teamImageUrl1,
      likes,
      createdAt,
      updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    record.id,
    record.name,
    record.description ?? null,
    record.playerId ?? null,
    record.boardImageUrl,
    record.predictionImageUrl ?? null,
    record.teamImageUrl0 ?? null,
    record.teamImageUrl1 ?? null,
    record.likes,
    record.createdAt,
    record.updatedAt
  )
}

async function likeWeaponBoard({
  id,
  voterId,
}: {
  id: string
  voterId: string
}): Promise<{ likes: number; didLike: boolean } | null> {
  const db = getDb()

  const ensureExists = db.prepare("SELECT 1 as ok FROM weapon_boards WHERE id = ?")
  const insertLike = db.prepare(
    "INSERT OR IGNORE INTO weapon_board_likes (boardId, voterId, createdAt) VALUES (?, ?, ?)"
  )
  const bump = db.prepare("UPDATE weapon_boards SET likes = likes + 1 WHERE id = ?")
  const read = db.prepare("SELECT likes FROM weapon_boards WHERE id = ?")

  const tx = db.transaction(() => {
    const exists = ensureExists.get(id) as { ok?: 1 } | undefined
    if (!exists) return null

    const now = new Date().toISOString()
    const insert = insertLike.run(id, voterId, now) as unknown as {
      changes: number
    }
    const didLike = insert.changes > 0
    if (didLike) bump.run(id)

    const row = read.get(id) as { likes?: number } | undefined
    return { likes: Number(row?.likes ?? 0) || 0, didLike }
  })

  return tx()
}

export type { GetWeaponBoardsPageResult, WeaponBoardRecord, WeaponBoardSortMode }
export { createWeaponBoard, getWeaponBoardById, getWeaponBoardsPage, likeWeaponBoard }

