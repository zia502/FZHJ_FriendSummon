import { cookies } from "next/headers"

import { likeWeaponBoard } from "@/lib/weapon-boards-store"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let id: unknown
  try {
    const body = (await req.json()) as { id?: unknown }
    id = body?.id
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 })
  }

  if (typeof id !== "string" || !id.trim()) {
    return Response.json({ error: "missing_id" }, { status: 400 })
  }

  const cookieStore = await cookies()
  const cookieKey = "wb_voter"
  let voterId = cookieStore.get(cookieKey)?.value
  if (!voterId) {
    voterId = crypto.randomUUID()
    cookieStore.set(cookieKey, voterId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 5,
    })
  }

  const result = await likeWeaponBoard({ id: id.trim(), voterId })
  if (result == null) {
    return Response.json({ error: "not_found" }, { status: 404 })
  }

  return Response.json(result)
}

