import "server-only"

import { getDb } from "@/lib/db"

type FriendSummonRecord = {
  playerId: string
  slotIds: Array<string | null>
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

function normalizePage(raw: unknown) {
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 1) return 1
  return Math.floor(value)
}

async function getFriendSummonsPage({
  page,
  pageSize,
}: {
  page: number
  pageSize: number
}): Promise<GetFriendSummonsPageResult> {
  const db = getDb()
  const safePage = normalizePage(page)
  const offset = (safePage - 1) * pageSize

  const rows = db
    .prepare(
      `
      SELECT
        playerId,
        slot0, slot1, slot2, slot3, slot4,
        slot5, slot6, slot7, slot8, slot9,
        createdAt,
        updatedAt
      FROM friend_summons
      ORDER BY updatedAt DESC
      LIMIT ? OFFSET ?
    `
    )
    .all(pageSize + 1, offset) as Array<Record<string, string | null>>

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
        createdAt,
        updatedAt
      FROM friend_summons
      WHERE playerId = ?
    `
    )
    .get(playerId) as Record<string, string | null> | undefined

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
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }
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

export type { FriendSummonRecord, GetFriendSummonsPageResult }
export { getFriendSummonByPlayerId, getFriendSummonsPage, upsertFriendSummon }

