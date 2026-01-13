import { WeaponSharePage } from "@/components/weapon-share-page"
import { getWeaponBoardsPage } from "@/lib/weapon-boards-store"

export default async function WeaponShareRoute({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params?.page ?? 1) || 1)
  const sort = params?.sort === "likes" ? "likes" : "time"
  const saved = String(params?.saved ?? "") === "1"

  const { items, hasPrev, hasNext } = await getWeaponBoardsPage({
    page,
    pageSize: 20,
    sort,
  })

  return (
    <WeaponSharePage
      initialItems={items.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        likes: r.likes,
      }))}
      page={page}
      hasPrev={hasPrev}
      hasNext={hasNext}
      sort={sort}
      saved={saved}
    />
  )
}
