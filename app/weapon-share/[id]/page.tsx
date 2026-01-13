import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { SummonCard, type SummonListItem } from "@/components/summon-card"
import { getFriendSummonByPlayerId } from "@/lib/friend-summons-store"
import { getMonsters } from "@/lib/monsters-store"
import { getWeaponBoardById } from "@/lib/weapon-boards-store"
import { parseSlotValue } from "@/lib/slot-value"

function withVersion(url: string | undefined, version: string | undefined) {
  if (!url) return undefined
  if (!version) return url
  const joiner = url.includes("?") ? "&" : "?"
  return `${url}${joiner}v=${encodeURIComponent(version)}`
}

export default async function WeaponBoardDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const board = await getWeaponBoardById(id)
  if (!board) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10">
        <div className="text-sm font-medium">未找到该分享</div>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/weapon-share">返回列表</Link>
          </Button>
        </div>
      </main>
    )
  }

  const playerId = (board.playerId ?? "").trim()
  const shouldLookupSummon = /^\d+$/.test(playerId)

  let summonCard: SummonListItem | null = null
  let summonFound = false

  if (shouldLookupSummon) {
    const summon = await getFriendSummonByPlayerId(playerId)
    if (summon) {
      summonFound = true
      const monsters = await getMonsters({ limit: 5000 })
      const monstersById = new Map(monsters.map((m) => [m.id, m]))

      summonCard = {
        playerId: summon.playerId,
        createdAt: summon.createdAt,
        updatedAt: summon.updatedAt,
        likes: summon.likes,
        slots: summon.slotIds.map((raw) => {
          if (!raw) return null
          const { monsterId, variant } = parseSlotValue(raw)
          const monster = monstersById.get(monsterId)
          if (!monster) return null
          const base = {
            id: monster.id,
            name: monster.name,
            element: monster.element,
            type: monster.type,
            mainEffect: monster.mainEffect,
            note: monster.note,
            hasFourStar: monster.hasFourStar,
            fourStarEffect: monster.fourStarEffect,
            imageUrl: withVersion(monster.imageUrl, monster.updatedAt),
          }
          if (variant === "u") {
            const effect = monster.fourStarEffect ?? ""
            return {
              ...base,
              mainEffect: effect || base.mainEffect,
              hasFourStar: false,
              fourStarEffect: undefined,
              star: 4 as const,
            }
          }
          return {
            ...base,
            hasFourStar: false,
            fourStarEffect: undefined,
            star: 5 as const,
          }
        }) as SummonListItem["slots"],
      }
    }
  }

  const images: Array<{ label: string; url?: string }> = [
    { label: "武器盘图", url: board.boardImageUrl },
    { label: "预测图", url: board.predictionImageUrl },
    { label: "队伍图 1", url: board.teamImageUrl0 },
    { label: "队伍图 2", url: board.teamImageUrl1 },
  ]

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-foreground truncate text-xl font-bold tracking-tight">
              {board.name}
            </h1>
            <div className="text-muted-foreground mt-1 text-xs">
              ID：{board.id}
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/weapon-share">返回列表</Link>
          </Button>
        </div>

        <div className="mt-4 grid gap-2 rounded-xl border p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="text-muted-foreground text-xs">点赞</div>
            <div className="tabular-nums">{board.likes}</div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-muted-foreground text-xs">玩家ID</div>
            <div className="truncate">{board.playerId || "（未填写）"}</div>
          </div>
          <div className="grid gap-1">
            <div className="text-muted-foreground text-xs">描述</div>
            <div className="whitespace-pre-wrap break-words">
              {board.description || "（无）"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {images.map((img) => (
            <div key={img.label} className="grid gap-2">
              <div className="text-muted-foreground text-xs">{img.label}</div>
              {img.url ? (
                <div className="ring-foreground/10 bg-card rounded-xl p-2 ring-1">
                  <Image
                    src={img.url}
                    alt={img.label}
                    width={900}
                    height={900}
                    className="h-auto w-full rounded-lg object-contain"
                    priority={img.label === "武器盘图"}
                    unoptimized={img.url.startsWith("/uploads/")}
                  />
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">（未上传）</div>
              )}
            </div>
          ))}
        </div>

        {shouldLookupSummon && (
          <div className="mt-6">
            <div className="text-sm font-medium">关联好友招募</div>
            <div className="text-muted-foreground mt-1 text-xs">
              玩家ID：{playerId}
            </div>

            <div className="mt-3">
              {summonFound && summonCard ? (
                <SummonCard item={summonCard} />
              ) : (
                <div className="text-muted-foreground text-sm">
                  未找到该玩家的好友招募信息
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

