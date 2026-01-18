import Image from "next/image"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateWeaponBoardAction } from "@/app/admin/weapon-boards/actions"
import {
  getWeaponBoardById,
  type WeaponBoardElement,
  type WeaponBoardType,
} from "@/lib/weapon-boards-store"

function withVersion(url: string | undefined, version: string | undefined) {
  if (!url) return undefined
  if (!version) return url
  const joiner = url.includes("?") ? "&" : "?"
  return `${url}${joiner}v=${encodeURIComponent(version)}`
}

export default async function WeaponBoardEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const cookieStore = await cookies()
  const authed = cookieStore.get("admin_auth")?.value === "1"
  const role = cookieStore.get("admin_role")?.value
  if (!authed) redirect("/admin")
  if (role !== "super") redirect("/admin?error=forbidden")

  const { id } = await params
  const board = await getWeaponBoardById(id)
  if (!board) redirect("/admin#weapon-boards")

  const elementOptions: Array<WeaponBoardElement> = ["火", "风", "土", "水"]
  const typeOptions: Array<WeaponBoardType> = ["神", "魔", "其他"]

  const images: Array<{
    label: string
    url?: string
    version?: string
  }> = [
    { label: "武器盘图", url: board.boardImageUrl, version: board.updatedAt },
    { label: "预测图", url: board.predictionImageUrl, version: board.updatedAt },
    { label: "队伍图 1", url: board.teamImageUrl0, version: board.updatedAt },
    { label: "队伍图 2", url: board.teamImageUrl1, version: board.updatedAt },
  ]

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-foreground text-xl font-bold tracking-tight">
          编辑武器盘
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin#weapon-boards">返回</Link>
        </Button>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="truncate">{board.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateWeaponBoardAction} className="grid gap-4">
            <input type="hidden" name="id" value={board.id} />

            <div className="grid gap-2">
              <div className="text-sm font-medium">武器盘名（必填）</div>
              <Input name="name" defaultValue={board.name} required />
              <div className="text-muted-foreground text-xs">ID：{board.id}</div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">属性（可选）</div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="element"
                    value=""
                    defaultChecked={!board.element}
                    className="accent-primary"
                  />
                  <span>不填写</span>
                </label>
                {elementOptions.map((el) => (
                  <label key={el} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="element"
                      value={el}
                      defaultChecked={board.element === el}
                      className="accent-primary"
                    />
                    <span>{el}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">类型（可选）</div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="type"
                    value=""
                    defaultChecked={!board.type}
                    className="accent-primary"
                  />
                  <span>不填写</span>
                </label>
                {typeOptions.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="type"
                      value={t}
                      defaultChecked={board.type === t}
                      className="accent-primary"
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">玩家ID（可选）</div>
              <Input
                name="playerId"
                defaultValue={board.playerId ?? ""}
                placeholder="纯数字，例如：123456789"
              />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">描述（可选）</div>
              <Textarea
                name="description"
                defaultValue={board.description ?? ""}
                placeholder="支持换行"
              />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">技能轴字符串（可选）</div>
              <Textarea
                name="skillShareCode"
                defaultValue={board.skillShareCode ?? ""}
                placeholder="可直接粘贴技能轴分享字符串"
              />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">武器盘图 URL（必填）</div>
              <Input
                name="boardImageUrl"
                defaultValue={board.boardImageUrl}
                placeholder="例如：/uploads/weapon-boards/xxx.png 或 https://..."
                required
              />
              <div className="text-sm font-medium">替换上传（可选）</div>
              <Input name="boardImage" type="file" accept="image/*" />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">预测图 URL（可选）</div>
              <Input
                name="predictionImageUrl"
                defaultValue={board.predictionImageUrl ?? ""}
                placeholder="留空表示不展示"
              />
              <div className="text-sm font-medium">替换上传（可选）</div>
              <Input name="predictionImage" type="file" accept="image/*" />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">队伍图 1 URL（可选）</div>
              <Input
                name="teamImageUrl0"
                defaultValue={board.teamImageUrl0 ?? ""}
                placeholder="留空表示不展示"
              />
              <div className="text-sm font-medium">替换上传（可选）</div>
              <Input name="teamImage0" type="file" accept="image/*" />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">队伍图 2 URL（可选）</div>
              <Input
                name="teamImageUrl1"
                defaultValue={board.teamImageUrl1 ?? ""}
                placeholder="留空表示不展示"
              />
              <div className="text-sm font-medium">替换上传（可选）</div>
              <Input name="teamImage1" type="file" accept="image/*" />
            </div>

            <Button type="submit">保存修改</Button>
          </form>

          <div className="mt-6 border-t pt-4">
            <div className="text-sm font-semibold">当前图片预览</div>
            <div className="mt-3 grid gap-3">
              {images.map((img) => (
                <div key={img.label} className="grid gap-2">
                  <div className="text-muted-foreground text-xs">{img.label}</div>
                  {img.url ? (
                    <div className="ring-foreground/10 bg-card rounded-xl p-2 ring-1">
                      <Image
                        src={withVersion(img.url, img.version) ?? img.url}
                        alt={img.label}
                        width={900}
                        height={900}
                        className="h-auto w-full rounded-lg object-contain"
                        unoptimized={img.url.startsWith("/uploads/")}
                      />
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">（未上传）</div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-muted-foreground mt-3 text-xs">
              <Link
                href={`/weapon-share/${board.id}`}
                className="underline underline-offset-2"
              >
                前台预览：武器盘分享
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

