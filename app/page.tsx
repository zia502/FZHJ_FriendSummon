import { FriendSummonPage } from "@/components/friend-summon-page"
import type { MonsterSlot, SummonListItem } from "@/components/summon-card"
import { getMonsters } from "@/lib/monsters-store"
import { getFriendSummonsPage } from "@/lib/friend-summons-store"
import { parseSlotValue } from "@/lib/slot-value"

function withVersion(url: string | undefined, version: string | undefined) {
  if (!url) return undefined
  if (!version) return url
  const joiner = url.includes("?") ? "&" : "?"
  return `${url}${joiner}v=${encodeURIComponent(version)}`
}

function pickFirst(
  monsters: MonsterSlot[],
  element: MonsterSlot["element"]
): MonsterSlot | null {
  if (element === "其他") return monsters[0] ?? null
  return monsters.find((m) => m.element === element) ?? null
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params?.page ?? 1) || 1)

  const monsters = await getMonsters({ limit: 5000 })
  const monsterOptions: MonsterSlot[] = monsters.map((m) => ({
    id: m.id,
    name: m.name,
    element: m.element,
    type: m.type,
    mainEffect: m.mainEffect,
    hasFourStar: m.hasFourStar,
    fourStarEffect: m.fourStarEffect,
    imageUrl: withVersion(m.imageUrl, m.updatedAt),
  }))
  const monstersById = new Map(monsterOptions.map((m) => [m.id, m]))

  const { items, hasPrev, hasNext } = await getFriendSummonsPage({
    page,
    pageSize: 20,
  })

  const initialItems: SummonListItem[] =
    items.length > 0
      ? items.map((r) => ({
          playerId: r.playerId,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          slots: r.slotIds.map((raw) => {
            if (!raw) return null
            const { monsterId, variant } = parseSlotValue(raw)
            const monster = monstersById.get(monsterId)
            if (!monster) return null
            if (variant === "u") {
              const effect = monster.fourStarEffect ?? ""
              return {
                ...monster,
                mainEffect: effect || monster.mainEffect,
                hasFourStar: false,
                fourStarEffect: undefined,
              }
            }
            return {
              ...monster,
              hasFourStar: false,
              fourStarEffect: undefined,
            }
          }) as SummonListItem["slots"],
        }))
      : [
          {
            playerId: "10482917",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            slots: [
              pickFirst(monsterOptions, "火"),
              pickFirst(monsterOptions, "风"),
              pickFirst(monsterOptions, "土"),
              pickFirst(monsterOptions, "水"),
              pickFirst(monsterOptions, "其他"),
              pickFirst(monsterOptions, "火"),
              pickFirst(monsterOptions, "风"),
              pickFirst(monsterOptions, "土"),
              pickFirst(monsterOptions, "水"),
              pickFirst(monsterOptions, "其他"),
            ] as SummonListItem["slots"],
          },
        ]

  return (
    <FriendSummonPage
      initialItems={initialItems}
      monsters={monsterOptions}
      page={page}
      hasPrev={hasPrev}
      hasNext={hasNext}
    />
  )
}
