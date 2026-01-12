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

export type { GetMonstersParams, MonsterElement, MonsterRecord, MonsterType }
export { addMonster, getMonsters }
