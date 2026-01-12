"use server"

import { randomUUID } from "node:crypto"
import { writeFile } from "node:fs/promises"
import path from "node:path"

import { revalidatePath } from "next/cache"

import {
  addMonster,
  type MonsterElement,
  type MonsterRecord,
  type MonsterType,
} from "@/lib/monsters-store"

function isMonsterType(value: string): value is MonsterType {
  return value === "神" || value === "魔" || value === "属性"
}

function isMonsterElement(value: string): value is MonsterElement {
  return (
    value === "火" || value === "风" || value === "土" || value === "水" || value === "其他"
  )
}

function safeExtFromFile(file: File): string {
  const name = file.name.toLowerCase()
  if (name.endsWith(".png")) return "png"
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg"
  if (name.endsWith(".webp")) return "webp"
  if (name.endsWith(".gif")) return "gif"

  const type = (file.type || "").toLowerCase()
  if (type === "image/png") return "png"
  if (type === "image/jpeg") return "jpg"
  if (type === "image/webp") return "webp"
  if (type === "image/gif") return "gif"

  return "png"
}

async function addMonsterAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const mainEffect = String(formData.get("mainEffect") ?? "").trim()
  const elementRaw = String(formData.get("element") ?? "").trim()
  const typeRaw = String(formData.get("type") ?? "").trim()
  const hasFourStar = String(formData.get("hasFourStar") ?? "") === "on"
  const fourStarEffect = String(formData.get("fourStarEffect") ?? "").trim()

  if (!name) {
    throw new Error("缺少必填项：魔物名")
  }
  if (!mainEffect) {
    throw new Error("缺少必填项：主招效果")
  }
  if (!isMonsterElement(elementRaw)) {
    throw new Error("缺少必填项：属性")
  }
  if (!isMonsterType(typeRaw)) {
    throw new Error("缺少必填项：类型")
  }
  if (hasFourStar && !fourStarEffect) {
    throw new Error("已选择 4星主招效果，请填写 4星效果")
  }

  const id = randomUUID()
  let imageUrl: string | undefined

  const image = formData.get("image")
  if (image instanceof File && image.size > 0) {
    const ext = safeExtFromFile(image)
    const filename = `${id}.${ext}`
    const uploadPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "monsters",
      filename
    )
    const bytes = Buffer.from(await image.arrayBuffer())
    await writeFile(uploadPath, bytes)
    imageUrl = `/uploads/monsters/${filename}`
  }

  const record: MonsterRecord = {
    id,
    name,
    element: elementRaw,
    type: typeRaw,
    mainEffect,
    hasFourStar,
    fourStarEffect: hasFourStar ? fourStarEffect : undefined,
    imageUrl,
    createdAt: new Date().toISOString(),
  }

  await addMonster(record)
  revalidatePath("/admin")
}

export { addMonsterAction }
