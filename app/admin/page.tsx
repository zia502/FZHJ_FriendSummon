import { cookies } from "next/headers"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { adminLogin, adminLogout } from "@/app/admin/actions"
import { addMonsterAction, deleteMonsterAction } from "@/app/admin/monsters/actions"
import { getMonsters, type MonsterElement, type MonsterType } from "@/lib/monsters-store"

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
  const q = String(params?.q ?? "").trim()
  const type = String(params?.type ?? "").trim()
  const element = String(params?.element ?? "").trim()

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

  const typeParam = (type === "神" || type === "魔" || type === "属性" || type === "全部" ? type : "全部") as
    | MonsterType
    | "全部"

  const elementParam = (element === "火" ||
  element === "风" ||
  element === "土" ||
  element === "水" ||
  element === "其他" ||
  element === "全部"
    ? element
    : "全部") as MonsterElement | "全部"

  const filtered = await getMonsters({
    q,
    type: typeParam,
    element: elementParam,
    limit: 5,
  })

  const typeOptions: Array<MonsterType> = ["神", "魔", "属性"]
  const elementOptions: Array<MonsterElement> = ["火", "风", "土", "水", "其他"]

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-foreground text-xl font-bold tracking-tight">
          后台管理
        </h1>
        <form action={adminLogout}>
          <Button type="submit" variant="outline" size="sm">
            退出
          </Button>
        </form>
      </div>

      <div className="text-muted-foreground mt-2 text-xs">
        当前权限：{isSuperAdmin ? "超级管理员" : "管理员"}
      </div>

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
              <div className="text-sm font-medium">主位被动（必填）</div>
              <Textarea
                name="mainEffect"
                placeholder="请输入主位被动描述"
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
                <div className="text-sm font-semibold">最新添加的 5 个魔物</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  支持按 名字/效果/类型 搜索
                </div>
              </div>
            </div>

            <form className="mt-3 grid gap-2" action="/admin" method="get">
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
    </main>
  )
}
