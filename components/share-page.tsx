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

  const monstersFor = React.useMemo(() => {
    return {
      火: monsters.filter((m) => m.element === "火"),
      风: monsters.filter((m) => m.element === "风"),
      土: monsters.filter((m) => m.element === "土"),
      水: monsters.filter((m) => m.element === "水"),
      其他: monsters,
    } as const
  }, [monsters])

  const slotDefaults = React.useMemo(() => {
    if (!initialSlotIds) return Array.from({ length: 10 }, () => "")
    return Array.from({ length: 10 }, (_, i) => initialSlotIds[i] ?? "")
  }, [initialSlotIds])

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10">
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
            <div className="grid grid-cols-5 gap-2">
              {slotDefaults.map((defaultValue, index) => {
                const el = slotElement(index)
                const options = monstersFor[el]
                return (
                  <div key={index} className="grid gap-1">
                    <select
                      name={`slot${index}`}
                      defaultValue={defaultValue}
                      className={cn(
                        "border-input bg-background h-9 rounded-md border px-2 text-xs",
                        "ring-2 ring-inset",
                        slotRingClass(index)
                      )}
                    >
                      <option value="">{el} · 空</option>
                      {options.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
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
          {Array.from({ length: 10 }, (_, i) => i).map((index) => (
            <div key={index} className={cn("ring-2 ring-inset", slotRingClass(index), "rounded-md")}>
              <Image
                src="/summon-placeholder.svg"
                alt="预览"
                width={64}
                height={64}
                className="block size-16 rounded-md object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export { SharePage }
