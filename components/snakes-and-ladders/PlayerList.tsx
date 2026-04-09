"use client";

import type { GameState } from "@/engine/snakes-and-ladders";
import { PLAYER_COLORS } from "@/engine/snakes-and-ladders";

interface PlayerListProps {
  state: GameState;
}

export function PlayerList({ state }: PlayerListProps) {
  return (
    <div className="w-full max-w-md">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {state.players.map((p, idx) => {
          const pos = state.positions[p.playerId] ?? 0;
          const isCurrent = idx === state.currentPlayerIndex && state.phase !== "game_over";
          return (
            <div
              key={p.playerId}
              className={`flex items-center gap-2 px-2 py-1 rounded ${
                isCurrent ? "bg-neutral-200 dark:bg-neutral-700 font-semibold" : ""
              }`}
            >
              <span
                className="block w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: PLAYER_COLORS[idx] }}
              />
              <span className="truncate">{p.name}</span>
              <span className="ml-auto text-neutral-400 tabular-nums">
                {pos === 0 ? "Start" : pos === 100 ? "Won!" : pos}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
