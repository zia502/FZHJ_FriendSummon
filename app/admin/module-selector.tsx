"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type AdminModuleItem = {
  key: string
  label: string
}

function parseSelected({
  raw,
  allow,
}: {
  raw: string
  allow: Set<string>
}): Set<string> {
  const items = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return new Set(items.filter((k) => allow.has(k)))
}

export function AdminModuleSelector({
  items,
}: {
  items: Array<AdminModuleItem>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const allow = React.useMemo(() => new Set(items.map((i) => i.key)), [items])
  const raw = searchParams.get("modules") ?? ""
  const selected = React.useMemo(
    () => (raw ? parseSelected({ raw, allow }) : new Set(items.map((i) => i.key))),
    [allow, items, raw]
  )

  const selectedCount = selected.size

  const apply = React.useCallback(
    (next: Set<string>) => {
      const sp = new URLSearchParams(searchParams.toString())
      const allSelected = next.size === items.length
      if (allSelected) {
        sp.delete("modules")
      } else {
        sp.set("modules", Array.from(next).join(","))
      }

      const query = sp.toString()
      const url = query ? `${pathname}?${query}` : pathname
      router.replace(url)
    },
    [items.length, pathname, router, searchParams]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          管理模块（{selectedCount}/{items.length}）
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>显示/隐藏模块</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuCheckboxItem
            key={item.key}
            checked={selected.has(item.key)}
            onCheckedChange={(checked) => {
              const next = new Set(selected)
              if (checked) next.add(item.key)
              else next.delete(item.key)
              apply(next)
            }}
            onSelect={(e) => e.preventDefault()}
          >
            {item.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            apply(new Set(items.map((i) => i.key)))
          }}
        >
          全选
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            apply(new Set())
          }}
        >
          全不选
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
