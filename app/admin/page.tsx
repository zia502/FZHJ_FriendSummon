import { cookies } from "next/headers"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { adminLogin, adminLogout } from "@/app/admin/actions"
import { deleteFriendSummonAction } from "@/app/admin/friend-summons/actions"
import { addHeihuaTermAction, deleteHeihuaTermAction } from "@/app/admin/heihua/actions"
import { addMonsterAction, deleteMonsterAction } from "@/app/admin/monsters/actions"
import { AdminModuleSelector } from "@/app/admin/module-selector"
import { getFriendSummonByPlayerId } from "@/lib/friend-summons-store"
import { getHeihuaTerms } from "@/lib/heihua-store"
import { getMonstersPage, type MonsterElement, type MonsterType } from "@/lib/monsters-store"
import {
  getWeaponBoardsPage,
  type WeaponBoardElement,
  type WeaponBoardSortMode,
  type WeaponBoardType,
} from "@/lib/weapon-boards-store"

function withVersion(url: string | undefined, version: string | undefined) {
  if (!url) return undefined
  if (!version) return url
  const joiner = url.includes("?") ? "&" : "?"
  return `${url}${joiner}v=${encodeURIComponent(version)}`
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const cookieStore = await cookies()
  const authed = cookieStore.get("admin_auth")?.value === "1"
  const role = cookieStore.get("admin_role")?.value
  const isSuperAdmin = role === "super"

  const params = await searchParams
  const errorParam = String(params?.error ?? "")
  const hasError = errorParam === "1"
  const forbidden = errorParam === "forbidden"
  const debug = String(params?.debug ?? "") === "1"

  const adminConfigured = !!(process.env.ADMIN_PASSWORD ?? "").trim()
  const superConfigured = !!(process.env.SUPER_ADMIN_PASSWORD ?? "").trim()
  const missingEnv =
    errorParam === "missing_env" ||
    (!adminConfigured && !superConfigured)

  const modulesRaw = String(params?.modules ?? "").trim()
  const moduleItems: Array<{ key: string; label: string }> = [
    { key: "monsters", label: "魔物管理" },
    { key: "weapon-boards", label: "武器盘管理" },
    { key: "heihua", label: "黑话编辑" },
    ...(isSuperAdmin ? [{ key: "friend-summons", label: "好友募集查询器" }] : []),
  ]
  const moduleAllow = new Set(moduleItems.map((m) => m.key))
  const selectedModules = new Set(
    modulesRaw
      ? modulesRaw
          .split(",")
          .map((s) => s.trim())
          .filter((k) => k && moduleAllow.has(k))
      : moduleItems.map((m) => m.key)
  )
  const showMonsters = selectedModules.has("monsters")
  const showWeaponBoards = selectedModules.has("weapon-boards")
  const showHeihua = selectedModules.has("heihua")
  const showFriendSummons =
    isSuperAdmin && selectedModules.has("friend-summons")

  const q = String(params?.q ?? "").trim()
  const type = String(params?.type ?? "").trim()
  const element = String(params?.element ?? "").trim()
  const mPageRaw = String(params?.m_page ?? "").trim()
  const mPage = Math.max(1, Number(mPageRaw || 1) || 1)

  const hq = String(params?.h_q ?? "").trim()

  const wbq = String(params?.wb_q ?? "").trim()
  const wbElementRaw = String(params?.wb_element ?? "全部").trim()
  const wbTypeRaw = String(params?.wb_type ?? "全部").trim()
  const wbSortRaw = String(params?.wb_sort ?? "").trim()
  const wbPageRaw = String(params?.wb_page ?? "").trim()
  const wbPage = Math.max(1, Number(wbPageRaw || 1) || 1)

  const fsPlayerId = String(params?.fs_playerId ?? "").trim()
  const fsError = String(params?.fs_error ?? "").trim()
  const fsDeleted = String(params?.fs_deleted ?? "").trim()
  const friendSummonRecord =
    showFriendSummons && fsPlayerId
      ? await getFriendSummonByPlayerId(fsPlayerId)
      : null

  if (!authed) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>后台管理</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={adminLogin} className="grid gap-3">
              <div className="text-muted-foreground text-sm">
                请输入密码后进入后台管理页面。
              </div>
              {missingEnv && (
                <div className="text-destructive text-sm">
                  未配置 `ADMIN_PASSWORD`/`SUPER_ADMIN_PASSWORD`，请在本地 `.env` 或
                  `.env.local` 里设置后重启服务。
                </div>
              )}
              {debug && (
                <div className="text-muted-foreground text-xs">
                  环境变量：ADMIN_PASSWORD {adminConfigured ? "已配置" : "未配置"} /
                  SUPER_ADMIN_PASSWORD {superConfigured ? "已配置" : "未配置"}
                </div>
              )}
              <Input
                name="password"
                type="password"
                placeholder="密码"
                aria-invalid={hasError || undefined}
                disabled={missingEnv}
              />
              {hasError && (
                <div className="text-destructive text-sm">密码错误</div>
              )}
              {forbidden && (
                <div className="text-destructive text-sm">
                  权限不足：需要超级管理员。
                </div>
              )}
              <Button type="submit" disabled={missingEnv}>
                进入
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    )
  }

  const typeOptions: Array<MonsterType> = ["神", "魔", "属性", "其他"]
  const elementOptions: Array<MonsterElement> = ["火", "风", "土", "水"]

  const typeParam = (type === "神" ||
  type === "魔" ||
  type === "属性" ||
  type === "其他" ||
  type === "全部"
    ? type
    : "全部") as MonsterType | "全部"

  const elementParam = (element === "火" ||
  element === "风" ||
  element === "土" ||
  element === "水" ||
  element === "全部"
    ? element
    : "全部") as MonsterElement | "全部"

  const monstersPage = showMonsters
    ? await getMonstersPage({
        q,
        type: typeParam,
        element: elementParam,
        page: mPage,
        pageSize: 5,
      })
    : { items: [], hasPrev: false, hasNext: false, page: 1, pageSize: 5 }

  const { items: filtered, hasPrev: mHasPrev, hasNext: mHasNext, page: mPageSafe } =
    monstersPage

  const heihuaTerms = showHeihua ? await getHeihuaTerms({ q: hq, limit: 30 }) : []

  const wbElement = (wbElementRaw === "火" ||
  wbElementRaw === "风" ||
  wbElementRaw === "土" ||
  wbElementRaw === "水"
    ? wbElementRaw
    : "全部") as WeaponBoardElement | "全部"

  const wbType = (wbTypeRaw === "神" ||
  wbTypeRaw === "魔" ||
  wbTypeRaw === "其他"
    ? wbTypeRaw
    : "全部") as WeaponBoardType | "全部"

  const wbSort = (wbSortRaw === "likes" ? "likes" : "time") as WeaponBoardSortMode

  const weaponBoardsPage = showWeaponBoards
    ? await getWeaponBoardsPage({
        page: wbPage,
        pageSize: 5,
        sort: wbSort,
        q: wbq,
        element: wbElement,
        type: wbType,
      })
    : { items: [], hasPrev: false, hasNext: false, page: 1, pageSize: 5 }

  const {
    items: wbItems,
    hasPrev: wbHasPrev,
    hasNext: wbHasNext,
    page: wbPageSafe,
  } = weaponBoardsPage

  const wbElementOptions: Array<WeaponBoardElement> = ["火", "风", "土", "水"]
  const wbTypeOptions: Array<WeaponBoardType> = ["神", "魔", "其他"]

  const monstersHref = (page: number) => {
    const query = new URLSearchParams()
    if (modulesRaw) query.set("modules", modulesRaw)
    if (q) query.set("q", q)
    if (type) query.set("type", type)
    if (element) query.set("element", element)
    query.set("m_page", String(page))
    return `/admin?${query.toString()}#monsters`
  }

  const weaponBoardsHref = (page: number) => {
    const query = new URLSearchParams()
    if (modulesRaw) query.set("modules", modulesRaw)
    if (wbq) query.set("wb_q", wbq)
    if (wbElementRaw) query.set("wb_element", wbElementRaw)
    if (wbTypeRaw) query.set("wb_type", wbTypeRaw)
    if (wbSortRaw) query.set("wb_sort", wbSortRaw)
    query.set("wb_page", String(page))
    return `/admin?${query.toString()}#weapon-boards`
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-foreground text-xl font-bold tracking-tight">
          后台管理
        </h1>
        <div className="flex items-center gap-2">
          <AdminModuleSelector items={moduleItems} />
          <form action={adminLogout}>
            <Button type="submit" variant="outline" size="sm">
              退出
            </Button>
          </form>
        </div>
      </div>

      <div className="text-muted-foreground mt-2 text-xs">
        当前权限：{isSuperAdmin ? "超级管理员" : "管理员"}
      </div>

      {selectedModules.size === 0 && (
        <div className="text-muted-foreground mt-4 text-sm">
          请点击右上角「管理模块」下拉框，勾选要显示的管理功能。
        </div>
      )}

      {showMonsters && (
      <Card className="mt-4" id="monsters">
        <CardHeader>
          <CardTitle>魔物管理</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={addMonsterAction}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <div className="text-sm font-medium">魔物名（必填）</div>
              <Input name="name" placeholder="例如：巴哈姆特" required />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">备注（可选）</div>
              <Input
                name="note"
                placeholder="例如：修斯 / 海神 / 队伍简称"
                maxLength={64}
              />
              <div className="text-muted-foreground text-xs">
                备注会在招募列表的过滤器里以“（备注）”显示，方便辨认。
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">5星主位被动（必填）</div>
              <Textarea
                name="mainEffect"
                placeholder="请输入5星主位被动描述"
                required
              />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">属性（必选）</div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {elementOptions.map((el) => (
                  <label key={el} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="element"
                      value={el}
                      className="accent-primary"
                      required
                    />
                    <span>{el}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">主位被动类型（必选）</div>
              <div className="flex items-center gap-4">
                {typeOptions.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="type"
                      value={t}
                      className="accent-primary"
                      required
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">魔物图片（可选）</div>
              <Input name="image" type="file" accept="image/*" />
            </div>

            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="hasFourStar" className="accent-primary" />
                有 未满突主位被动（可选）
              </label>
              <Textarea
                name="fourStarEffect"
                placeholder="勾选后填写 未满突主位被动"
              />
              <div className="text-muted-foreground text-xs">
                注意：勾选后 未满突效果将变为必填（校验在服务端）。
              </div>
            </div>

            <Button type="submit">提交魔物</Button>
          </form>

          <div className="mt-6 border-t pt-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">
                  {q || type || element ? "搜索结果" : "最新添加的 5 个魔物"}
                  {mPageSafe > 1 ? `（第 ${mPageSafe} 页）` : ""}
                </div>
                <div className="text-muted-foreground mt-1 text-xs">
                  支持按 名字/效果/类型 搜索
                </div>
              </div>
            </div>

            <form className="mt-3 grid gap-2" action="/admin#monsters" method="get">
              {modulesRaw && (
                <input type="hidden" name="modules" value={modulesRaw} />
              )}
              <input type="hidden" name="m_page" value="1" />
              <div className="flex items-center gap-2">
                <Input
                  name="q"
                  placeholder="搜索：名字/效果"
                  defaultValue={q}
                />
                <Button type="submit" variant="outline">
                  搜索
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  name="element"
                  defaultValue={element || "全部"}
                  className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
                >
                  <option value="全部">全部属性</option>
                  {elementOptions.map((el) => (
                    <option key={el} value={el}>
                      {el}
                    </option>
                  ))}
                </select>
                <select
                  name="type"
                  defaultValue={type || "全部"}
                  className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
                >
                  <option value="全部">全部类型</option>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </form>

            <div className="mt-3 grid gap-2">
              {filtered.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  暂无数据{q || type || element ? "（无匹配结果）" : ""}。
                </div>
              ) : (
                filtered.map((monster) => (
                  <div
                    key={monster.id}
                    className="ring-foreground/10 bg-background flex items-start gap-3 rounded-lg p-3 ring-1"
                  >
                    <div className="bg-muted ring-foreground/10 overflow-hidden rounded-md ring-1">
                      <Image
                        src={withVersion(monster.imageUrl, monster.updatedAt) ?? "/summon-placeholder.svg"}
                        alt={monster.name}
                        width={48}
                        height={48}
                        className="size-12 object-cover"
                        unoptimized={(withVersion(monster.imageUrl, monster.updatedAt) ?? "").startsWith("/uploads/")}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-semibold">
                          {monster.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="bg-muted text-foreground/80 rounded-md px-2 py-0.5 text-xs">
                            {monster.element}
                          </span>
                          <span className="bg-muted text-foreground/80 rounded-md px-2 py-0.5 text-xs">
                            {monster.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {monster.mainEffect}
                      </div>
                      {monster.note && (
                        <div className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                          备注：{monster.note}
                        </div>
                      )}
                      {monster.hasFourStar && monster.fourStarEffect && (
                        <div className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                          未满突：{monster.fourStarEffect}
                        </div>
                      )}
                      {isSuperAdmin && (
                        <div className="mt-2 flex items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/monsters/${monster.id}`}>
                              编辑
                            </Link>
                          </Button>
                          <form action={deleteMonsterAction}>
                            <input type="hidden" name="id" value={monster.id} />
                            <Button size="sm" variant="destructive" type="submit">
                              删除
                            </Button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <Button asChild variant="outline" size="sm" disabled={!mHasPrev}>
                <Link href={monstersHref(Math.max(1, mPageSafe - 1))}>上一页</Link>
              </Button>
              <div className="text-muted-foreground text-xs">
                第 {mPageSafe} 页
              </div>
              <Button asChild variant="outline" size="sm" disabled={!mHasNext}>
                <Link href={monstersHref(mPageSafe + 1)}>下一页</Link>
              </Button>
            </div>

            <div className="text-muted-foreground mt-3 text-xs">
              <span className="ml-2">
                <Link href="#monsters" className="underline underline-offset-2">
                  回到顶部
                </Link>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {showWeaponBoards && (
        <Card className="mt-4" id="weapon-boards">
          <CardHeader>
            <CardTitle>武器盘管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              支持按名称/属性/类型筛选。编辑需要超级管理员权限。
            </div>

            <form
              className="mt-3 grid gap-2"
              action="/admin#weapon-boards"
              method="get"
            >
              {modulesRaw && (
                <input type="hidden" name="modules" value={modulesRaw} />
              )}
              <input type="hidden" name="wb_page" value="1" />

              <div className="flex items-center gap-2">
                <Input
                  name="wb_q"
                  placeholder="搜索：武器盘名"
                  defaultValue={wbq}
                />
                <Button type="submit" variant="outline">
                  搜索
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  name="wb_element"
                  defaultValue={wbElement}
                  className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
                >
                  <option value="全部">全部属性</option>
                  {wbElementOptions.map((el) => (
                    <option key={el} value={el}>
                      {el}
                    </option>
                  ))}
                </select>
                <select
                  name="wb_type"
                  defaultValue={wbType}
                  className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
                >
                  <option value="全部">全部类型</option>
                  {wbTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  name="wb_sort"
                  defaultValue={wbSort}
                  className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
                >
                  <option value="time">按更新时间</option>
                  <option value="likes">按点赞</option>
                </select>
              </div>
            </form>

            <div className="mt-3 grid gap-2">
              {wbItems.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  暂无数据{wbq ? "（无匹配结果）" : "。"}
                </div>
              ) : (
                wbItems.map((b) => (
                  <div
                    key={b.id}
                    className="ring-foreground/10 bg-background grid gap-2 rounded-lg p-3 ring-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {b.name}
                        </div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          ID：{b.id}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/weapon-share/${b.id}`}>查看</Link>
                        </Button>
                        {isSuperAdmin && (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/weapon-boards/${b.id}`}>
                              编辑
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
                      <span className="truncate">
                        属性：{b.element || "（未填）"} / 类型：
                        {b.type || "（未填）"}
                      </span>
                      <span className="tabular-nums">👍 {b.likes}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={!wbHasPrev}
              >
                <Link href={weaponBoardsHref(Math.max(1, wbPageSafe - 1))}>
                  上一页
                </Link>
              </Button>
              <div className="text-muted-foreground text-xs">
                第 {wbPageSafe} 页
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={!wbHasNext}
              >
                <Link href={weaponBoardsHref(wbPageSafe + 1)}>下一页</Link>
              </Button>
            </div>

            <div className="text-muted-foreground mt-3 text-xs">
              <Link href="/weapon-share" className="underline underline-offset-2">
                前台预览：武器盘分享
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {showFriendSummons && (
        <Card className="mt-4" id="friend-summons">
          <CardHeader>
            <CardTitle>好友募集查询器</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              用于通过玩家ID定位/清理异常好友募集记录。
            </div>

            <form
              className="mt-3 grid gap-2"
              action="/admin#friend-summons"
              method="get"
            >
              {modulesRaw && (
                <input type="hidden" name="modules" value={modulesRaw} />
              )}
              <div className="flex items-center gap-2">
                <Input
                  name="fs_playerId"
                  placeholder="玩家ID（playerId）"
                  defaultValue={fsPlayerId}
                />
                <Button type="submit" variant="outline">
                  查询
                </Button>
              </div>
            </form>

            {fsError === "missing_id" && (
              <div className="text-destructive mt-2 text-sm">请输入玩家ID</div>
            )}
            {fsError === "confirm_mismatch" && (
              <div className="text-destructive mt-2 text-sm">
                确认ID不一致，未执行删除
              </div>
            )}
            {fsDeleted === "1" && <div className="mt-2 text-sm">已删除记录</div>}
            {fsDeleted === "0" && (
              <div className="text-muted-foreground mt-2 text-sm">
                未找到可删除记录
              </div>
            )}

            {fsPlayerId && (
              <div className="mt-4 grid gap-3">
                {friendSummonRecord ? (
                  <>
                    <div className="ring-foreground/10 bg-background grid gap-2 rounded-lg p-3 ring-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold">
                          玩家ID：{friendSummonRecord.playerId}
                        </div>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        createdAt：{friendSummonRecord.createdAt}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        updatedAt：{friendSummonRecord.updatedAt}
                      </div>
                      <div className="mt-2 grid gap-1">
                        {friendSummonRecord.slotIds.map((slotId, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 text-xs"
                          >
                            <span className="text-muted-foreground">
                              槽位{idx + 1}
                            </span>
                            <code className="bg-muted text-foreground/80 rounded px-2 py-0.5">
                              {slotId ?? "-"}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>

                    <form
                      action={deleteFriendSummonAction}
                      className="grid gap-2"
                    >
                      <input
                        type="hidden"
                        name="playerId"
                        value={friendSummonRecord.playerId}
                      />
                      <div className="text-muted-foreground text-xs">
                        删除操作不可逆：请再次输入同样的玩家ID以确认。
                      </div>
                      <Input
                        name="confirmPlayerId"
                        placeholder="确认玩家ID（必须完全一致）"
                      />
                      <Button type="submit" variant="destructive">
                        删除这条记录
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    未找到记录：{fsPlayerId}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showHeihua && (
      <Card className="mt-4" id="heihua">
        <CardHeader>
          <CardTitle>黑话编辑</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addHeihuaTermAction} className="grid gap-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium">黑话（必填）</div>
              <Input name="term" placeholder="例如：XX" required />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">解释（必填）</div>
              <Textarea name="meaning" placeholder="支持换行" required />
            </div>
            <Button type="submit">提交黑话</Button>
            {!isSuperAdmin && (
              <div className="text-muted-foreground text-xs">
                当前为管理员权限：可新增；编辑/删除需要超级管理员。
              </div>
            )}
          </form>

          <div className="mt-6 border-t pt-4">
            <div className="text-sm font-semibold">
              {hq ? "搜索结果" : "最新黑话"}
            </div>

            <form className="mt-3 grid gap-2" action="/admin#heihua" method="get">
              {modulesRaw && (
                <input type="hidden" name="modules" value={modulesRaw} />
              )}
              <div className="flex items-center gap-2">
                <Input
                  name="h_q"
                  placeholder="搜索：黑话 / 解释"
                  defaultValue={hq}
                />
                <Button type="submit" variant="outline">
                  搜索
                </Button>
              </div>
            </form>

            <div className="mt-3 grid gap-2">
              {heihuaTerms.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  暂无数据{hq ? "（无匹配结果）" : "。"}
                </div>
              ) : (
                heihuaTerms.map((t) => (
                  <div
                    key={t.id}
                    className="ring-foreground/10 bg-background grid gap-2 rounded-lg p-3 ring-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <code className="bg-primary/10 text-primary rounded px-2 py-1 text-sm font-semibold">
                        {t.term}
                      </code>
                      {isSuperAdmin && (
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/heihua/${t.id}`}>编辑</Link>
                          </Button>
                          <form action={deleteHeihuaTermAction}>
                            <input type="hidden" name="id" value={t.id} />
                            <Button type="submit" size="sm" variant="destructive">
                              删除
                            </Button>
                          </form>
                        </div>
                      )}
                    </div>
                    <div className="text-muted-foreground max-h-20 overflow-hidden whitespace-pre-wrap text-sm leading-relaxed">
                      {t.meaning}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="text-muted-foreground mt-3 text-xs">
              <Link href="/heihua" className="underline underline-offset-2">
                前台预览：黑话
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </main>
  )
}
