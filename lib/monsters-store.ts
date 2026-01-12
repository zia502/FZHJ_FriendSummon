import "server-only"

import { getDb } from "@/lib/db"

type MonsterType = "神" | "魔" | "属性" | "其他"
type MonsterElement = "火" | "风" | "土" | "水" | "光" | "暗"
type MonsterElementValue = MonsterElement | "未设置"

type MonsterRecord = {
  id: string
  name: string
  element: MonsterElementValue
  type: MonsterType
  mainEffect: string
  note?: string
  hasFourStar: boolean
  fourStarEffect?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

type GetMonstersParams = {
  q?: string
  type?: MonsterType | "全部"
  element?: MonsterElement | "全部"
  limit?: number
}

function isMonsterElement(value: string): value is MonsterElement {
  return (
    value === "火" ||
    value === "风" ||
    value === "土" ||
    value === "水" ||
    value === "光" ||
    value === "暗"
  )
}

function normalizeMonsterElement(value: unknown): MonsterElementValue {
  const text = String(value ?? "").trim()
  if (isMonsterElement(text)) return text
  return "未设置"
}

function assertWritableMonsterElement(
  value: MonsterElementValue
): asserts value is MonsterElement {
  if (value === "未设置") {
    throw new Error("魔物属性未设置，请先在后台选择 火/风/土/水")
  }
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
    where.push(
      "(name LIKE ? OR mainEffect LIKE ? OR COALESCE(fourStarEffect,'') LIKE ? OR COALESCE(note,'') LIKE ?)"
    )
    const like = `%${q}%`
    values.push(like, like, like, like)
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""
  const stmt = db.prepare(`
    SELECT
      id,
      name,
      element,
      type,
      mainEffect,
      note,
      hasFourStar,
      fourStarEffect,
      imageUrl,
      createdAt,
      COALESCE(updatedAt, createdAt) AS updatedAt
    FROM monsters
    ${whereSql}
    ORDER BY createdAt DESC
    LIMIT ?
  `)

  const rows = stmt.all(...values, limit) as Array<{
    id: string
    name: string
    element: string
    type: MonsterType
    mainEffect: string
    note: string | null
    hasFourStar: 0 | 1
    fourStarEffect: string | null
    imageUrl: string | null
    createdAt: string
    updatedAt: string
  }>

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    element: normalizeMonsterElement(row.element),
    type: row.type,
    mainEffect: row.mainEffect,
    note: row.note ?? undefined,
    hasFourStar: row.hasFourStar === 1,
    fourStarEffect: row.fourStarEffect ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }))
}

async function addMonster(record: MonsterRecord) {
  const db = getDb()
  assertWritableMonsterElement(record.element)
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
      note,
      hasFourStar,
      fourStarEffect,
      imageUrl,
      createdAt,
      updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    record.id,
    record.name,
    record.element,
    record.type,
    record.mainEffect,
    record.note ?? null,
    record.hasFourStar ? 1 : 0,
    record.fourStarEffect ?? null,
    record.imageUrl ?? null,
    record.createdAt,
    record.updatedAt
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
        note,
        hasFourStar,
        fourStarEffect,
        imageUrl,
        createdAt,
        COALESCE(updatedAt, createdAt) AS updatedAt
      FROM monsters
      WHERE id = ?
    `
    )
    .get(id) as
    | {
        id: string
        name: string
        element: string
        type: MonsterType
        mainEffect: string
        note: string | null
        hasFourStar: 0 | 1
        fourStarEffect: string | null
        imageUrl: string | null
        createdAt: string
        updatedAt: string
      }
    | undefined

  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    element: normalizeMonsterElement(row.element),
    type: row.type,
    mainEffect: row.mainEffect,
    note: row.note ?? undefined,
    hasFourStar: row.hasFourStar === 1,
    fourStarEffect: row.fourStarEffect ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

async function updateMonster(record: Omit<MonsterRecord, "createdAt">) {
  const db = getDb()
  assertWritableMonsterElement(record.element)
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
      note = ?,
      hasFourStar = ?,
      fourStarEffect = ?,
      imageUrl = ?,
      updatedAt = ?
    WHERE id = ?
  `
  ).run(
    record.name,
    record.element,
    record.type,
    record.mainEffect,
    record.note ?? null,
    record.hasFourStar ? 1 : 0,
    record.fourStarEffect ?? null,
    record.imageUrl ?? null,
    record.updatedAt,
    record.id
  )
}

async function deleteMonster(id: string) {
  const db = getDb()
  db.prepare("DELETE FROM monsters WHERE id = ?").run(id)
}

export type { GetMonstersParams, MonsterElement, MonsterRecord, MonsterType }
export { addMonster, deleteMonster, getMonsterById, getMonsters, updateMonster }
