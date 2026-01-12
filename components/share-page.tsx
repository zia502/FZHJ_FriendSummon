"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { upsertFriendSummonAction } from "@/app/share/actions"

type MonsterOption = {
  id: string
  name: string
  element: "火" | "风" | "土" | "水" | "其他"
  type: "神" | "魔" | "属性"
  hasFourStar: boolean
  imageUrl?: string
}

function slotElement(index: number): MonsterOption["element"] {
  const col = index % 5
  if (col === 0) return "火"
  if (col === 1) return "风"
  if (col === 2) return "土"
  if (col === 3) return "水"
  return "其他"
}

function slotRingClass(index: number) {
  const col = index % 5
  if (col === 0) return "ring-red-500"
  if (col === 1) return "ring-green-500"
  if (col === 2) return "ring-amber-800"
  if (col === 3) return "ring-blue-500"
  return "ring-slate-700"
}

function SharePage({
  monsters,
  initialPlayerId,
  initialSlotIds,
  error,
}: {
  monsters: MonsterOption[]
  initialPlayerId: string
  initialSlotIds: Array<string | null> | null
  error?: string
}) {
  const [playerId, setPlayerId] = React.useState(initialPlayerId)
  const router = useRouter()

  const numericId = playerId.replace(/[^\d]/g, "")

  const monstersById = React.useMemo(() => {
    return new Map(monsters.map((m) => [m.id, m]))
  }, [monsters])

  const monstersFor = React.useMemo(() => {
    return {
      火: monsters.filter((m) => m.element === "火"),
      风: monsters.filter((m) => m.element === "风"),
      土: monsters.filter((m) => m.element === "土"),
      水: monsters.filter((m) => m.element === "水"),
      其他: monsters,
    } as const
  }, [monsters])

  const initialSlots = React.useMemo(() => {
    if (!initialSlotIds) return Array.from({ length: 10 }, () => "")
    return Array.from({ length: 10 }, (_, i) => {
      const raw = initialSlotIds[i] ?? ""
      if (!raw) return ""
      return raw.includes("|") ? raw : `${raw}|5`
    })
  }, [initialSlotIds])

  const [slotIds, setSlotIds] = React.useState<Array<string>>(() => initialSlots)

  React.useEffect(() => {
    setSlotIds(initialSlots)
  }, [initialSlots])

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-lg px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-foreground text-xl font-bold tracking-tight">
            我要分享 / 编辑
          </h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/">返回列表</Link>
          </Button>
        </div>

        <div className="text-muted-foreground mt-2 text-sm">
          不做登录：只要知道玩家 ID 就能编辑该 ID 的友招配置。
        </div>

        {error && (
          <div className="text-destructive mt-3 text-sm">
            {error === "bad_id" && "玩家ID必须为纯数字"}
            {error === "bad_monster" && "选择的魔物无效"}
            {error === "bad_element" && "所选魔物属性不符合该栏位列规则"}
          </div>
        )}

        <form action={upsertFriendSummonAction} className="mt-4 grid gap-3">
          <div className="grid gap-2">
            <div className="text-sm font-medium">玩家 ID（纯数字）</div>
            <div className="flex items-center gap-2">
              <Input
                name="playerId"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder="例如：12345678"
                inputMode="numeric"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!/^\d+$/.test(numericId)}
                onClick={() => router.push(`/share?id=${numericId}`)}
              >
                加载
              </Button>
            </div>
            <div className="text-muted-foreground text-xs">
              当前提交 ID：{numericId || "（未填写）"}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">10 个栏位</div>
            <div className="overflow-x-auto pb-1">
              <div className="grid min-w-[420px] grid-cols-5 gap-2">
                {slotIds.map((value, index) => {
                  const el = slotElement(index)
                  const options = monstersFor[el]
                  return (
                    <div key={index} className="grid min-w-0 gap-1">
                      <select
                        name={`slot${index}`}
                        value={value}
                        onChange={(e) => {
                          const next = [...slotIds]
                          next[index] = e.target.value
                          setSlotIds(next)
                        }}
                        className={cn(
                          "border-input bg-background h-9 w-full min-w-0 rounded-md border px-2 text-xs",
                          "ring-2 ring-inset",
                          slotRingClass(index)
                        )}
                      >
                        <option value="">{el} · 空</option>
                        {options.flatMap((m) => {
                          const items = [
                            <option key={`${m.id}|5`} value={`${m.id}|5`}>
                              {m.name}（5星）
                            </option>,
                          ]
                          if (m.hasFourStar) {
                            items.push(
                              <option key={`${m.id}|u`} value={`${m.id}|u`}>
                                {m.name}（未满突）
                              </option>
                            )
                          }
                          return items
                        })}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="text-muted-foreground text-xs">
              火/风/土/水栏位只能选同属性魔物；“其他”栏位可选任意魔物。
            </div>
          </div>

          <Button type="submit" disabled={!/^\d+$/.test(numericId)}>
            保存 / 更新
          </Button>
        </form>

        <div className="mt-6 border-t pt-4" />

        <div className="mt-3 grid grid-cols-5 gap-2">
          {slotIds.map((id, index) => {
            const monsterId = id ? id.split("|")[0] : ""
            const monster = monsterId ? monstersById.get(monsterId) : undefined
            const initial = monster?.name?.trim()?.slice(0, 1) ?? ""
            const hasImage = !!monster?.imageUrl
            return (
              <div key={index} className="flex items-center justify-center">
                <div
                  className={cn(
                    "bg-muted/20 flex size-16 items-center justify-center rounded-md ring-2 ring-inset p-[2px]",
                    slotRingClass(index)
                  )}
                >
                  {hasImage ? (
                    <Image
                      src={monster!.imageUrl!}
                      alt={monster?.name ?? "魔物"}
                      width={64}
                      height={64}
                      className="block size-full rounded-[calc(var(--radius)-2px)] object-contain"
                      priority={false}
                    />
                  ) : monster ? (
                    <span className="select-none text-2xl leading-none font-bold text-slate-700 dark:text-slate-200">
                      {initial}
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

export { SharePage }
