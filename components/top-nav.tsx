import Link from "next/link"

import { Button } from "@/components/ui/button"

function TopNav() {
  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          风之痕迹好友募集
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/skill-share">技能轴分享</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/weapon-share">武器盘分享</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">后台管理</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

export { TopNav }
