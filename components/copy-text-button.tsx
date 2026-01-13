"use client"

import * as React from "react"
import { CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

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

function CopyTextButton({
  text,
  label = "复制",
}: {
  text: string
  label?: string
}) {
  const [copied, setCopied] = React.useState(false)

  const onCopy = React.useCallback(async () => {
    try {
      await copyToClipboard(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1000)
    } catch {
      setCopied(false)
    }
  }, [text])

  return (
    <Button type="button" variant="outline" size="sm" onClick={onCopy}>
      <CopyIcon />
      {copied ? "已复制" : label}
    </Button>
  )
}

export { CopyTextButton }

