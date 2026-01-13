import { cookies } from "next/headers"

import { likeFriendSummon } from "@/lib/friend-summons-store"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let playerId: unknown
  try {
    const body = (await req.json()) as { playerId?: unknown }
    playerId = body?.playerId
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 })
  }

  if (typeof playerId !== "string" || !playerId.trim()) {
    return Response.json({ error: "missing_playerId" }, { status: 400 })
  }

  const cookieStore = await cookies()
  const cookieKey = "fs_voter"
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

  const result = await likeFriendSummon({ playerId: playerId.trim(), voterId })
  if (result == null) {
    return Response.json({ error: "not_found" }, { status: 404 })
  }

  return Response.json(result)
}
