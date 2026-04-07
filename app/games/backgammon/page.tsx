"use client";

import { BackgammonGame } from "@/components/backgammon/BackgammonGame";

export default function BackgammonPage() {
  return (
    <main className="flex-1 flex flex-col items-center">
      <div className="w-full max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Backgammon</h1>
        <BackgammonGame />
      </div>
    </main>
  );
}
