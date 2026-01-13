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
  const q = typeof params?.q === "string" ? params.q : ""
  const elementRaw = typeof params?.element === "string" ? params.element : "全部"
  const typeRaw = typeof params?.type === "string" ? params.type : "全部"
  const element =
    elementRaw === "火" || elementRaw === "风" || elementRaw === "土" || elementRaw === "水"
      ? elementRaw
      : "全部"
  const type = typeRaw === "神" || typeRaw === "魔" || typeRaw === "其他" ? typeRaw : "全部"

  const { items, hasPrev, hasNext } = await getWeaponBoardsPage({
    page,
    pageSize: 20,
    sort,
    q,
    element,
    type,
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
      q={q}
      element={element}
      type={type}
    />
  )
}
