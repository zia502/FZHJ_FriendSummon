"use client"

import * as React from "react"
import { CopyIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { MonsterSlot, SummonListItem } from "@/components/summon-card"

type MonsterOption = MonsterSlot

type SlotColumnKey = "火" | "风" | "土" | "水" | "任意"

function slotElement(index: number): SlotColumnKey {
  const col = index % 5
  if (col === 0) return "火"
  if (col === 1) return "风"
  if (col === 2) return "土"
  if (col === 3) return "水"
  return "任意"
}

function slotRingClass(index: number) {
  const col = index % 5
  if (col === 0) return "ring-red-500"
  if (col === 1) return "ring-green-500"
  if (col === 2) return "ring-amber-800"
  if (col === 3) return "ring-blue-500"
  return "ring-slate-700"
}

function ShareDialog({
  monsters,
  onShare,
}: {
  monsters: MonsterOption[]
  onShare: (item: SummonListItem) => void
}) {
  const [playerId, setPlayerId] = React.useState("")
  const [slots, setSlots] = React.useState<Array<string>>(
    Array.from({ length: 10 }, () => "")
  )

  const numericId = playerId.replace(/[^\d]/g, "")
  const idValid = numericId.length > 0

  const monstersById = React.useMemo(() => {
    return new Map(monsters.map((m) => [m.id, m]))
  }, [monsters])

  const filteredOptionsForSlot = React.useCallback(
    (index: number) => {
      const el = slotElement(index)
      if (el === "任意") return monsters
      return monsters.filter((m) => m.element === el)
    },
    [monsters]
  )

  const handleShare = React.useCallback(() => {
    if (!idValid) return

    const resolvedSlots = slots.map((id) =>
      id ? monstersById.get(id.split("|")[0] ?? id) ?? null : null
    ) as SummonListItem["slots"]

    const now = new Date().toISOString()
    onShare({ playerId: numericId, slots: resolvedSlots, createdAt: now, updatedAt: now })
  }, [idValid, monstersById, numericId, onShare, slots])

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>我要分享</Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>分享友招配置</AlertDialogTitle>
          <AlertDialogDescription>
            填写玩家 ID，并为 10 个栏位选择魔物（按列限制属性：火/风/土/水/任意）。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <div className="text-sm font-medium">玩家 ID（纯数字）</div>
            <div className="flex items-center gap-2">
              <Input
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder="例如：12345678"
                inputMode="numeric"
                aria-invalid={!idValid || undefined}
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="复制当前玩家ID"
                onClick={() => {
                  void navigator.clipboard?.writeText(numericId)
                }}
                disabled={!idValid}
              >
                <CopyIcon />
              </Button>
            </div>
            {!idValid && (
              <div className="text-destructive text-xs">请输入纯数字 ID</div>
            )}
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">10 个栏位</div>
            <div className="overflow-x-auto pb-1">
              <div className="grid min-w-[420px] grid-cols-5 gap-2">
                {slots.map((value, index) => {
                  const options = filteredOptionsForSlot(index)
                  const el = slotElement(index)
                  return (
                    <div key={index} className="grid min-w-0 gap-1">
                      <select
                        value={value}
                        onChange={(e) => {
                          const next = [...slots]
                          next[index] = e.target.value
                          setSlots(next)
                        }}
                        className={cn(
                          "border-input bg-background h-9 w-full min-w-0 rounded-md border px-2 text-xs",
                          "ring-2 ring-inset",
                          slotRingClass(index)
                        )}
                      >
                        <option value="">{el} · 选择</option>
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
              “任意”栏位可选择任意魔物，其余栏位只能选同属性魔物。
            </div>
          </div>

          <Textarea
            placeholder="（可选）备注：后续你可以在这里加说明/队伍链接"
            disabled
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button type="button" onClick={handleShare} disabled={!idValid}>
              提交分享
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export type { MonsterOption }
export { ShareDialog }
