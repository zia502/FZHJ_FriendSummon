"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function WeaponShareError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10">
        <div className="text-foreground text-lg font-bold tracking-tight">
          页面加载失败
        </div>
        <div className="text-muted-foreground mt-2 text-sm">
          这通常是浏览器端运行错误导致的。你可以先点“重试”，仍失败请截图把下面的错误信息发我。
        </div>

        <div className="mt-4 rounded-xl border p-3 text-sm">
          <div className="font-medium">错误信息</div>
          <div className="text-muted-foreground mt-2 whitespace-pre-wrap break-words">
            {error?.message || "（无错误信息）"}
            {error?.digest ? `\nDigest: ${error.digest}` : ""}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button type="button" onClick={reset}>
            重试
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/">返回首页</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
