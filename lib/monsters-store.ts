import "server-only"

import { getDb } from "@/lib/db"

type MonsterType = "神" | "魔" | "属性"
type MonsterElement = "火" | "风" | "土" | "水" | "其他"

type MonsterRecord = {
  id: string
  name: string
  element: MonsterElement
  type: MonsterType
  mainEffect: string
  hasFourStar: boolean
  fourStarEffect?: string
  imageUrl?: string
  createdAt: string
}

type GetMonstersParams = {
  q?: string
  type?: MonsterType | "全部"
  element?: MonsterElement | "全部"
  limit?: number
}

async function getMonsters(params: GetMonstersParams = {}): Promise<MonsterRecord[]> {
  const db = getDb()

  const q = (params.q ?? "").trim()
  const type = params.type ?? "全部"
  const element = params.element ?? "全部"
  const limit = params.limit ?? 100

  const where: string[] = []
  const values: Array<string | number> = []

  if (type !== "全部") {
    where.push("type = ?")
    values.push(type)
  }

  if (element !== "全部") {
    where.push("element = ?")
    values.push(element)
  }

  if (q) {
    where.push("(name LIKE ? OR mainEffect LIKE ? OR COALESCE(fourStarEffect,'') LIKE ?)")
    const like = `%${q}%`
    values.push(like, like, like)
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""
  const stmt = db.prepare(`
    SELECT
      id,
      name,
      element,
      type,
      mainEffect,
      hasFourStar,
      fourStarEffect,
      imageUrl,
      createdAt
    FROM monsters
    ${whereSql}
    ORDER BY createdAt DESC
    LIMIT ?
  `)

  const rows = stmt.all(...values, limit) as Array<{
    id: string
    name: string
    element: MonsterElement
    type: MonsterType
    mainEffect: string
    hasFourStar: 0 | 1
    fourStarEffect: string | null
    imageUrl: string | null
    createdAt: string
  }>

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    element: row.element,
    type: row.type,
    mainEffect: row.mainEffect,
    hasFourStar: row.hasFourStar === 1,
    fourStarEffect: row.fourStarEffect ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    createdAt: row.createdAt,
  }))
}

async function addMonster(record: MonsterRecord) {
  const db = getDb()
  const exists = db
    .prepare(
      "SELECT 1 FROM monsters WHERE name = ? COLLATE NOCASE LIMIT 1"
    )
    .get(record.name) as { 1: number } | undefined
  if (exists) {
    throw new Error("已存在同名魔物")
  }
  const stmt = db.prepare(`
    INSERT INTO monsters (
      id,
      name,
      element,
      type,
      mainEffect,
      hasFourStar,
      fourStarEffect,
      imageUrl,
      createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    record.id,
    record.name,
    record.element,
    record.type,
    record.mainEffect,
    record.hasFourStar ? 1 : 0,
    record.fourStarEffect ?? null,
    record.imageUrl ?? null,
    record.createdAt
  )
}

async function getMonsterById(id: string): Promise<MonsterRecord | null> {
  const db = getDb()
  const row = db
    .prepare(
      `
      SELECT
        id,
        name,
        element,
        type,
        mainEffect,
        hasFourStar,
        fourStarEffect,
        imageUrl,
        createdAt
      FROM monsters
      WHERE id = ?
    `
    )
    .get(id) as
    | {
        id: string
        name: string
        element: MonsterElement
        type: MonsterType
        mainEffect: string
        hasFourStar: 0 | 1
        fourStarEffect: string | null
        imageUrl: string | null
        createdAt: string
      }
    | undefined

  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    element: row.element,
    type: row.type,
    mainEffect: row.mainEffect,
    hasFourStar: row.hasFourStar === 1,
    fourStarEffect: row.fourStarEffect ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    createdAt: row.createdAt,
  }
}

async function updateMonster(record: Omit<MonsterRecord, "createdAt">) {
  const db = getDb()
  const exists = db
    .prepare(
      "SELECT 1 FROM monsters WHERE name = ? COLLATE NOCASE AND id <> ? LIMIT 1"
    )
    .get(record.name, record.id) as { 1: number } | undefined
  if (exists) {
    throw new Error("已存在同名魔物")
  }

  db.prepare(
    `
    UPDATE monsters SET
      name = ?,
      element = ?,
      type = ?,
      mainEffect = ?,
      hasFourStar = ?,
      fourStarEffect = ?,
      imageUrl = ?
    WHERE id = ?
  `
  ).run(
    record.name,
    record.element,
    record.type,
    record.mainEffect,
    record.hasFourStar ? 1 : 0,
    record.fourStarEffect ?? null,
    record.imageUrl ?? null,
    record.id
  )
}

async function deleteMonster(id: string) {
  const db = getDb()
  db.prepare("DELETE FROM monsters WHERE id = ?").run(id)
}

export type { GetMonstersParams, MonsterElement, MonsterRecord, MonsterType }
export { addMonster, deleteMonster, getMonsterById, getMonsters, updateMonster }
