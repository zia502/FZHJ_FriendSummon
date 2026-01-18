import "server-only"

import { getDb } from "@/lib/db"

type WeaponBoardRecord = {
  id: string
  name: string
  element?: WeaponBoardElement
  type?: WeaponBoardType
  description?: string
  playerId?: string
  skillShareCode?: string
  boardImageUrl: string
  predictionImageUrl?: string
  teamImageUrl0?: string
  teamImageUrl1?: string
  likes: number
  createdAt: string
  updatedAt: string
}

type WeaponBoardSortMode = "time" | "likes"
type WeaponBoardElement = "火" | "风" | "土" | "水"
type WeaponBoardType = "神" | "魔" | "其他"

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
  element: string | null
  type: string | null
  description: string | null
  playerId: string | null
  skillShareCode: string | null
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

function isWeaponBoardElement(value: string): value is WeaponBoardElement {
  return value === "火" || value === "风" || value === "土" || value === "水"
}

function isWeaponBoardType(value: string): value is WeaponBoardType {
  return value === "神" || value === "魔" || value === "其他"
}

async function getWeaponBoardsPage({
  page,
  pageSize,
  sort = "time",
  q,
  element = "全部",
  type = "全部",
}: {
  page: number
  pageSize: number
  sort?: WeaponBoardSortMode
  q?: string
  element?: WeaponBoardElement | "全部"
  type?: WeaponBoardType | "全部"
}): Promise<GetWeaponBoardsPageResult> {
  const db = getDb()
  const safePage = normalizePage(page)
  const offset = (safePage - 1) * pageSize

  const orderBy =
    sort === "likes" ? "likes DESC, updatedAt DESC" : "updatedAt DESC"

  const where: string[] = []
  const values: Array<string | number> = []

  const qText = (q ?? "").trim()
  if (qText) {
    where.push("name LIKE ?")
    values.push(`%${qText}%`)
  }

  if (element !== "全部") {
    where.push("element = ?")
    values.push(element)
  }

  if (type !== "全部") {
    where.push("type = ?")
    values.push(type)
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""

  const rows = db
    .prepare(
      `
      SELECT
        id,
        name,
        element,
        type,
        description,
        playerId,
        skillShareCode,
        boardImageUrl,
        predictionImageUrl,
        teamImageUrl0,
        teamImageUrl1,
        likes,
        createdAt,
        updatedAt
      FROM weapon_boards
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `
    )
    .all(...values, pageSize + 1, offset) as WeaponBoardRow[]

  const sliced = rows.slice(0, pageSize)
  const hasNext = rows.length > pageSize
  const hasPrev = safePage > 1

  const items: WeaponBoardRecord[] = sliced.map((row) => {
    const elementText = String(row.element ?? "")
    const typeText = String(row.type ?? "")
    return {
      id: String(row.id),
      name: String(row.name),
      element: isWeaponBoardElement(elementText) ? elementText : undefined,
      type: isWeaponBoardType(typeText) ? typeText : undefined,
      description: row.description ?? undefined,
      playerId: row.playerId ?? undefined,
      skillShareCode: row.skillShareCode ?? undefined,
      boardImageUrl: String(row.boardImageUrl),
      predictionImageUrl: row.predictionImageUrl ?? undefined,
      teamImageUrl0: row.teamImageUrl0 ?? undefined,
      teamImageUrl1: row.teamImageUrl1 ?? undefined,
      likes: Number(row.likes ?? 0) || 0,
      createdAt: String(row.createdAt),
      updatedAt: String(row.updatedAt),
    }
  })

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
        element,
        type,
        description,
        playerId,
        skillShareCode,
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

  const elementText = String(row.element ?? "")
  const typeText = String(row.type ?? "")

  return {
    id: String(row.id),
    name: String(row.name),
    element: isWeaponBoardElement(elementText) ? elementText : undefined,
    type: isWeaponBoardType(typeText) ? typeText : undefined,
    description: row.description ?? undefined,
    playerId: row.playerId ?? undefined,
    skillShareCode: row.skillShareCode ?? undefined,
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
      element,
      type,
      description,
      playerId,
      skillShareCode,
      boardImageUrl,
      predictionImageUrl,
      teamImageUrl0,
      teamImageUrl1,
      likes,
      createdAt,
      updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    record.id,
    record.name,
    record.element ?? null,
    record.type ?? null,
    record.description ?? null,
    record.playerId ?? null,
    record.skillShareCode ?? null,
    record.boardImageUrl,
    record.predictionImageUrl ?? null,
    record.teamImageUrl0 ?? null,
    record.teamImageUrl1 ?? null,
    record.likes,
    record.createdAt,
    record.updatedAt
  )
}

async function updateWeaponBoard(record: {
  id: string
  name: string
  element?: WeaponBoardElement
  type?: WeaponBoardType
  description?: string
  playerId?: string
  skillShareCode?: string
  boardImageUrl: string
  predictionImageUrl?: string
  teamImageUrl0?: string
  teamImageUrl1?: string
  updatedAt: string
}) {
  const db = getDb()
  db.prepare(
    `
    UPDATE weapon_boards
    SET
      name = ?,
      element = ?,
      type = ?,
      description = ?,
      playerId = ?,
      skillShareCode = ?,
      boardImageUrl = ?,
      predictionImageUrl = ?,
      teamImageUrl0 = ?,
      teamImageUrl1 = ?,
      updatedAt = ?
    WHERE id = ?
  `
  ).run(
    record.name,
    record.element ?? null,
    record.type ?? null,
    record.description ?? null,
    record.playerId ?? null,
    record.skillShareCode ?? null,
    record.boardImageUrl,
    record.predictionImageUrl ?? null,
    record.teamImageUrl0 ?? null,
    record.teamImageUrl1 ?? null,
    record.updatedAt,
    record.id
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

export type {
  GetWeaponBoardsPageResult,
  WeaponBoardElement,
  WeaponBoardRecord,
  WeaponBoardSortMode,
  WeaponBoardType,
}
export {
  createWeaponBoard,
  getWeaponBoardById,
  getWeaponBoardsPage,
  likeWeaponBoard,
  updateWeaponBoard,
}
