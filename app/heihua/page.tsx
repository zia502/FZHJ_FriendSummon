import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getHeihuaTerms } from "@/lib/heihua-store"

export default async function HeihuaPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const q = String(params?.q ?? "").trim()

  const terms = await getHeihuaTerms({ q, limit: 500 })

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-foreground text-xl font-bold tracking-tight">
          黑话
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">去编辑</Link>
        </Button>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">词条</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/heihua" method="get" className="flex items-center gap-2">
            <Input
              name="q"
              placeholder="搜索：黑话 / 解释"
              defaultValue={q}
            />
            <Button type="submit" variant="outline">
              搜索
            </Button>
          </form>

          <div className="mt-4 grid gap-2">
            {terms.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                暂无数据{q ? "（无匹配结果）" : "，可去后台添加。"}
              </div>
            ) : (
              terms.map((t) => (
                <div
                  key={t.id}
                  className="ring-foreground/10 bg-background rounded-lg p-3 ring-1"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                    <code className="bg-primary/10 text-primary rounded px-2 py-1 text-sm font-semibold">
                      {t.term}
                    </code>
                    <div className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed sm:mt-0 sm:flex-1">
                      {t.meaning}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
