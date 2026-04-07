"use client";

import type { GameState } from "@/engine/backgammon";

export function GameStatus({ state }: { state: GameState }) {
  const currentName =
    state.players[state.currentPlayer]?.name ?? state.currentPlayer;

  switch (state.phase) {
    case "waiting_for_players":
      return <p className="text-neutral-500">Waiting for players...</p>;
    case "rolling":
      return (
        <p className="text-lg font-medium">
          <span className="capitalize">{currentName}</span> — roll the dice!
        </p>
      );
    case "selecting_move":
      return (
        <p className="text-lg font-medium">
          <span className="capitalize">{currentName}</span> — select your move
        </p>
      );
    case "turn_complete":
      return (
        <p className="text-neutral-500">Turn complete. Switching player...</p>
      );
    case "game_over":
      return (
        <p className="text-2xl font-bold text-green-600">
          {state.players[state.winner!]?.name ?? state.winner} wins!
        </p>
      );
    default:
      return null;
  }
}
