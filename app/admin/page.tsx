import { cookies } from "next/headers"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { adminLogin, adminLogout } from "@/app/admin/actions"

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const cookieStore = await cookies()
  const authed = cookieStore.get("admin_auth")?.value === "1"

  const params = await searchParams
  const hasError = params?.error === "1"

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
              <Input
                name="password"
                type="password"
                placeholder="密码"
                aria-invalid={hasError || undefined}
              />
              {hasError && (
                <div className="text-destructive text-sm">密码错误</div>
              )}
              <Button type="submit">进入</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    )
  }

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

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>管理面板（模板）</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          这里预留给：审核分享、删除/编辑内容、查看上传记录等功能。
        </CardContent>
      </Card>
    </main>
  )
}

