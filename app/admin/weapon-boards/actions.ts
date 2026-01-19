"use server"

import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireSuperAdmin } from "@/lib/admin-auth"
import {
  deleteWeaponBoard,
  getWeaponBoardById,
  type WeaponBoardElement,
  type WeaponBoardType,
  updateWeaponBoard,
} from "@/lib/weapon-boards-store"

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

function isWeaponBoardElement(value: string): value is WeaponBoardElement {
  return value === "火" || value === "风" || value === "土" || value === "水"
}

function isWeaponBoardType(value: string): value is WeaponBoardType {
  return value === "神" || value === "魔" || value === "其他"
}

function safeExtFromFile(file: File): string | null {
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

  return null
}

async function saveUpload({
  id,
  field,
  file,
}: {
  id: string
  field: "board" | "prediction" | "team0" | "team1"
  file: File
}) {
  const ext = safeExtFromFile(file)
  if (!ext) throw new Error("图片格式仅支持 png/jpg/webp/gif")
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("单张图片不能超过 4MB")

  const filename = `${id}-${field}.${ext}`
  const uploadPath = path.join(
    process.cwd(),
    "data",
    "uploads",
    "weapon-boards",
    filename
  )
  const bytes = Buffer.from(await file.arrayBuffer())
  await mkdir(path.dirname(uploadPath), { recursive: true })
  await writeFile(uploadPath, bytes)
  return `/uploads/weapon-boards/${filename}`
}

async function updateWeaponBoardAction(formData: FormData) {
  await requireSuperAdmin()

  const id = String(formData.get("id") ?? "").trim()
  if (!id) throw new Error("缺少武器盘ID")

  const existing = await getWeaponBoardById(id)
  if (!existing) throw new Error("武器盘不存在")

  const name = String(formData.get("name") ?? "").trim()
  if (!name) throw new Error("缺少必填项：武器盘名")

  const elementRaw = String(formData.get("element") ?? "").trim()
  const typeRaw = String(formData.get("type") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const playerIdRaw = String(formData.get("playerId") ?? "").trim()
  const skillShareCode = String(formData.get("skillShareCode") ?? "").trim()

  let element: WeaponBoardElement | undefined
  if (elementRaw) {
    if (!isWeaponBoardElement(elementRaw)) throw new Error("属性必须为 火/风/土/水")
    element = elementRaw
  }

  let type: WeaponBoardType | undefined
  if (typeRaw) {
    if (!isWeaponBoardType(typeRaw)) throw new Error("类型必须为 神/魔/其他")
    type = typeRaw
  }

  let playerId: string | undefined
  if (playerIdRaw) {
    if (!/^\d+$/.test(playerIdRaw)) throw new Error("玩家ID必须为纯数字")
    playerId = playerIdRaw
  }

  let boardImageUrl =
    String(formData.get("boardImageUrl") ?? "").trim() || existing.boardImageUrl
  let predictionImageUrl = String(formData.get("predictionImageUrl") ?? "").trim()
  let teamImageUrl0 = String(formData.get("teamImageUrl0") ?? "").trim()
  let teamImageUrl1 = String(formData.get("teamImageUrl1") ?? "").trim()

  if (!predictionImageUrl) predictionImageUrl = ""
  if (!teamImageUrl0) teamImageUrl0 = ""
  if (!teamImageUrl1) teamImageUrl1 = ""

  const boardImage = formData.get("boardImage")
  const predictionImage = formData.get("predictionImage")
  const teamImage0 = formData.get("teamImage0")
  const teamImage1 = formData.get("teamImage1")

  if (boardImage instanceof File && boardImage.size > 0) {
    boardImageUrl = await saveUpload({ id, field: "board", file: boardImage })
  }
  if (predictionImage instanceof File && predictionImage.size > 0) {
    predictionImageUrl = await saveUpload({
      id,
      field: "prediction",
      file: predictionImage,
    })
  }
  if (teamImage0 instanceof File && teamImage0.size > 0) {
    teamImageUrl0 = await saveUpload({ id, field: "team0", file: teamImage0 })
  }
  if (teamImage1 instanceof File && teamImage1.size > 0) {
    teamImageUrl1 = await saveUpload({ id, field: "team1", file: teamImage1 })
  }

  boardImageUrl = boardImageUrl.trim()
  if (!boardImageUrl) throw new Error("武器盘图不能为空")

  await updateWeaponBoard({
    id,
    name,
    element,
    type,
    description: description ? description : undefined,
    playerId,
    skillShareCode: skillShareCode ? skillShareCode : undefined,
    boardImageUrl,
    predictionImageUrl: predictionImageUrl ? predictionImageUrl : undefined,
    teamImageUrl0: teamImageUrl0 ? teamImageUrl0 : undefined,
    teamImageUrl1: teamImageUrl1 ? teamImageUrl1 : undefined,
    updatedAt: new Date().toISOString(),
  })

  revalidatePath("/weapon-share")
  revalidatePath("/admin")
  redirect("/admin#weapon-boards")
}

function localUploadCandidates(url: string) {
  if (!url.startsWith("/uploads/weapon-boards/")) return []
  const raw = url.replace("/uploads/weapon-boards/", "")
  const filename = raw.split("?")[0]?.split("#")[0] ?? ""
  if (!filename) return []
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return []
  }
  return [
    path.join(process.cwd(), "data", "uploads", "weapon-boards", filename),
    path.join(process.cwd(), "public", "uploads", "weapon-boards", filename),
  ]
}

async function deleteWeaponBoardAction(formData: FormData) {
  await requireSuperAdmin()

  const id = String(formData.get("id") ?? "").trim()
  if (!id) throw new Error("缺少武器盘ID")

  const confirmId = String(formData.get("confirmId") ?? "").trim()
  if (confirmId !== id) throw new Error("确认ID不一致，请重新输入以确认删除")

  const existing = await getWeaponBoardById(id)
  if (!existing) {
    revalidatePath("/admin")
    redirect("/admin#weapon-boards")
  }

  const board = existing
  const urls = [
    board.boardImageUrl,
    board.predictionImageUrl,
    board.teamImageUrl0,
    board.teamImageUrl1,
  ].filter((v): v is string => !!v && typeof v === "string")

  const candidates = urls.flatMap((url) => localUploadCandidates(url))
  await Promise.all(
    candidates.map(async (filePath) => {
      try {
        await unlink(filePath)
      } catch {
        // ignore
      }
    })
  )

  await deleteWeaponBoard(id)
  revalidatePath("/weapon-share")
  revalidatePath("/admin")
  redirect("/admin#weapon-boards")
}

export { deleteWeaponBoardAction, updateWeaponBoardAction }

