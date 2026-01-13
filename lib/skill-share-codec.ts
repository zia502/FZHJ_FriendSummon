type SkillShareEntry = {
  Index: number
  OwnerType: number
  OwnerIsMain: boolean
  OwnerID: number
  OwnerPos: number
  SkillID: number
  ConfigID0: number
  ConfigID1: number
}

function normalizeBase64(input: string) {
  const trimmed = input.trim()
  const normalized = trimmed.replace(/[-_]/g, (m) => (m === "-" ? "+" : "/"))
  const pad = normalized.length % 4
  if (pad === 0) return normalized
  return normalized + "=".repeat(4 - pad)
}

function assertEntry(value: unknown, index: number): asserts value is SkillShareEntry {
  if (!value || typeof value !== "object") {
    throw new Error(`invalid_entry:${index}`)
  }
  const obj = value as Record<string, unknown>
  const needNumber = (key: keyof SkillShareEntry) => {
    if (typeof obj[key] !== "number" || !Number.isFinite(obj[key])) {
      throw new Error(`invalid_field:${index}:${String(key)}`)
    }
  }
  const needBool = (key: keyof SkillShareEntry) => {
    if (typeof obj[key] !== "boolean") {
      throw new Error(`invalid_field:${index}:${String(key)}`)
    }
  }

  needNumber("Index")
  needNumber("OwnerType")
  needBool("OwnerIsMain")
  needNumber("OwnerID")
  needNumber("OwnerPos")
  needNumber("SkillID")
  needNumber("ConfigID0")
  needNumber("ConfigID1")
}

function decodeSkillShareString(encoded: string): SkillShareEntry[] {
  const b64 = normalizeBase64(encoded)
  let jsonText: string
  try {
    jsonText = Buffer.from(b64, "base64").toString("utf8")
  } catch {
    throw new Error("invalid_base64")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error("invalid_json")
  }

  if (!Array.isArray(parsed)) {
    throw new Error("invalid_payload")
  }

  for (let i = 0; i < parsed.length; i++) {
    assertEntry(parsed[i], i)
  }

  return parsed
}

export type { SkillShareEntry }
export { decodeSkillShareString }

