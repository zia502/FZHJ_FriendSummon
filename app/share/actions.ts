"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getMonsters } from "@/lib/monsters-store"
import { upsertFriendSummon } from "@/lib/friend-summons-store"
import { parseSlotValue } from "@/lib/slot-value"

function slotElement(index: number) {
  const col = index % 5
  if (col === 0) return "火"
  if (col === 1) return "风"
  if (col === 2) return "土"
  if (col === 3) return "水"
  return "其他"
}

async function upsertFriendSummonAction(formData: FormData) {
  const playerId = String(formData.get("playerId") ?? "").trim()
  if (!/^\d+$/.test(playerId)) {
    redirect("/share?error=bad_id")
  }

  const monsters = await getMonsters({ limit: 5000 })
  const byId = new Map(monsters.map((m) => [m.id, m]))

  const slotIds: Array<string | null> = []
  for (let i = 0; i < 10; i++) {
    const raw = String(formData.get(`slot${i}`) ?? "").trim()
    if (!raw) {
      slotIds.push(null)
      continue
    }

    const { monsterId, variant } = parseSlotValue(raw)
    const monster = byId.get(monsterId)
    if (!monster) {
      redirect(`/share?id=${playerId}&error=bad_monster`)
    }

    if (variant === "u" && (!monster.hasFourStar || !monster.fourStarEffect)) {
      redirect(`/share?id=${playerId}&error=bad_monster`)
    }

    const required = slotElement(i)
    if (required !== "其他" && monster.element !== required) {
      redirect(`/share?id=${playerId}&error=bad_element`)
    }

    slotIds.push(raw)
  }

  await upsertFriendSummon({ playerId, slotIds })
  revalidatePath("/")
  redirect(`/?saved=1`)
}

export { upsertFriendSummonAction }
