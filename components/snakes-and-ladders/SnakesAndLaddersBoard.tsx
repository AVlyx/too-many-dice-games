"use client";

import { SNAKES, LADDERS, PLAYER_COLORS } from "@/engine/snakes-and-ladders";
import type { GameState } from "@/engine/snakes-and-ladders";

interface BoardProps {
  state: GameState;
}

/**
 * Convert square number (1–100) to grid row/col.
 * Board is numbered bottom-left to top-right in boustrophedon order.
 * Row 0 = top of grid (squares 91–100), Row 9 = bottom (squares 1–10).
 */
function getSquareAtGridPosition(row: number, col: number): number {
  const bottomRow = 9 - row; // 0 = bottom row
  if (bottomRow % 2 === 0) {
    // Left to right
    return bottomRow * 10 + col + 1;
  } else {
    // Right to left
    return bottomRow * 10 + (9 - col) + 1;
  }
}

export function SnakesAndLaddersBoard({ state }: BoardProps) {
  // Build a map of square → player indices on that square
  const playersOnSquare: Record<number, number[]> = {};
  state.playerOrder.forEach((pid, idx) => {
    const pos = state.positions[pid];
    if (pos > 0) {
      if (!playersOnSquare[pos]) playersOnSquare[pos] = [];
      playersOnSquare[pos].push(idx);
    }
  });

  const rows: React.ReactNode[] = [];
  for (let row = 0; row < 10; row++) {
    const cells: React.ReactNode[] = [];
    for (let col = 0; col < 10; col++) {
      const sq = getSquareAtGridPosition(row, col);
      const isSnake = sq in SNAKES;
      const isLadder = sq in LADDERS;
      const players = playersOnSquare[sq] || [];

      let bgClass = "bg-neutral-100 dark:bg-neutral-800";
      if (isSnake) bgClass = "bg-red-100 dark:bg-red-900/40";
      if (isLadder) bgClass = "bg-green-100 dark:bg-green-900/40";
      if (sq === 100) bgClass = "bg-yellow-100 dark:bg-yellow-900/40";

      cells.push(
        <div
          key={sq}
          className={`relative flex flex-col items-center justify-between p-0.5 border border-neutral-300 dark:border-neutral-600 ${bgClass} aspect-square`}
        >
          <span className="text-[9px] leading-none text-neutral-400 dark:text-neutral-500 self-start">
            {sq}
          </span>
          {isSnake && (
            <span className="text-[10px] leading-none text-red-500" title={`Snake: ${sq} → ${SNAKES[sq]}`}>
              ↓{SNAKES[sq]}
            </span>
          )}
          {isLadder && (
            <span className="text-[10px] leading-none text-green-600" title={`Ladder: ${sq} → ${LADDERS[sq]}`}>
              ↑{LADDERS[sq]}
            </span>
          )}
          {players.length > 0 && (
            <div className="absolute bottom-0.5 right-0.5 flex flex-wrap gap-px justify-end max-w-full">
              {players.map((pIdx) => (
                <span
                  key={pIdx}
                  className="block w-2.5 h-2.5 rounded-full border border-white dark:border-neutral-700"
                  style={{ backgroundColor: PLAYER_COLORS[pIdx] }}
                  title={state.players[pIdx]?.name}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
    rows.push(
      <div key={row} className="grid grid-cols-10">
        {cells}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md border-2 border-neutral-400 dark:border-neutral-500 rounded-lg overflow-hidden">
      {rows}
    </div>
  );
}
