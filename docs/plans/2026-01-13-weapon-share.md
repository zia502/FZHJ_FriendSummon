# Weapon Share Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add “武器盘分享” with a combined upload+list page at `/weapon-share`, a detail page at `/weapon-share/[id]`, image uploads under `data/uploads/weapon-boards/`, and per-board likes.

**Architecture:** Use Next.js App Router with a server-rendered list (SEO/首屏), a Server Action for uploads that returns structured error state (no redirect) to a client form via `useActionState`, SQLite (better-sqlite3) for metadata + like dedupe, and the existing `/uploads/[...path]` route for reading uploaded images.

**Tech Stack:** Next.js App Router, React 19, Server Actions, better-sqlite3, Tailwind/shadcn UI.

### Task 1: Database schema (tables + indexes)

**Files:**
- Modify: `lib/db.ts`

**Steps:**
1. Add tables:
   - `weapon_boards` with `id, name, description, playerId, boardImageUrl, predictionImageUrl, teamImageUrl0/1, likes, createdAt, updatedAt`
   - `weapon_board_likes` with `(boardId, voterId)` primary key
2. Add indexes for sorting and lookups:
   - `idx_weapon_boards_updatedAt`, `idx_weapon_boards_likes`, `idx_weapon_board_likes_boardId`
3. Verify schema creation by starting the app once (or running a node import that touches `getDb()`).

### Task 2: Storage module for weapon boards

**Files:**
- Create: `lib/weapon-boards-store.ts`

**Steps:**
1. Implement `getWeaponBoardsPage({ page, pageSize, sort })` using `LIMIT pageSize+1`.
2. Implement `getWeaponBoardById(id)`.
3. Implement `createWeaponBoard(record)` insert.
4. Implement `likeWeaponBoard({ id, voterId })` transaction:
   - `INSERT OR IGNORE weapon_board_likes`
   - only bump `weapon_boards.likes` when insert changes > 0
   - return `{ likes, didLike }` or `null` if not found.

### Task 3: Upload storage + server action (no redirect, return errors)

**Files:**
- Create: `app/weapon-share/actions.ts`
- Modify: `.gitignore`
- Create: `data/uploads/.gitkeep`
- Create: `data/uploads/weapon-boards/.gitkeep`

**Steps:**
1. Define action return state:
   - `ok`, `fieldErrors`, `formError`, `createdId?`
2. Validate:
   - `name` required
   - `playerId` optional but if present must be `^\d+$`
   - `boardImage` required
   - each image <= 4MB and type in {png,jpg,webp,gif}
   - team images max 2
3. Save files to `data/uploads/weapon-boards/` named `${id}-board.ext`, `${id}-prediction.ext`, `${id}-team0.ext`, `${id}-team1.ext`
4. Insert DB record; `revalidatePath("/weapon-share")`; return `ok:true` + id.

### Task 4: Like API route

**Files:**
- Create: `app/api/weapon-boards/like/route.ts`

**Steps:**
1. Parse JSON body `{ id }`; validate.
2. Set/get cookie `wb_voter` (httpOnly, 5 years).
3. Call `likeWeaponBoard`.
4. Return `{ likes, didLike }` / proper errors.

### Task 5: Pages and UI

**Files:**
- Modify: `app/weapon-share/page.tsx`
- Create: `components/weapon-share-page.tsx` (client)
- Create: `components/weapon-board-card.tsx` (client)
- Create: `app/weapon-share/[id]/page.tsx`

**Steps:**
1. `/weapon-share` server page loads list via `getWeaponBoardsPage` with:
   - query `?sort=time|likes`, `?page=`, `pageSize=20`
2. Client page:
   - upload form using `useActionState`
   - on success: clear form + `router.replace("/weapon-share?saved=1")` + `router.refresh()`
   - list with like button and “显示详情”
3. Detail page shows all fields and images.
4. If `playerId` present: load `friend_summons` by `playerId` and render existing summon card or a “未找到” notice.

### Task 6: Verification

Run:
- `pnpm lint`
- `pnpm build`

Manual checks:
1. Upload minimal: name + board image → appears in list, images load via `/uploads/weapon-boards/...`.
2. Upload with optional fields/images.
3. Like from list → count increments once; refresh keeps server count; second click shows no increment.
4. Sort and pagination work.
5. Detail page shows friend summon section when `playerId` exists.

