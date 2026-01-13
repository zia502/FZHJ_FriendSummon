"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { createWeaponBoardAction } from "@/app/weapon-share/actions"
import { WeaponBoardCard, type WeaponBoardListItem } from "@/components/weapon-board-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type SortMode = "time" | "likes"
type CreateWeaponBoardState = Awaited<ReturnType<typeof createWeaponBoardAction>>
const INITIAL_STATE: CreateWeaponBoardState = { ok: false }
type FilterElement = "全部" | "火" | "风" | "土" | "水"
type FilterType = "全部" | "神" | "魔" | "其他"

function WeaponSharePage({
  initialItems,
  page,
  hasPrev,
  hasNext,
  sort,
  saved,
  q,
  element,
  type,
}: {
  initialItems: WeaponBoardListItem[]
  page: number
  hasPrev: boolean
  hasNext: boolean
  sort: SortMode
  saved: boolean
  q: string
  element: FilterElement
  type: FilterType
}) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement | null>(null)
  const [showForm, setShowForm] = React.useState(false)

  const [state, formAction, isPending] = React.useActionState<
    CreateWeaponBoardState,
    FormData
  >(createWeaponBoardAction, INITIAL_STATE)

  const linkFor = React.useCallback(
    (next: {
      page?: number
      sort?: SortMode
      saved?: boolean
      q?: string
      element?: FilterElement
      type?: FilterType
    }) => {
      const nextPage = next.page ?? page
      const nextSort = next.sort ?? sort
      const nextSaved = next.saved ?? false
      const nextQ = next.q ?? q
      const nextElement = next.element ?? element
      const nextType = next.type ?? type

      const query = new URLSearchParams()
      query.set("page", String(nextPage))
      if (nextSort !== "time") query.set("sort", nextSort)
      if (nextSaved) query.set("saved", "1")
      if (nextQ) query.set("q", nextQ)
      if (nextElement !== "全部") query.set("element", nextElement)
      if (nextType !== "全部") query.set("type", nextType)
      return `/weapon-share?${query.toString()}`
    },
    [element, page, q, sort, type]
  )

  React.useEffect(() => {
    if (!state.ok || !state.createdId) return
    formRef.current?.reset()
    setShowForm(false)
    router.replace(linkFor({ page: 1, sort, saved: true }))
    router.refresh()
  }, [linkFor, router, sort, state.createdId, state.ok])

  React.useEffect(() => {
    if (state.ok) return
    if (state.formError) setShowForm(true)
    if (state.fieldErrors && Object.keys(state.fieldErrors).length > 0) {
      setShowForm(true)
    }
  }, [state.fieldErrors, state.formError, state.ok])

  const fieldError = state.fieldErrors ?? {}
  const showSaved = saved || (state.ok && !!state.createdId)

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-foreground text-xl font-bold tracking-tight">
            武器盘分享
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setShowForm((v) => !v)}
              aria-expanded={showForm}
              aria-controls="weapon-share-form"
            >
              {showForm ? "收起分享" : "我要分享"}
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/">返回首页</Link>
            </Button>
          </div>
        </div>

        {showSaved && (
          <div className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
            已发布
          </div>
        )}

        {showForm && (
          <div id="weapon-share-form" className="mt-4 rounded-xl border p-3">
            <div className="text-sm font-medium">我要分享</div>
            <div className="text-muted-foreground mt-1 text-xs">
              提交后会出现在下方列表中（同一玩家ID可多条）。
            </div>

            {state.formError && (
              <div className="text-destructive mt-3 text-sm">
                {state.formError}
              </div>
            )}

            <form ref={formRef} action={formAction} className="mt-4 grid gap-3">
              <div className="grid gap-1.5">
                <div className="text-sm font-medium">武器盘名（必填）</div>
                <Input
                  name="name"
                  placeholder="例如：火老王盘 / 火方阵单面满爆"
                  aria-invalid={!!fieldError.name}
                />
                {fieldError.name && (
                  <div className="text-destructive text-xs">{fieldError.name}</div>
                )}
              </div>

              <div className="grid gap-1.5">
                <div className="text-sm font-medium">属性（必填）</div>
                <select
                  name="element"
                  defaultValue=""
                  aria-invalid={!!fieldError.element}
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  <option value="" disabled>
                    请选择（火/风/土/水）
                  </option>
                  <option value="火">火</option>
                  <option value="风">风</option>
                  <option value="土">土</option>
                  <option value="水">水</option>
                </select>
                {fieldError.element && (
                  <div className="text-destructive text-xs">{fieldError.element}</div>
                )}
              </div>

              <div className="grid gap-1.5">
                <div className="text-sm font-medium">类型（必填）</div>
                <select
                  name="type"
                  defaultValue=""
                  aria-invalid={!!fieldError.type}
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  <option value="" disabled>
                    请选择（神/魔/其他）
                  </option>
                  <option value="神">神</option>
                  <option value="魔">魔</option>
                  <option value="其他">其他</option>
                </select>
                {fieldError.type && (
                  <div className="text-destructive text-xs">{fieldError.type}</div>
                )}
              </div>

              <div className="grid gap-1.5">
                <div className="text-sm font-medium">玩家 ID（纯数字，可选）</div>
                <Input
                  name="playerId"
                  placeholder="例如：12345678"
                  inputMode="numeric"
                  aria-invalid={!!fieldError.playerId}
                />
                {fieldError.playerId && (
                  <div className="text-destructive text-xs">
                    {fieldError.playerId}
                  </div>
                )}
              </div>

              <div className="grid gap-1.5">
                <div className="text-sm font-medium">描述（可选）</div>
                <Textarea
                  name="description"
                  placeholder="可以写配盘思路 / 备注..."
                />
              </div>

              <div className="grid gap-1.5">
                <div className="text-sm font-medium">武器盘图（必填，≤ 4MB）</div>
                <Input
                  name="boardImage"
                  type="file"
                  accept="image/*"
                  aria-invalid={!!fieldError.boardImage}
                />
                {fieldError.boardImage && (
                  <div className="text-destructive text-xs">
                    {fieldError.boardImage}
                  </div>
                )}
              </div>

              <div className="grid gap-1.5">
                <div className="text-sm font-medium">
                  武器盘预测图（可选，≤ 4MB）
                </div>
                <Input
                  name="predictionImage"
                  type="file"
                  accept="image/*"
                  aria-invalid={!!fieldError.predictionImage}
                />
                {fieldError.predictionImage && (
                  <div className="text-destructive text-xs">
                    {fieldError.predictionImage}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-medium">
                  队伍图片（可选，最多 2 张，≤ 4MB）
                </div>
                <Input
                  name="teamImage0"
                  type="file"
                  accept="image/*"
                  aria-invalid={!!fieldError.teamImage0}
                />
                {fieldError.teamImage0 && (
                  <div className="text-destructive text-xs">
                    {fieldError.teamImage0}
                  </div>
                )}
                <Input
                  name="teamImage1"
                  type="file"
                  accept="image/*"
                  aria-invalid={!!fieldError.teamImage1}
                />
                {fieldError.teamImage1 && (
                  <div className="text-destructive text-xs">
                    {fieldError.teamImage1}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={isPending}>
                {isPending ? "提交中..." : "发布"}
              </Button>
            </form>
          </div>
        )}

        <div className="mt-4 grid gap-2">
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
        </div>

        <form
          method="get"
          action="/weapon-share"
          className="mt-3 grid gap-2 rounded-xl border p-3"
        >
          <div className="text-sm font-medium">搜索/过滤</div>
          <div className="grid gap-2">
            <Input name="q" placeholder="搜索武器盘名" defaultValue={q} />
            <div className="grid grid-cols-2 gap-2">
              <select
                name="element"
                defaultValue={element}
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
              >
                <option value="全部">属性：全部</option>
                <option value="火">属性：火</option>
                <option value="风">属性：风</option>
                <option value="土">属性：土</option>
                <option value="水">属性：水</option>
              </select>
              <select
                name="type"
                defaultValue={type}
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
              >
                <option value="全部">类型：全部</option>
                <option value="神">类型：神</option>
                <option value="魔">类型：魔</option>
                <option value="其他">类型：其他</option>
              </select>
            </div>
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="page" value="1" />
            <div className="flex items-center justify-between gap-2">
              <Button type="submit" size="sm">
                应用
              </Button>
              <Button asChild type="button" size="sm" variant="outline">
                <Link href="/weapon-share">清空</Link>
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-3 grid gap-2">
          {initialItems.length > 0 ? (
            initialItems.map((item) => <WeaponBoardCard key={item.id} item={item} />)
          ) : (
            <div className="text-muted-foreground text-sm">暂无结果</div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button asChild variant="outline" disabled={!hasPrev}>
            <Link href={linkFor({ page: Math.max(1, page - 1), sort })}>上一页</Link>
          </Button>
          <div className="text-muted-foreground text-sm">第 {page} 页</div>
          <Button asChild variant="outline" disabled={!hasNext}>
            <Link href={linkFor({ page: page + 1, sort })}>下一页</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

export { WeaponSharePage }
