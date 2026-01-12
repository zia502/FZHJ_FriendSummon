type SlotVariant = "5" | "u"

function parseSlotValue(value: string): { monsterId: string; variant: SlotVariant } {
  const trimmed = value.trim()
  if (!trimmed) return { monsterId: "", variant: "5" }

  const parts = trimmed.split("|")
  const monsterId = parts[0] ?? ""
  const variantRaw = parts[1] ?? "5"
  const variant: SlotVariant = variantRaw === "u" ? "u" : "5"
  return { monsterId, variant }
}

function formatSlotValue(monsterId: string, variant: SlotVariant) {
  const id = monsterId.trim()
  if (!id) return ""
  return `${id}|${variant}`
}

export type { SlotVariant }
export { formatSlotValue, parseSlotValue }
