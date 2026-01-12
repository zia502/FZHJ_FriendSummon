"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") ?? "")

  const expectedPassword = process.env.ADMIN_PASSWORD
  if (!expectedPassword) {
    redirect("/admin?error=missing_env")
  }
  if (password !== expectedPassword) {
    redirect("/admin?error=1")
  }

  const cookieStore = await cookies()
  cookieStore.set("admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  })

  redirect("/admin")
}

async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_auth")
  redirect("/")
}

export { adminLogin, adminLogout }
