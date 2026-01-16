import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateHeihuaTermAction } from "@/app/admin/heihua/actions"
import { getHeihuaTermById } from "@/lib/heihua-store"

export default async function HeihuaEditPage({
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
  const term = await getHeihuaTermById(id)
  if (!term) redirect("/admin#heihua")

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-foreground text-xl font-bold tracking-tight">
          编辑黑话
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin#heihua">返回</Link>
        </Button>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>
            <code className="bg-primary/10 text-primary rounded px-2 py-1 text-sm font-semibold">
              {term.term}
            </code>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateHeihuaTermAction} className="grid gap-4">
            <input type="hidden" name="id" value={term.id} />

            <div className="grid gap-2">
              <div className="text-sm font-medium">黑话（必填）</div>
              <Input name="term" defaultValue={term.term} required />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">解释（必填）</div>
              <Textarea
                name="meaning"
                defaultValue={term.meaning}
                placeholder="支持换行"
                required
              />
            </div>

            <Button type="submit">保存修改</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

