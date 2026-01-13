"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { SummonCard, type SummonListItem } from "@/components/summon-card"
import type { MonsterOption } from "@/components/share-dialog"

type SlotColumnKey = "火" | "风" | "土" | "水" | "任意"
type MatchMode = "fuzzy" | "exact"
type SortMode = "time" | "likes"

function FriendSummonPage({
  initialItems,
  monsters,
  page,
  hasPrev,
  hasNext,
  sort,
}: {
  initialItems: SummonListItem[]
  monsters: MonsterOption[]
  page: number
  hasPrev: boolean
  hasNext: boolean
  sort: SortMode
}) {
  const items = initialItems
  const [filters, setFilters] = React.useState<Record<SlotColumnKey, string[]>>({
    火: [],
    风: [],
    土: [],
    水: [],
    任意: [],
  })
  const [matchMode, setMatchMode] = React.useState<MatchMode>("fuzzy")

  const linkFor = React.useCallback(
    (next: { page?: number; sort?: SortMode }) => {
      const nextPage = next.page ?? page
      const nextSort = next.sort ?? sort
      const query = new URLSearchParams()
      query.set("page", String(nextPage))
      if (nextSort !== "time") query.set("sort", nextSort)
      return `/?${query.toString()}`
    },
    [page, sort]
  )

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

      const matches = (selected: string[], candidates: string[]) => {
        if (selected.length === 0) return true
        if (matchMode === "exact") {
          return selected.every((id) => candidates.includes(id))
        }
        return selected.some((id) => candidates.includes(id))
      }

      if (!matches(filters["火"], pick([0, 5]))) return false
      if (!matches(filters["风"], pick([1, 6]))) return false
      if (!matches(filters["土"], pick([2, 7]))) return false
      if (!matches(filters["水"], pick([3, 8]))) return false
      if (!matches(filters["任意"], pick([4, 9]))) return false

      return true
    })
  }, [items, filters, matchMode])

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
          <div className="flex items-center justify-between gap-3">
            <div className="text-muted-foreground text-xs">排序：</div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant={sort === "time" ? "default" : "outline"}
              >
                <Link href={linkFor({ page: 1, sort: "time" })}>时间</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant={sort === "likes" ? "default" : "outline"}
              >
                <Link href={linkFor({ page: 1, sort: "likes" })}>点赞</Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-muted-foreground text-xs">
              匹配方式：{matchMode === "exact" ? "精确（A 和 B）" : "模糊（A 或 B）"}
            </div>
            <label className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">模糊</span>
              <input
                type="checkbox"
                className="peer sr-only"
                checked={matchMode === "exact"}
                onChange={(e) => setMatchMode(e.target.checked ? "exact" : "fuzzy")}
              />
              <span className="bg-muted peer-checked:bg-primary peer-focus-visible:ring-ring ring-offset-background relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full ring-offset-2 transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2">
                <span className="bg-background shadow-sm peer-checked:translate-x-4 pointer-events-none inline-block h-4 w-4 translate-x-0.5 rounded-full transition-transform" />
              </span>
              <span className="text-muted-foreground text-xs">精确</span>
            </label>
          </div>
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
                      多选（{matchMode === "exact" ? "A 和 B" : "A 或 B"}）
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
            <Link href={linkFor({ page: Math.max(1, page - 1) })}>上一页</Link>
          </Button>
          <div className="text-muted-foreground text-sm">第 {page} 页</div>
          <Button asChild variant="outline" disabled={!hasNext}>
            <Link href={linkFor({ page: page + 1 })}>下一页</Link>
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
