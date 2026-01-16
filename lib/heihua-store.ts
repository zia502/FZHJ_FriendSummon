import "server-only"

import { getDb } from "@/lib/db"

type HeihuaTermRecord = {
  id: string
  term: string
  meaning: string
  createdAt: string
  updatedAt: string
}

async function getHeihuaTerms({
  q,
  limit = 200,
}: {
  q?: string
  limit?: number
} = {}): Promise<HeihuaTermRecord[]> {
  const db = getDb()

  const qText = (q ?? "").trim()
  const where: string[] = []
  const values: Array<string | number> = []

  if (qText) {
    where.push("(term LIKE ? OR meaning LIKE ?)")
    const like = `%${qText}%`
    values.push(like, like)
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""
  const rows = db
    .prepare(
      `
      SELECT id, term, meaning, createdAt, updatedAt
      FROM heihua_terms
      ${whereSql}
      ORDER BY updatedAt DESC
      LIMIT ?
    `
    )
    .all(...values, limit) as Array<{
    id: string
    term: string
    meaning: string
    createdAt: string
    updatedAt: string
  }>

  return rows.map((row) => ({
    id: String(row.id),
    term: String(row.term),
    meaning: String(row.meaning),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }))
}

async function getHeihuaTermById(id: string): Promise<HeihuaTermRecord | null> {
  const db = getDb()
  const row = db
    .prepare("SELECT id, term, meaning, createdAt, updatedAt FROM heihua_terms WHERE id = ?")
    .get(id) as
    | {
        id: string
        term: string
        meaning: string
        createdAt: string
        updatedAt: string
      }
    | undefined
  if (!row) return null
  return {
    id: String(row.id),
    term: String(row.term),
    meaning: String(row.meaning),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }
}

async function addHeihuaTerm(record: HeihuaTermRecord) {
  const db = getDb()

  const term = record.term.trim()
  const meaning = record.meaning.trim()
  if (!term) throw new Error("缺少必填项：黑话")
  if (!meaning) throw new Error("缺少必填项：解释")

  const exists = db
    .prepare("SELECT 1 AS ok FROM heihua_terms WHERE term = ? COLLATE NOCASE LIMIT 1")
    .get(term) as { ok?: 1 } | undefined
  if (exists) throw new Error("已存在同名黑话")

  db.prepare(
    `
    INSERT INTO heihua_terms (id, term, meaning, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?)
  `
  ).run(record.id, term, meaning, record.createdAt, record.updatedAt)
}

async function updateHeihuaTerm({
  id,
  term,
  meaning,
  updatedAt,
}: {
  id: string
  term: string
  meaning: string
  updatedAt: string
}) {
  const db = getDb()

  const termText = term.trim()
  const meaningText = meaning.trim()
  if (!termText) throw new Error("缺少必填项：黑话")
  if (!meaningText) throw new Error("缺少必填项：解释")

  const exists = db
    .prepare(
      "SELECT id FROM heihua_terms WHERE term = ? COLLATE NOCASE AND id <> ? LIMIT 1"
    )
    .get(termText, id) as { id?: string } | undefined
  if (exists?.id) throw new Error("已存在同名黑话")

  const result = db
    .prepare(
      `
      UPDATE heihua_terms
      SET term = ?, meaning = ?, updatedAt = ?
      WHERE id = ?
    `
    )
    .run(termText, meaningText, updatedAt, id) as unknown as { changes: number }
  if (result.changes < 1) throw new Error("黑话不存在")
}

async function deleteHeihuaTerm(id: string): Promise<boolean> {
  const db = getDb()
  const result = db
    .prepare("DELETE FROM heihua_terms WHERE id = ?")
    .run(id) as unknown as { changes: number }
  return result.changes > 0
}

export type { HeihuaTermRecord }
export {
  addHeihuaTerm,
  deleteHeihuaTerm,
  getHeihuaTermById,
  getHeihuaTerms,
  updateHeihuaTerm,
}

