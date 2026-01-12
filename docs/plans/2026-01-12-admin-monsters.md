# Admin Monster Management Implementation Plan

> **For Codex:** Subagents aren’t available here; execute this plan sequentially in the same session with checkpoints.

**Goal:** Add a “魔物管理” card in `/admin` that lets an authenticated admin submit monster data (text + optional image), then shows the latest 5 monsters with search.

**Architecture:** Use Next.js App Router Server Actions to accept form submissions. Persist monster metadata in a local JSON file (`data/monsters.json`) and store uploaded images under `public/uploads/monsters/` so they can be served statically. This is a simple dev-friendly approach that can later be replaced by a DB + object storage.

**Recommended storage (now → later):**
- **Now (template/dev):** JSON file for records + write uploaded images to `public/uploads/monsters/`.
- **Later (production):** DB for metadata (SQLite/Postgres) + object storage (S3/R2) for images; store only image URL/key in DB.

## Task 1: Add data storage module

**Files:**
- Create: `data/monsters.json`
- Create: `lib/monsters-store.ts`
- Create: `public/uploads/monsters/.gitkeep`
- Modify: `.gitignore`

**Steps:**
1. Create `data/monsters.json` with `[]`.
2. Add `lib/monsters-store.ts` with:
   - `MonsterType = "神" | "魔" | "属性"`
   - `MonsterRecord` fields: `id`, `name`, `type`, `mainEffect`, `hasFourStar`, `fourStarEffect?`, `imageUrl?`, `createdAt`
   - `getMonsters(): Promise<MonsterRecord[]>`
   - `addMonster(record: MonsterRecord): Promise<void>` (prepend newest)
3. Add `public/uploads/monsters/.gitkeep` and update `.gitignore` to ignore uploaded images but keep `.gitkeep`.

## Task 2: Add server actions for monster submission

**Files:**
- Create: `app/admin/monsters/actions.ts`

**Steps:**
1. Implement `addMonsterAction(formData)`:
   - Validate required: `name`, `type`, `mainEffect`
   - Validate conditional: if `hasFourStar` then `fourStarEffect` required
   - If `image` provided, write file into `public/uploads/monsters/<id>.<ext>` and set `imageUrl` (e.g. `/uploads/monsters/<id>.<ext>`)
   - Call `addMonster()` and `revalidatePath("/admin")`
2. Keep auth requirement simple: rely on existing admin cookie gating in `app/admin/page.tsx`.

## Task 3: Update admin page UI (魔物管理 card)

**Files:**
- Modify: `app/admin/page.tsx`

**Steps:**
1. Add a “魔物管理” card containing a form:
   - Required: 魔物名 (`<Input name="name">`)
   - Required: 主招效果 (`<Textarea name="mainEffect">`)
   - Required: 类型 (`radio`: 神 / 魔 / 属性)
   - Optional: 魔物图片 (`<Input name="image" type="file" accept="image/*">`)
   - Optional: “有 4星主招效果” checkbox; when checked show `<Textarea name="fourStarEffect">` and require it server-side
2. Under the form, show “最新添加的 5 个魔物”:
   - Provide search controls (GET): `q` (name/effects), `type` (神/魔/属性/全部)
   - Display up to 5 results, newest first

## Task 4: Verification

No test framework is present; verify manually:
1. Set `.env.local` with `ADMIN_PASSWORD=...` and login.
2. Submit monster with minimal required fields; ensure it appears in list.
3. Submit monster with `hasFourStar` checked but no 4-star text; ensure it errors.
4. Upload an image and verify it’s saved and displayed.
5. Search by name/type/effect; confirm list filters.

