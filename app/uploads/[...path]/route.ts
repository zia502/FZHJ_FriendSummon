import { readFile, stat } from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
}

function safePathSegments(segments: string[]) {
  if (segments.length === 0) return null
  for (const seg of segments) {
    if (!seg) return null
    if (seg === "." || seg === "..") return null
    if (seg.includes("\\") || seg.includes("\0")) return null
  }
  return segments
}

async function readUploadFile(segments: string[]) {
  const roots = [
    path.join(process.cwd(), "data", "uploads"),
    path.join(process.cwd(), "public", "uploads"),
  ]

  for (const root of roots) {
    const base = path.resolve(root)
    const full = path.resolve(path.join(root, ...segments))
    if (!full.startsWith(base + path.sep)) continue

    try {
      const info = await stat(full)
      if (!info.isFile()) continue
      const bytes = await readFile(full)
      return { full, bytes }
    } catch {
      // ignore
    }
  }

  return null
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params
  const segments = safePathSegments(params.path ?? [])
  if (!segments) {
    return new Response("Bad Request", { status: 400 })
  }

  const file = await readUploadFile(segments)
  if (!file) {
    return new Response("Not Found", { status: 404 })
  }

  const ext = path.extname(file.full).toLowerCase()
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream"

  return new Response(file.bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
