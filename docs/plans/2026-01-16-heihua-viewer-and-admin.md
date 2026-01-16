# 黑话查看 + 管理端编辑 Implementation Plan

> **For Codex:** Subagents aren’t available here; execute this plan sequentially in the same session with checkpoints.

**Goal:** Add a public “黑话查看” page that lists game jargon terms with a nice mobile-first UI, and add a “黑话编辑” section to `/admin` for creating/updating/deleting jargon entries. Also make the existing hover-only popover in `SummonCard` usable on mobile (tap-to-open).

**Architecture:** Store jargon entries in the existing SQLite DB (`data/app.db`) via `lib/db.ts` schema + a new `lib/heihua-store.ts` module. Use server actions under `app/admin/heihua/actions.ts` for CRUD. Public page reads via server component and renders a list with search.

## Task 1: Make summon slot popover work on mobile

**Files:**
- Modify: `components/summon-card.tsx`

**Steps:**
1. Add per-card open state (open slot index).
2. On coarse pointers (touch), toggle popover on tap and close on outside click / Escape.
3. Keep desktop hover behavior unchanged.

## Task 2: Add DB schema + store module for 黑话

**Files:**
- Modify: `lib/db.ts`
- Create: `lib/heihua-store.ts`

**Steps:**
1. Add table `heihua_terms`:
   - `id TEXT PRIMARY KEY`
   - `term TEXT NOT NULL`
   - `meaning TEXT NOT NULL`
   - `createdAt TEXT NOT NULL`
   - `updatedAt TEXT NOT NULL`
2. Add indexes for `term` and `updatedAt`.
3. Add store functions:
   - `getHeihuaTerms({ q?, limit? })`
   - `getHeihuaTermById(id)`
   - `addHeihuaTerm(record)`
   - `updateHeihuaTerm(record)`
   - `deleteHeihuaTerm(id)`

## Task 3: Public page “黑话查看”

**Files:**
- Create: `app/heihua/page.tsx`
- Modify: `components/top-nav.tsx`

**Steps:**
1. Add route `/heihua` with search input (GET param `q`).
2. Render terms as inline code style (theme color light background), and show meaning in a clean card list; mobile-friendly expansion.
3. Add a nav link “黑话查看”.

## Task 4: Admin “黑话编辑”

**Files:**
- Create: `app/admin/heihua/actions.ts`
- Modify: `app/admin/page.tsx`
- Create: `app/admin/heihua/[id]/page.tsx`

**Steps:**
1. Add admin form to create new term (admin role).
2. List latest terms with search; show Edit/Delete actions (super admin for edit/delete).
3. Add edit page for updating a term (super admin).

## Task 5: Verification

No test framework is present; verify via:
1. `pnpm lint` and `pnpm build`.
2. Manual: open `/` on mobile viewport and confirm tapping a slot shows popover.
3. Manual: add a term in `/admin`, confirm it shows in `/heihua`, then edit/delete as super admin.

