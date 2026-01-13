"use client"

import * as React from "react"
import Link from "next/link"
import { ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type WeaponBoardListItem = {
  id: string
  name: string
  element?: "火" | "风" | "土" | "水"
  type?: "神" | "魔" | "其他"
  description?: string
  likes: number
}

function elementTextClass(element: WeaponBoardListItem["element"]) {
  if (element === "火") return "text-red-600 dark:text-red-400"
  if (element === "风") return "text-green-600 dark:text-green-400"
  if (element === "土") return "text-amber-700 dark:text-amber-300"
  if (element === "水") return "text-blue-600 dark:text-blue-400"
  return "text-muted-foreground"
}

function WeaponBoardCard({ item }: { item: WeaponBoardListItem }) {
  const [likes, setLikes] = React.useState(item.likes ?? 0)
  const [liked, setLiked] = React.useState(false)

  React.useEffect(() => {
    setLikes(item.likes ?? 0)
  }, [item.likes])

  React.useEffect(() => {
    try {
      const key = `fzhj_weaponboards:liked:${item.id}`
      setLiked(localStorage.getItem(key) === "1")
    } catch {
      setLiked(false)
    }
  }, [item.id])

  const handleLike = React.useCallback(async () => {
    if (liked) return

    setLiked(true)

    try {
      const res = await fetch("/api/weapon-boards/like", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { likes?: number; didLike?: boolean }
      if (typeof data.likes === "number") setLikes(data.likes)
      if (data.didLike === false) setLiked(true)

      try {
        const key = `fzhj_weaponboards:liked:${item.id}`
        localStorage.setItem(key, "1")
      } catch {
        // ignore
      }
    } catch {
      setLiked(false)
    }
  }, [item.id, liked])

  return (
    <div className="ring-foreground/10 bg-card text-card-foreground rounded-xl px-3 py-2.5 ring-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={cn(
                "bg-muted/50 rounded px-1.5 py-0.5 text-xs font-semibold",
                elementTextClass(item.element)
              )}
            >
              {item.element ?? "未知"}
            </span>
            <span className="bg-muted/50 text-muted-foreground rounded px-1.5 py-0.5 text-xs font-medium">
              {item.type ?? "未知"}
            </span>
          </div>
          <div className="truncate text-sm font-bold tracking-tight">
            {item.name}
          </div>
          {item.description ? (
            <div className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
              {item.description}
            </div>
          ) : (
            <div className="text-muted-foreground mt-1 text-xs">（无描述）</div>
          )}
        </div>

        <div className="shrink-0">
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
      </div>

      <div className="mt-2 flex items-center justify-end gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/weapon-share/${encodeURIComponent(item.id)}`}>显示详情</Link>
        </Button>
      </div>
    </div>
  )
}

export type { WeaponBoardListItem }
export { WeaponBoardCard }
