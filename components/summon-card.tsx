"use client"

import * as React from "react"
import Image from "next/image"
import { CopyIcon, ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function pad2(value: number) {
  return String(value).padStart(2, "0")
}

function formatUtc8(value: string) {
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return value

  // Deterministic formatting in UTC+8 (no locale differences).
  const shifted = new Date(ms + 8 * 60 * 60 * 1000)
  const y = shifted.getUTCFullYear()
  const m = pad2(shifted.getUTCMonth() + 1)
  const d = pad2(shifted.getUTCDate())
  const hh = pad2(shifted.getUTCHours())
  const mm = pad2(shifted.getUTCMinutes())
  const ss = pad2(shifted.getUTCSeconds())
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
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
  likes: number
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
  element: "火" | "风" | "土" | "水" | "光" | "暗" | "未设置"
  type: "神" | "魔" | "属性" | "其他"
  mainEffect: string
  note?: string
  hasFourStar: boolean
  fourStarEffect?: string
  imageUrl?: string
  star?: 4 | 5
}

function SummonCard({ item, className }: { item: SummonListItem; className?: string }) {
  const [likes, setLikes] = React.useState(item.likes ?? 0)
  const [liked, setLiked] = React.useState(false)
  const [openSlotIndex, setOpenSlotIndex] = React.useState<number | null>(null)
  const [coarsePointer, setCoarsePointer] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    setLikes(item.likes ?? 0)
  }, [item.likes])

  React.useEffect(() => {
    try {
      const key = `fzhj_friendsummon:liked:${item.playerId}`
      setLiked(localStorage.getItem(key) === "1")
    } catch {
      setLiked(false)
    }
  }, [item.playerId])

  const handleCopy = React.useCallback(() => {
    void copyToClipboard(item.playerId)
  }, [item.playerId])

  const handleLike = React.useCallback(async () => {
    if (liked) return

    setLiked(true)

    try {
      const res = await fetch("/api/friend-summons/like", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerId: item.playerId }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { likes?: number; didLike?: boolean }
      if (typeof data.likes === "number") setLikes(data.likes)
      if (data.didLike === false) {
        setLiked(true)
      }

      try {
        const key = `fzhj_friendsummon:liked:${item.playerId}`
        localStorage.setItem(key, "1")
      } catch {
        // ignore
      }
    } catch {
      setLiked(false)
    }
  }, [item.playerId, liked])

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

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const media = window.matchMedia("(hover: none), (pointer: coarse)")
    const sync = () => setCoarsePointer(!!media.matches)
    sync()

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync)
      return () => media.removeEventListener("change", sync)
    }

    media.addListener(sync)
    return () => media.removeListener(sync)
  }, [])

  React.useEffect(() => {
    if (!coarsePointer) return
    if (openSlotIndex === null) return

    const onPointerDown = (event: PointerEvent) => {
      const root = cardRef.current
      if (!root) return
      const target = event.target
      if (target instanceof Node && root.contains(target)) return
      setOpenSlotIndex(null)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenSlotIndex(null)
    }

    document.addEventListener("pointerdown", onPointerDown, { capture: true })
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, { capture: true })
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [coarsePointer, openSlotIndex])

  return (
    <div
      ref={cardRef}
      className={cn(
        "ring-foreground/10 bg-card text-card-foreground rounded-xl ring-1",
        "px-3 py-2.5",
        "relative",
        className
      )}
    >
      <div className="absolute right-2 top-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2"
          aria-label={liked ? "已点赞" : "点赞"}
          onClick={handleLike}
          disabled={liked}
        >
          <ThumbsUp className={cn("size-4", liked && "text-primary")} />
          <span className="text-xs tabular-nums">{likes}</span>
        </Button>
      </div>

      <div className="flex items-center justify-start gap-0 pr-12">
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
          const star = slot?.star ?? 5
          const isOpen = openSlotIndex === index
          return (
            <div key={index} className="group relative">
              {slot ? (
                <button
                  type="button"
                  className={cn(
                    "bg-muted/20 flex size-16 items-center justify-center rounded-md ring-2 ring-inset p-[2px] text-left",
                    ringClassForIndex(index),
                    coarsePointer && isOpen && "outline-none ring-offset-background ring-offset-2"
                  )}
                  aria-label={`查看 ${slot.name} 被动`}
                  aria-expanded={coarsePointer ? isOpen : undefined}
                  onClick={() => {
                    if (!coarsePointer) return
                    setOpenSlotIndex((prev) => (prev === index ? null : index))
                  }}
                >
                  {hasImage ? (
                    <div className="relative size-full">
                      <Image
                        src={slot.imageUrl!}
                        alt={slot.name ?? "魔物"}
                        width={64}
                        height={64}
                        className="block size-full rounded-[calc(var(--radius)-2px)] object-contain"
                        priority={false}
                        unoptimized={slot.imageUrl!.startsWith("/uploads/")}
                      />
                      <span
                        className={cn(
                          "bg-black/60 text-white shadow-sm",
                          "absolute left-1 top-1 rounded px-1 py-0.5 text-[10px] leading-none"
                        )}
                      >
                        ⭐{star}
                      </span>
                    </div>
                  ) : (
                    <span className="select-none text-2xl leading-none font-bold text-slate-700 dark:text-slate-200">
                      {initial}
                    </span>
                  )}
                </button>
              ) : (
                <div
                  className={cn(
                    "bg-muted/20 flex size-16 items-center justify-center rounded-md ring-2 ring-inset p-[2px]",
                    ringClassForIndex(index)
                  )}
                />
              )}

              {slot && (
                <div
                  className={cn(
                    "absolute left-1/2 top-0 z-50 w-64 -translate-x-1/2 -translate-y-[calc(100%+8px)]",
                    coarsePointer
                      ? isOpen
                        ? "block"
                        : "hidden"
                      : "hidden group-hover:block group-focus-within:block"
                  )}
                >
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
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
        <span>创建：{formatUtc8(item.createdAt)}</span>
        <span>修改：{formatUtc8(item.updatedAt)}</span>
      </div>
    </div>
  )
}

export type { MonsterSlot, SummonListItem }
export { SummonCard }
