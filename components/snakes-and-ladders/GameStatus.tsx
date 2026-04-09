"use client";

import type { GameState } from "@/engine/snakes-and-ladders";
import { PLAYER_COLORS } from "@/engine/snakes-and-ladders";

interface GameStatusProps {
  state: GameState;
}

export function GameStatus({ state }: GameStatusProps) {
  if (state.phase === "game_over" && state.winner) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-yellow-500">
          {state.winner.name} wins!
        </p>
      </div>
    );
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  const currentColor = PLAYER_COLORS[state.currentPlayerIndex];

  return (
    <div className="text-center flex flex-col gap-1">
      <p className="text-lg font-semibold">
        <span
          className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
          style={{ backgroundColor: currentColor }}
        />
        {currentPlayer?.name ?? "..."}&apos;s turn
      </p>
      {state.lastRoll !== null && (
        <p className="text-sm text-neutral-500">
          Rolled a {state.lastRoll}
          {state.lastEvent && (
            <span>
              {" — "}
              {state.lastEvent.type === "snake" ? "Snake!" : "Ladder!"}{" "}
              {state.lastEvent.from} → {state.lastEvent.to}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
