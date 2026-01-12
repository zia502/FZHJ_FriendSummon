"use client"

import * as React from "react"
import Image from "next/image"
import { CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function formatIso(value: string) {
  // Deterministic formatting to avoid locale differences.
  return value.replace("T", " ").slice(0, 19)
}

async function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.top = "0"
  textarea.style.left = "0"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  document.body.removeChild(textarea)
}

type SummonListItem = {
  playerId: string
  createdAt: string
  updatedAt: string
  slots: [
    MonsterSlot | null,
    MonsterSlot | null,
    MonsterSlot | null,
    MonsterSlot | null,
    MonsterSlot | null,
    MonsterSlot | null,
    MonsterSlot | null,
    MonsterSlot | null,
    MonsterSlot | null,
    MonsterSlot | null,
  ]
}

type MonsterSlot = {
  id: string
  name: string
  element: "火" | "风" | "土" | "水" | "其他"
  type: "神" | "魔" | "属性"
  mainEffect: string
  hasFourStar: boolean
  fourStarEffect?: string
  imageUrl?: string
}

function SummonCard({ item, className }: { item: SummonListItem; className?: string }) {
  const handleCopy = React.useCallback(() => {
    void copyToClipboard(item.playerId)
  }, [item.playerId])

  const ringClassForIndex = React.useCallback((index: number) => {
    const col = index % 5
    if (col === 0) return "ring-red-500"
    if (col === 1) return "ring-green-500"
    if (col === 2) return "ring-amber-800"
    if (col === 3) return "ring-blue-500"
    return "ring-slate-700"
  }, [])

  const borderClassForIndex = React.useCallback((index: number) => {
    const col = index % 5
    if (col === 0) return "border-red-500"
    if (col === 1) return "border-green-500"
    if (col === 2) return "border-amber-800"
    if (col === 3) return "border-blue-500"
    return "border-slate-700"
  }, [])

  return (
    <div
      className={cn(
        "ring-foreground/10 bg-card text-card-foreground rounded-xl ring-1",
        "px-3 py-2.5",
        className
      )}
    >
      <div className="flex items-center justify-start gap-0">
        <div className="truncate text-sm font-bold tracking-tight">
          {item.playerId}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          className="ml-1"
          aria-label="复制玩家ID"
          onClick={handleCopy}
        >
          <CopyIcon />
        </Button>
      </div>

      <div className="mt-1.5 grid grid-cols-5 gap-x-1.5 gap-y-1.5">
        {item.slots.map((slot, index) => {
          const hasImage = !!slot?.imageUrl
          const initial = slot?.name?.trim()?.slice(0, 1) ?? ""
          return (
            <div key={index} className="group relative">
              <div
                className={cn(
                  "bg-muted/20 flex size-16 items-center justify-center rounded-md ring-2 ring-inset",
                  ringClassForIndex(index)
                )}
              >
                {hasImage ? (
                  <Image
                    src={slot!.imageUrl!}
                    alt={slot?.name ?? "魔物"}
                    width={64}
                    height={64}
                    className="block size-16 rounded-md object-cover"
                    priority={false}
                  />
                ) : slot ? (
                  <span className="select-none text-2xl leading-none font-bold text-slate-700 dark:text-slate-200">
                    {initial}
                  </span>
                ) : null}
              </div>

              {slot && (
                <div className="pointer-events-none absolute left-1/2 top-0 z-50 hidden w-64 -translate-x-1/2 -translate-y-[calc(100%+8px)] group-hover:block">
                  <div
                    className={cn(
                      "bg-popover text-popover-foreground border-2 shadow-md",
                      "rounded-lg p-3 text-xs leading-relaxed",
                      borderClassForIndex(index)
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold">
                          {slot.name}
                        </div>
                        <div className="text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span className="bg-muted rounded px-1.5 py-0.5">
                            {slot.element}
                          </span>
                          <span className="bg-muted rounded px-1.5 py-0.5">
                            {slot.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-muted-foreground mt-2">
                      {slot.mainEffect}
                    </div>
                    {slot.hasFourStar && slot.fourStarEffect && (
                      <div className="text-muted-foreground mt-1">
                        4星：{slot.fourStarEffect}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
        <span>创建：{formatIso(item.createdAt)}</span>
        <span>修改：{formatIso(item.updatedAt)}</span>
      </div>
    </div>
  )
}

export type { MonsterSlot, SummonListItem }
export { SummonCard }
