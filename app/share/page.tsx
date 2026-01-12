import { getFriendSummonByPlayerId } from "@/lib/friend-summons-store"
import { getMonsters } from "@/lib/monsters-store"
import { SharePage } from "@/components/share-page"

export default async function SharePageRoute({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const id = String(params?.id ?? "").trim()
  const error = String(params?.error ?? "").trim()

  const monsters = await getMonsters({ limit: 5000 })

  const existing =
    id && /^\d+$/.test(id) ? await getFriendSummonByPlayerId(id) : null

  return (
    <SharePage
      monsters={monsters.map((m) => ({
        id: m.id,
        name: m.name,
        element: m.element,
        type: m.type,
        imageUrl: m.imageUrl,
      }))}
      initialPlayerId={id}
      initialSlotIds={existing?.slotIds ?? null}
      error={error}
    />
  )
}

