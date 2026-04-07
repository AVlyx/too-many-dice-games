"use client";

import type { BoardState } from "@/engine/backgammon";
import { BoardPoint } from "./BoardPoint";
import { Bar } from "./Bar";
import { Checker } from "./Checker";

interface BackgammonBoardProps {
  board: BoardState;
  highlightedPoint: number | null;
  validSourcePoints: number[];
}

export function BackgammonBoard({
  board,
  highlightedPoint,
  validSourcePoints,
}: BackgammonBoardProps) {
  const validSet = new Set(validSourcePoints);

  /**
   * Layout:
   * Top row:    13 14 15 16 17 18 | BAR | 19 20 21 22 23 24(index 18-23)
   * Bottom row: 12 11 10 9  8  7  | BAR | 6  5  4  3  2  1 (index 11-6, 5-0)
   *
   * But internally points are 0-23:
   * Top:    12,13,14,15,16,17 | BAR | 18,19,20,21,22,23
   * Bottom: 11,10, 9, 8, 7, 6 | BAR |  5, 4, 3, 2, 1, 0
   */
  const topLeft = [12, 13, 14, 15, 16, 17];
  const topRight = [18, 19, 20, 21, 22, 23];
  const bottomLeft = [11, 10, 9, 8, 7, 6];
  const bottomRight = [5, 4, 3, 2, 1, 0];

  return (
    <div className="inline-flex flex-col bg-amber-900/80 dark:bg-amber-950 rounded-xl p-3 gap-1 shadow-lg">
      {/* Top row */}
      <div className="flex items-start gap-0.5">
        {topLeft.map((i) => (
          <BoardPoint
            key={i}
            index={i}
            point={board.points[i]}
            isTop={true}
            isHighlighted={highlightedPoint === i}
            isValidSource={validSet.has(i)}
          />
        ))}
        <Bar
          white={board.bar.white}
          black={board.bar.black}
          isHighlighted={highlightedPoint === -1}
        />
        {topRight.map((i) => (
          <BoardPoint
            key={i}
            index={i}
            point={board.points[i]}
            isTop={true}
            isHighlighted={highlightedPoint === i}
            isValidSource={validSet.has(i)}
          />
        ))}

        {/* Black bear-off tray */}
        <div className="flex flex-col items-center justify-center w-10 min-h-[120px] bg-neutral-300 dark:bg-neutral-700 rounded ml-1">
          <span className="text-[9px] text-neutral-500 mb-1">OFF</span>
          {board.borneOff.black > 0 && (
            <>
              <Checker color="black" size="sm" />
              <span className="text-xs font-bold mt-0.5">
                {board.borneOff.black}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-end gap-0.5">
        {bottomLeft.map((i) => (
          <BoardPoint
            key={i}
            index={i}
            point={board.points[i]}
            isTop={false}
            isHighlighted={highlightedPoint === i}
            isValidSource={validSet.has(i)}
          />
        ))}
        <Bar
          white={board.bar.white}
          black={board.bar.black}
          isHighlighted={false}
        />
        {bottomRight.map((i) => (
          <BoardPoint
            key={i}
            index={i}
            point={board.points[i]}
            isTop={false}
            isHighlighted={highlightedPoint === i}
            isValidSource={validSet.has(i)}
          />
        ))}

        {/* White bear-off tray */}
        <div className="flex flex-col items-center justify-center w-10 min-h-[120px] bg-neutral-300 dark:bg-neutral-700 rounded ml-1">
          <span className="text-[9px] text-neutral-500 mb-1">OFF</span>
          {board.borneOff.white > 0 && (
            <>
              <Checker color="white" size="sm" />
              <span className="text-xs font-bold mt-0.5">
                {board.borneOff.white}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
