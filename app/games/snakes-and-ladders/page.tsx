"use client";

import { SnakesAndLaddersGame } from "@/components/snakes-and-ladders/SnakesAndLaddersGame";

export default function SnakesAndLaddersPage() {
  return (
    <main className="flex-1 flex flex-col items-center">
      <div className="w-full max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Snakes & Ladders
        </h1>
        <SnakesAndLaddersGame />
      </div>
    </main>
  );
}
