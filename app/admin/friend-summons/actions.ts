"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireSuperAdmin } from "@/lib/admin-auth"
import { deleteFriendSummonByPlayerId } from "@/lib/friend-summons-store"

function buildAdminFriendSummonsUrl(params: Record<string, string>) {
  const search = new URLSearchParams(params)
  const suffix = search.toString()
  return `/admin${suffix ? `?${suffix}` : ""}#friend-summons`
}

async function deleteFriendSummonAction(formData: FormData) {
  await requireSuperAdmin()

  const playerId = String(formData.get("playerId") ?? "").trim()
  const confirmPlayerId = String(formData.get("confirmPlayerId") ?? "").trim()

  if (!playerId) {
    redirect(buildAdminFriendSummonsUrl({ fs_error: "missing_id" }))
  }

  if (confirmPlayerId !== playerId) {
    redirect(
      buildAdminFriendSummonsUrl({
        fs_error: "confirm_mismatch",
        fs_playerId: playerId,
      })
    )
  }

  const deleted = await deleteFriendSummonByPlayerId(playerId)
  revalidatePath("/admin")
  redirect(
    buildAdminFriendSummonsUrl({
      fs_deleted: deleted ? "1" : "0",
    })
  )
}

export { deleteFriendSummonAction }
