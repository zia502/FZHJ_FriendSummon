"use client"

import * as React from "react"
import Image from "next/image"
import { CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

async function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.top = "0"
  textarea.style.left = "0"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  document.body.removeChild(textarea)
}

type SummonListItem = {
  playerId: string
  summonImages: [string, string, string, string, string, string, string, string, string, string]
}

function SummonCard({ item, className }: { item: SummonListItem; className?: string }) {
  const handleCopy = React.useCallback(() => {
    void copyToClipboard(item.playerId)
  }, [item.playerId])

  return (
    <div
      className={cn(
        "ring-foreground/10 bg-card text-card-foreground rounded-xl ring-1",
        "px-3 py-2.5",
        className
      )}
    >
      <div className="flex items-center justify-start gap-0">
        <div className="truncate text-sm font-bold tracking-tight">
          {item.playerId}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          className="ml-1"
          aria-label="复制玩家ID"
          onClick={handleCopy}
        >
          <CopyIcon />
        </Button>
      </div>

      <div className="mt-1.5 grid grid-cols-5 gap-x-1.5 gap-y-1.5">
        {item.summonImages.map((src, index) => (
          <Image
            key={index}
            src={src}
            alt="召唤"
            width={64}
            height={64}
            className={cn(
              "block size-16 rounded-md object-cover ring-2 ring-inset",
              index % 5 === 0 && "ring-red-500",
              index % 5 === 1 && "ring-green-500",
              index % 5 === 2 && "ring-amber-800",
              index % 5 === 3 && "ring-blue-500",
              index % 5 === 4 && "ring-slate-700"
            )}
            priority={false}
          />
        ))}
      </div>
    </div>
  )
}

export type { SummonListItem }
export { SummonCard }
