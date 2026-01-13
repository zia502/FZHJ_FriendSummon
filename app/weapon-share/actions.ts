"use server"

import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { revalidatePath } from "next/cache"

import { createWeaponBoard } from "@/lib/weapon-boards-store"

type CreateWeaponBoardState = {
  ok: boolean
  createdId?: string
  fieldErrors?: Partial<
    Record<
      | "name"
      | "playerId"
      | "boardImage"
      | "predictionImage"
      | "teamImage0"
      | "teamImage1",
      string
    >
  >
  formError?: string
}

const INITIAL_STATE: CreateWeaponBoardState = { ok: false }

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

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
  if (!ext) {
    throw new Error("bad_file_type")
  }

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

async function createWeaponBoardAction(
  _prevState: CreateWeaponBoardState,
  formData: FormData
): Promise<CreateWeaponBoardState> {
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const playerIdRaw = String(formData.get("playerId") ?? "").trim()

  const fieldErrors: CreateWeaponBoardState["fieldErrors"] = {}

  if (!name) {
    fieldErrors.name = "请填写武器盘名"
  }

  let playerId: string | undefined
  if (playerIdRaw) {
    if (!/^\d+$/.test(playerIdRaw)) {
      fieldErrors.playerId = "玩家ID必须为纯数字"
    } else {
      playerId = playerIdRaw
    }
  }

  const boardImage = formData.get("boardImage")
  const predictionImage = formData.get("predictionImage")
  const teamImage0 = formData.get("teamImage0")
  const teamImage1 = formData.get("teamImage1")

  if (!(boardImage instanceof File) || boardImage.size === 0) {
    fieldErrors.boardImage = "请上传武器盘图"
  }

  const files: Array<{ key: "boardImage" | "predictionImage" | "teamImage0" | "teamImage1"; value: File | null }> =
    [
      { key: "boardImage", value: boardImage instanceof File ? boardImage : null },
      {
        key: "predictionImage",
        value: predictionImage instanceof File ? predictionImage : null,
      },
      { key: "teamImage0", value: teamImage0 instanceof File ? teamImage0 : null },
      { key: "teamImage1", value: teamImage1 instanceof File ? teamImage1 : null },
    ]

  for (const entry of files) {
    if (!entry.value || entry.value.size === 0) continue
    if (entry.value.size > MAX_UPLOAD_BYTES) {
      const message = "单张图片不能超过 4MB"
      if (entry.key === "boardImage") fieldErrors.boardImage = message
      if (entry.key === "predictionImage") fieldErrors.predictionImage = message
      if (entry.key === "teamImage0") fieldErrors.teamImage0 = message
      if (entry.key === "teamImage1") fieldErrors.teamImage1 = message
    }
    if (!safeExtFromFile(entry.value)) {
      const message = "图片格式仅支持 png/jpg/webp/gif"
      if (entry.key === "boardImage") fieldErrors.boardImage = message
      if (entry.key === "predictionImage") fieldErrors.predictionImage = message
      if (entry.key === "teamImage0") fieldErrors.teamImage0 = message
      if (entry.key === "teamImage1") fieldErrors.teamImage1 = message
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors }
  }

  try {
    const id = randomUUID()
    const now = new Date().toISOString()

    const boardImageUrl = await saveUpload({
      id,
      field: "board",
      file: boardImage as File,
    })

    const predictionImageUrl =
      predictionImage instanceof File && predictionImage.size > 0
        ? await saveUpload({ id, field: "prediction", file: predictionImage })
        : undefined

    const teamImageUrl0 =
      teamImage0 instanceof File && teamImage0.size > 0
        ? await saveUpload({ id, field: "team0", file: teamImage0 })
        : undefined

    const teamImageUrl1 =
      teamImage1 instanceof File && teamImage1.size > 0
        ? await saveUpload({ id, field: "team1", file: teamImage1 })
        : undefined

    await createWeaponBoard({
      id,
      name,
      description: description ? description : undefined,
      playerId,
      boardImageUrl,
      predictionImageUrl,
      teamImageUrl0,
      teamImageUrl1,
      likes: 0,
      createdAt: now,
      updatedAt: now,
    })

    revalidatePath("/weapon-share")

    return { ok: true, createdId: id }
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : "提交失败",
    }
  }
}

export { createWeaponBoardAction, INITIAL_STATE }
