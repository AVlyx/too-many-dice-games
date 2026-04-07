import Link from "next/link";
import type { GameEntry } from "@/lib/gameRegistry";

export function GameCard({ game }: { game: GameEntry }) {
  return (
    <Link
      href={game.href}
      className="group block rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 transition-colors hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-900"
    >
      <h2 className="text-xl font-semibold mb-2 group-hover:underline">
        {game.name}
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
        {game.description}
      </p>
      <span className="text-xs text-neutral-500">
        {game.playerCount} player{game.playerCount !== 1 ? "s" : ""}
      </span>
    </Link>
  );
}
