"use server"

import { randomUUID } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdmin, requireSuperAdmin } from "@/lib/admin-auth"
import {
  addMonster,
  deleteMonster,
  getMonsterById,
  type MonsterElement,
  type MonsterRecord,
  type MonsterType,
  updateMonster,
} from "@/lib/monsters-store"

function isMonsterType(value: string): value is MonsterType {
  return value === "神" || value === "魔" || value === "属性" || value === "其他"
}

function isMonsterElement(value: string): value is MonsterElement {
  return (
    value === "火" || value === "风" || value === "土" || value === "水"
  )
}

function safeExtFromFile(file: File): string {
  const name = file.name.toLowerCase()
  if (name.endsWith(".png")) return "png"
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg"
  if (name.endsWith(".webp")) return "webp"
  if (name.endsWith(".gif")) return "gif"
  // 手机拍照可能是 HEIC/HEIF 格式，浏览器会自动转换
  if (name.endsWith(".heic") || name.endsWith(".heif")) return "jpg"

  const type = (file.type || "").toLowerCase()
  if (type === "image/png") return "png"
  if (type === "image/jpeg") return "jpg"
  if (type === "image/webp") return "webp"
  if (type === "image/gif") return "gif"
  // 手机相册图片可能是 HEIC/HEIF
  if (type === "image/heic" || type === "image/heif") return "jpg"

  // 如果文件类型以 image/ 开头，默认使用 jpg（兼容手机浏览器）
  if (type.startsWith("image/")) return "jpg"

  return "png"
}

async function addMonsterAction(formData: FormData) {
  await requireAdmin()

  const name = String(formData.get("name") ?? "").trim()
  const mainEffect = String(formData.get("mainEffect") ?? "").trim()
  const note = String(formData.get("note") ?? "").trim()
  const elementRaw = String(formData.get("element") ?? "").trim()
  const typeRaw = String(formData.get("type") ?? "").trim()
  const hasFourStar = String(formData.get("hasFourStar") ?? "") === "on"
  const fourStarEffect = String(formData.get("fourStarEffect") ?? "").trim()

  if (!name) {
    throw new Error("缺少必填项：魔物名")
  }
  if (!mainEffect) {
    throw new Error("缺少必填项：5星主位被动")
  }
  if (!isMonsterElement(elementRaw)) {
    throw new Error("缺少必填项：属性")
  }
  if (!isMonsterType(typeRaw)) {
    throw new Error("缺少必填项：类型")
  }
  if (hasFourStar && !fourStarEffect) {
    throw new Error("已选择 未满突主位被动，请填写 未满突效果")
  }

  const id = randomUUID()
  let imageUrl: string | undefined

  const image = formData.get("image")
  if (image instanceof File && image.size > 0) {
    const ext = safeExtFromFile(image)
    const filename = `${id}.${ext}`
    const uploadPath = path.join(
      process.cwd(),
      "data",
      "uploads",
      "monsters",
      filename
    )
    const bytes = Buffer.from(await image.arrayBuffer())
    await mkdir(path.dirname(uploadPath), { recursive: true })
    await writeFile(uploadPath, bytes)
    imageUrl = `/uploads/monsters/${filename}`
  }

  const record: MonsterRecord = {
    id,
    name,
    element: elementRaw,
    type: typeRaw,
    mainEffect,
    note: note ? note : undefined,
    hasFourStar,
    fourStarEffect: hasFourStar ? fourStarEffect : undefined,
    imageUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await addMonster(record)
  revalidatePath("/admin")
}

async function updateMonsterAction(formData: FormData) {
  await requireSuperAdmin()

  const id = String(formData.get("id") ?? "").trim()
  if (!id) throw new Error("缺少魔物ID")

  const existing = await getMonsterById(id)
  if (!existing) throw new Error("魔物不存在")

  const name = String(formData.get("name") ?? "").trim()
  const mainEffect = String(formData.get("mainEffect") ?? "").trim()
  const note = String(formData.get("note") ?? "").trim()
  const elementRaw = String(formData.get("element") ?? "").trim()
  const typeRaw = String(formData.get("type") ?? "").trim()
  const hasFourStar = String(formData.get("hasFourStar") ?? "") === "on"
  const fourStarEffect = String(formData.get("fourStarEffect") ?? "").trim()

  if (!name) throw new Error("缺少必填项：魔物名")
  if (!mainEffect) throw new Error("缺少必填项：5星主位被动")
  if (!isMonsterElement(elementRaw)) throw new Error("缺少必填项：属性")
  if (!isMonsterType(typeRaw)) throw new Error("缺少必填项：类型")
  if (hasFourStar && !fourStarEffect) {
    throw new Error("已选择 未满突主位被动，请填写 未满突效果")
  }

  let imageUrl = existing.imageUrl
  const image = formData.get("image")
  if (image instanceof File && image.size > 0) {
    const ext = safeExtFromFile(image)
    const filename = `${id}.${ext}`
    const uploadPath = path.join(
      process.cwd(),
      "data",
      "uploads",
      "monsters",
      filename
    )
    const bytes = Buffer.from(await image.arrayBuffer())
    await mkdir(path.dirname(uploadPath), { recursive: true })
    await writeFile(uploadPath, bytes)
    imageUrl = `/uploads/monsters/${filename}`
  }

  await updateMonster({
    id,
    name,
    element: elementRaw,
    type: typeRaw,
    mainEffect,
    note: note ? note : undefined,
    hasFourStar,
    fourStarEffect: hasFourStar ? fourStarEffect : undefined,
    imageUrl,
    updatedAt: new Date().toISOString(),
  })

  revalidatePath("/admin")
  redirect("/admin#monsters")
}

async function deleteMonsterAction(formData: FormData) {
  await requireSuperAdmin()

  const id = String(formData.get("id") ?? "").trim()
  if (!id) throw new Error("缺少魔物ID")

  const existing = await getMonsterById(id)
  if (!existing) {
    revalidatePath("/admin")
    redirect("/admin#monsters")
  }

  if (existing?.imageUrl?.startsWith("/uploads/monsters/")) {
    const filename = existing.imageUrl.replace("/uploads/monsters/", "")
    const candidates = [
      path.join(process.cwd(), "data", "uploads", "monsters", filename),
      path.join(process.cwd(), "public", "uploads", "monsters", filename),
    ]
    await Promise.all(
      candidates.map(async (filePath) => {
        try {
          await unlink(filePath)
        } catch {
          // ignore
        }
      })
    )
  }

  await deleteMonster(id)
  revalidatePath("/admin")
  redirect("/admin#monsters")
}

export { addMonsterAction, deleteMonsterAction, updateMonsterAction }
