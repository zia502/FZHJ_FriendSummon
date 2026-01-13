"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { createWeaponBoardAction, INITIAL_STATE, type CreateWeaponBoardState } from "@/app/weapon-share/actions"
import { WeaponBoardCard, type WeaponBoardListItem } from "@/components/weapon-board-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type SortMode = "time" | "likes"

function WeaponSharePage({
  initialItems,
  page,
  hasPrev,
  hasNext,
  sort,
  saved,
}: {
  initialItems: WeaponBoardListItem[]
  page: number
  hasPrev: boolean
  hasNext: boolean
  sort: SortMode
  saved: boolean
}) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement | null>(null)
  const [showForm, setShowForm] = React.useState(false)

  const [state, formAction, isPending] = React.useActionState<
    CreateWeaponBoardState,
    FormData
  >(createWeaponBoardAction, INITIAL_STATE)

  const linkFor = React.useCallback(
    (next: { page?: number; sort?: SortMode; saved?: boolean }) => {
      const nextPage = next.page ?? page
      const nextSort = next.sort ?? sort
      const nextSaved = next.saved ?? false
      const query = new URLSearchParams()
      query.set("page", String(nextPage))
      if (nextSort !== "time") query.set("sort", nextSort)
      if (nextSaved) query.set("saved", "1")
      return `/weapon-share?${query.toString()}`
    },
    [page, sort]
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
                  placeholder="例如：奥丁枪 / 纯土短"
                  aria-invalid={!!fieldError.name}
                />
                {fieldError.name && (
                  <div className="text-destructive text-xs">{fieldError.name}</div>
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
                  placeholder="可以写配盘思路 / 轴 / 备注..."
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

        <div className="mt-3 grid gap-2">
          {initialItems.length > 0 ? (
            initialItems.map((item) => <WeaponBoardCard key={item.id} item={item} />)
          ) : (
            <div className="text-muted-foreground text-sm">暂无分享</div>
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
