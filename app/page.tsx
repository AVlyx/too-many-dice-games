import { games } from "@/lib/gameRegistry";
import { GameCard } from "@/components/GameCard";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center px-4 py-16">
      <h1 className="text-4xl font-bold mb-2">Too Many Dice</h1>
      <p className="text-neutral-500 mb-12">Pick a game to play</p>

      <div className="grid gap-6 w-full max-w-2xl sm:grid-cols-2">
        {games.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </div>
    </main>
  );
}
