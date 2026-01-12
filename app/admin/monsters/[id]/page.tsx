import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateMonsterAction } from "@/app/admin/monsters/actions"
import { getMonsterById, type MonsterElement, type MonsterType } from "@/lib/monsters-store"

export default async function MonsterEditPage({
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
  const monster = await getMonsterById(id)
  if (!monster) redirect("/admin#monsters")

  const typeOptions: Array<MonsterType> = ["神", "魔", "属性"]
  const elementOptions: Array<MonsterElement> = ["火", "风", "土", "水", "其他"]

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-foreground text-xl font-bold tracking-tight">
          编辑魔物
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin#monsters">返回</Link>
        </Button>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{monster.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateMonsterAction} className="grid gap-4">
            <input type="hidden" name="id" value={monster.id} />

            <div className="grid gap-2">
              <div className="text-sm font-medium">魔物名（必填）</div>
              <Input name="name" defaultValue={monster.name} required />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">5星主位被动（必填）</div>
              <Textarea name="mainEffect" defaultValue={monster.mainEffect} required />
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
                      defaultChecked={monster.element === el}
                      className="accent-primary"
                      required
                    />
                    <span>{el}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">类型（必选）</div>
              <div className="flex items-center gap-4">
                {typeOptions.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="type"
                      value={t}
                      defaultChecked={monster.type === t}
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
                <input
                  type="checkbox"
                  name="hasFourStar"
                  className="accent-primary"
                  defaultChecked={monster.hasFourStar}
                />
                有 未满突主位被动（可选）
              </label>
              <Textarea
                name="fourStarEffect"
                defaultValue={monster.fourStarEffect ?? ""}
                placeholder="勾选后填写 未满突主位被动"
              />
            </div>

            <Button type="submit">保存修改</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
