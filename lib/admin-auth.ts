import "server-only"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

type AdminRole = "admin" | "super"

async function getAdminRole(): Promise<AdminRole | null> {
  const cookieStore = await cookies()
  const authed = cookieStore.get("admin_auth")?.value === "1"
  if (!authed) return null

  const role = cookieStore.get("admin_role")?.value
  if (role === "admin" || role === "super") return role
  return null
}

async function requireAdmin(): Promise<AdminRole> {
  const role = await getAdminRole()
  if (!role) redirect("/admin")
  return role
}

async function requireSuperAdmin(): Promise<void> {
  const role = await requireAdmin()
  if (role !== "super") redirect("/admin?error=forbidden")
}

export type { AdminRole }
export { getAdminRole, requireAdmin, requireSuperAdmin }
