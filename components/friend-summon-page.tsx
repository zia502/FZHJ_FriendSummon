"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { SummonCard, type SummonListItem } from "@/components/summon-card"
import type { MonsterOption } from "@/components/share-dialog"

type SlotColumnKey = "火" | "风" | "土" | "水" | "任意"

function FriendSummonPage({
  initialItems,
  monsters,
  page,
  hasPrev,
  hasNext,
}: {
  initialItems: SummonListItem[]
  monsters: MonsterOption[]
  page: number
  hasPrev: boolean
  hasNext: boolean
}) {
  const items = initialItems
  const [filters, setFilters] = React.useState<Record<SlotColumnKey, string[]>>({
    火: [],
    风: [],
    土: [],
    水: [],
    任意: [],
  })

  const monstersFor = React.useMemo(() => {
    return {
      火: monsters.filter((m) => m.element === "火"),
      风: monsters.filter((m) => m.element === "风"),
      土: monsters.filter((m) => m.element === "土"),
      水: monsters.filter((m) => m.element === "水"),
      任意: monsters,
    } satisfies Record<SlotColumnKey, MonsterOption[]>
  }, [monsters])

  const filtered = React.useMemo(() => {
    return items.filter((item) => {
      const pick = (indexes: number[]) =>
        indexes.map((i) => item.slots[i]?.id).filter(Boolean) as string[]

      const matchesAny = (selected: string[], candidates: string[]) => {
        if (selected.length === 0) return true
        return selected.some((id) => candidates.includes(id))
      }

      if (!matchesAny(filters["火"], pick([0, 5]))) return false
      if (!matchesAny(filters["风"], pick([1, 6]))) return false
      if (!matchesAny(filters["土"], pick([2, 7]))) return false
      if (!matchesAny(filters["水"], pick([3, 8]))) return false
      if (!matchesAny(filters["任意"], pick([4, 9]))) return false

      return true
    })
  }, [items, filters])

  const toggleFilter = React.useCallback(
    (el: SlotColumnKey, monsterId: string) => {
      setFilters((prev) => {
        const current = prev[el]
        const next = current.includes(monsterId)
          ? current.filter((id) => id !== monsterId)
          : [...current, monsterId]
        return { ...prev, [el]: next }
      })
    },
    []
  )

  const clearFilter = React.useCallback((el: SlotColumnKey) => {
    setFilters((prev) => ({ ...prev, [el]: [] }))
  }, [])

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-foreground text-xl font-bold tracking-tight">
            好友招募列表
          </h1>
          <Button asChild>
            <Link href="/share">我要分享</Link>
          </Button>
        </div>

        <div className="mt-3 grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            {(["火", "风", "土", "水", "任意"] as const).map((el) => (
              <details
                key={el}
                className="border-input bg-background rounded-md border"
              >
                <summary className="text-foreground flex cursor-pointer list-none items-center justify-between px-2 py-2 text-sm">
                  <span>
                    {el === "任意" ? "任意列" : `${el}属性`}
                    {filters[el].length > 0 ? `（${filters[el].length}）` : "（全部）"}
                  </span>
                  <span className="text-muted-foreground text-xs">展开</span>
                </summary>
                <div className="border-border max-h-48 overflow-auto border-t p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-muted-foreground text-xs">
                      多选（A 或 B）
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => clearFilter(el)}
                      disabled={filters[el].length === 0}
                    >
                      清空
                    </Button>
                  </div>
                  <div className="mt-2 grid gap-1">
                    {monstersFor[el].map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={filters[el].includes(m.id)}
                          onChange={() => toggleFilter(el, m.id)}
                          className="accent-primary"
                        />
                        <span className="truncate">
                          {m.name}
                          {m.note ? `（${m.note}）` : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </details>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilters({ 火: [], 风: [], 土: [], 水: [], 任意: [] })}
            >
              清空过滤
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {filtered.map((item) => (
            <SummonCard key={item.playerId} item={item} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button asChild variant="outline" disabled={!hasPrev}>
            <Link href={`/?page=${Math.max(1, page - 1)}`}>上一页</Link>
          </Button>
          <div className="text-muted-foreground text-sm">第 {page} 页</div>
          <Button asChild variant="outline" disabled={!hasNext}>
            <Link href={`/?page=${page + 1}`}>下一页</Link>
          </Button>
        </div>

        <div className="text-muted-foreground mt-6 text-center text-xs">
          如果遇到问题，请{" "}
          <a
            href="https://github.com/zia502/FZHJ_FriendSummon/issues"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            提交 issue
          </a>
        </div>
      </div>
    </main>
  )
}

export { FriendSummonPage }
