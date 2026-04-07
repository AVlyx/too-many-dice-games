"use client";

import type { DiceState } from "@/engine/backgammon";

export function DiceDisplay({ dice }: { dice: DiceState | null }) {
  if (!dice) return null;

  const [d1, d2] = dice.values;
  const remaining = dice.remaining;

  // Count how many of each value remain
  const remainingCounts = new Map<number, number>();
  for (const v of remaining) {
    remainingCounts.set(v, (remainingCounts.get(v) ?? 0) + 1);
  }

  // For display: show original values with used/unused styling
  const isDoubles = d1 === d2;
  const diceToShow = isDoubles ? [d1, d1, d1, d1] : [d1, d2];

  // Track how many of each value we've marked as remaining
  const shownRemaining = new Map<number, number>();

  return (
    <div className="flex gap-2 items-center">
      {diceToShow.map((value, i) => {
        const shownSoFar = shownRemaining.get(value) ?? 0;
        const totalRemaining = remainingCounts.get(value) ?? 0;
        const isUsed = shownSoFar >= totalRemaining;
        shownRemaining.set(value, shownSoFar + 1);

        return (
          <div
            key={i}
            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg font-bold ${
              isUsed
                ? "border-neutral-300 text-neutral-300 dark:border-neutral-700 dark:text-neutral-700"
                : "border-neutral-800 text-neutral-800 bg-white dark:border-neutral-200 dark:text-neutral-200 dark:bg-neutral-900"
            }`}
          >
            {value}
          </div>
        );
      })}
    </div>
  );
}
