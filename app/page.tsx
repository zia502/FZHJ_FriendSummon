import { SummonCard, type SummonListItem } from "@/components/summon-card"

export default function Page() {
  const items: SummonListItem[] = [
    {
      playerId: "U-10482917",
      summonImages: [
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
      ],
    },
    {
      playerId: "U-20519304",
      summonImages: [
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
      ],
    },
    {
      playerId: "U-30958266",
      summonImages: [
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
        "/summon-placeholder.svg",
      ],
    },
  ]

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">
              友招招募列表
            </h1>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {items.map((item) => (
            <SummonCard key={item.playerId} item={item} />
          ))}
        </div>
      </div>
    </main>
  )
}
