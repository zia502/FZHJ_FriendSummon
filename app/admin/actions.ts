"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") ?? "").trim()

  const adminPassword = (process.env.ADMIN_PASSWORD ?? "").trim()
  const superAdminPassword = (process.env.SUPER_ADMIN_PASSWORD ?? "").trim()
  if (!adminPassword && !superAdminPassword) {
    redirect("/admin?error=missing_env")
  }

  const role =
    superAdminPassword && password === superAdminPassword
      ? "super"
      : adminPassword && password === adminPassword
        ? "admin"
        : null

  if (!role) {
    redirect("/admin?error=1")
  }

  const headerStore = await headers()
  const forwardedProto = (headerStore.get("x-forwarded-proto") ?? "").toLowerCase()
  const referer = (headerStore.get("referer") ?? "").toLowerCase()
  const isHttps =
    forwardedProto === "https" ||
    referer.startsWith("https://")

  const cookieStore = await cookies()
  cookieStore.set("admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" ? isHttps : false,
    path: "/",
    maxAge: 60 * 60 * 24,
  })
  cookieStore.set("admin_role", role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" ? isHttps : false,
    path: "/",
    maxAge: 60 * 60 * 24,
  })

  redirect("/admin")
}

async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_auth")
  cookieStore.delete("admin_role")
  redirect("/")
}

export { adminLogin, adminLogout }
