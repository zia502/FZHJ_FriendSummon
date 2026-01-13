import "server-only"

import { getDb } from "@/lib/db"

type FriendSummonRecord = {
  playerId: string
  slotIds: Array<string | null>
  likes: number
  createdAt: string
  updatedAt: string
}

type GetFriendSummonsPageResult = {
  items: FriendSummonRecord[]
  hasPrev: boolean
  hasNext: boolean
  page: number
  pageSize: number
}

type FriendSummonSortMode = "time" | "likes"

type FriendSummonRow = {
  playerId: string
  slot0: string | null
  slot1: string | null
  slot2: string | null
  slot3: string | null
  slot4: string | null
  slot5: string | null
  slot6: string | null
  slot7: string | null
  slot8: string | null
  slot9: string | null
  likes: number
  createdAt: string
  updatedAt: string
}

function normalizePage(raw: unknown) {
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 1) return 1
  return Math.floor(value)
}

async function getFriendSummonsPage({
  page,
  pageSize,
  sort = "time",
}: {
  page: number
  pageSize: number
  sort?: FriendSummonSortMode
}): Promise<GetFriendSummonsPageResult> {
  const db = getDb()
  const safePage = normalizePage(page)
  const offset = (safePage - 1) * pageSize

  const orderBy =
    sort === "likes" ? "likes DESC, updatedAt DESC" : "updatedAt DESC"

  const rows = db
    .prepare(
      `
      SELECT
        playerId,
        slot0, slot1, slot2, slot3, slot4,
        slot5, slot6, slot7, slot8, slot9,
        likes,
        createdAt,
        updatedAt
      FROM friend_summons
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `
    )
    .all(pageSize + 1, offset) as FriendSummonRow[]

  const sliced = rows.slice(0, pageSize)
  const hasNext = rows.length > pageSize
  const hasPrev = safePage > 1

  const items: FriendSummonRecord[] = sliced.map((row) => ({
    playerId: String(row.playerId),
    slotIds: [
      row.slot0 ?? null,
      row.slot1 ?? null,
      row.slot2 ?? null,
      row.slot3 ?? null,
      row.slot4 ?? null,
      row.slot5 ?? null,
      row.slot6 ?? null,
      row.slot7 ?? null,
      row.slot8 ?? null,
      row.slot9 ?? null,
    ],
    likes: Number(row.likes ?? 0) || 0,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }))

  return { items, hasPrev, hasNext, page: safePage, pageSize }
}

async function getFriendSummonByPlayerId(playerId: string): Promise<FriendSummonRecord | null> {
  const db = getDb()
  const row = db
    .prepare(
      `
      SELECT
        playerId,
        slot0, slot1, slot2, slot3, slot4,
        slot5, slot6, slot7, slot8, slot9,
        likes,
        createdAt,
        updatedAt
      FROM friend_summons
      WHERE playerId = ?
    `
    )
    .get(playerId) as FriendSummonRow | undefined

  if (!row) return null

  return {
    playerId: String(row.playerId),
    slotIds: [
      row.slot0 ?? null,
      row.slot1 ?? null,
      row.slot2 ?? null,
      row.slot3 ?? null,
      row.slot4 ?? null,
      row.slot5 ?? null,
      row.slot6 ?? null,
      row.slot7 ?? null,
      row.slot8 ?? null,
      row.slot9 ?? null,
    ],
    likes: Number(row.likes ?? 0) || 0,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }
}

async function deleteFriendSummonByPlayerId(playerId: string): Promise<boolean> {
  const db = getDb()
  const result = db
    .prepare("DELETE FROM friend_summons WHERE playerId = ?")
    .run(playerId) as unknown as { changes: number }
  return result.changes > 0
}

async function upsertFriendSummon({
  playerId,
  slotIds,
}: {
  playerId: string
  slotIds: Array<string | null>
}) {
  const db = getDb()
  const now = new Date().toISOString()

  const slots = Array.from({ length: 10 }, (_, i) => slotIds[i] ?? null)

  db.prepare(
    `
    INSERT INTO friend_summons (
      playerId,
      slot0, slot1, slot2, slot3, slot4,
      slot5, slot6, slot7, slot8, slot9,
      createdAt,
      updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(playerId) DO UPDATE SET
      slot0=excluded.slot0,
      slot1=excluded.slot1,
      slot2=excluded.slot2,
      slot3=excluded.slot3,
      slot4=excluded.slot4,
      slot5=excluded.slot5,
      slot6=excluded.slot6,
      slot7=excluded.slot7,
      slot8=excluded.slot8,
      slot9=excluded.slot9,
      updatedAt=excluded.updatedAt
  `
  ).run(
    playerId,
    slots[0],
    slots[1],
    slots[2],
    slots[3],
    slots[4],
    slots[5],
    slots[6],
    slots[7],
    slots[8],
    slots[9],
    now,
    now
  )
}

async function likeFriendSummon({
  playerId,
  voterId,
}: {
  playerId: string
  voterId: string
}): Promise<{ likes: number; didLike: boolean } | null> {
  const db = getDb()

  const ensureExists = db.prepare(
    "SELECT 1 as ok FROM friend_summons WHERE playerId = ?"
  )
  const insertLike = db.prepare(
    "INSERT OR IGNORE INTO friend_summon_likes (playerId, voterId, createdAt) VALUES (?, ?, ?)"
  )
  const bump = db.prepare("UPDATE friend_summons SET likes = likes + 1 WHERE playerId = ?")
  const read = db.prepare("SELECT likes FROM friend_summons WHERE playerId = ?")

  const tx = db.transaction(() => {
    const exists = ensureExists.get(playerId) as { ok?: 1 } | undefined
    if (!exists) return null

    const now = new Date().toISOString()
    const insert = insertLike.run(playerId, voterId, now) as unknown as {
      changes: number
    }
    const didLike = insert.changes > 0
    if (didLike) bump.run(playerId)

    const row = read.get(playerId) as { likes?: number } | undefined
    return { likes: Number(row?.likes ?? 0) || 0, didLike }
  })

  return tx()
}

export type { FriendSummonRecord, GetFriendSummonsPageResult }
export {
  deleteFriendSummonByPlayerId,
  getFriendSummonByPlayerId,
  getFriendSummonsPage,
  likeFriendSummon,
  upsertFriendSummon,
}

