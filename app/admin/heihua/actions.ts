"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdmin, requireSuperAdmin } from "@/lib/admin-auth"
import {
  addHeihuaTerm,
  deleteHeihuaTerm,
  getHeihuaTermById,
  updateHeihuaTerm,
} from "@/lib/heihua-store"

async function addHeihuaTermAction(formData: FormData) {
  await requireAdmin()

  const term = String(formData.get("term") ?? "").trim()
  const meaning = String(formData.get("meaning") ?? "").trim()

  const now = new Date().toISOString()
  await addHeihuaTerm({
    id: randomUUID(),
    term,
    meaning,
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath("/admin")
  revalidatePath("/heihua")
  redirect("/admin#heihua")
}

async function updateHeihuaTermAction(formData: FormData) {
  await requireSuperAdmin()

  const id = String(formData.get("id") ?? "").trim()
  if (!id) throw new Error("缺少黑话ID")

  const existing = await getHeihuaTermById(id)
  if (!existing) throw new Error("黑话不存在")

  const term = String(formData.get("term") ?? "").trim()
  const meaning = String(formData.get("meaning") ?? "").trim()

  await updateHeihuaTerm({
    id,
    term,
    meaning,
    updatedAt: new Date().toISOString(),
  })

  revalidatePath("/admin")
  revalidatePath("/heihua")
  redirect("/admin#heihua")
}

async function deleteHeihuaTermAction(formData: FormData) {
  await requireSuperAdmin()

  const id = String(formData.get("id") ?? "").trim()
  if (!id) throw new Error("缺少黑话ID")

  await deleteHeihuaTerm(id)

  revalidatePath("/admin")
  revalidatePath("/heihua")
  redirect("/admin#heihua")
}

export { addHeihuaTermAction, deleteHeihuaTermAction, updateHeihuaTermAction }

