"use client";

import { Checker } from "./Checker";

interface BarProps {
  white: number;
  black: number;
  isHighlighted: boolean;
}

export function Bar({ white, black, isHighlighted }: BarProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 w-10 min-h-[240px] bg-neutral-200 dark:bg-neutral-800 rounded ${
        isHighlighted ? "ring-2 ring-yellow-400 bg-yellow-400/20" : ""
      }`}
    >
      {/* Black checkers on bar (top half) */}
      <div className="flex flex-col items-center gap-0.5">
        {Array.from({ length: Math.min(black, 5) }, (_, i) => (
          <Checker key={`b${i}`} color="black" size="sm" />
        ))}
        {black > 5 && (
          <span className="text-[9px] font-bold text-neutral-500">
            +{black - 5}
          </span>
        )}
      </div>

      <div className="w-6 h-px bg-neutral-400" />

      {/* White checkers on bar (bottom half) */}
      <div className="flex flex-col items-center gap-0.5">
        {Array.from({ length: Math.min(white, 5) }, (_, i) => (
          <Checker key={`w${i}`} color="white" size="sm" />
        ))}
        {white > 5 && (
          <span className="text-[9px] font-bold text-neutral-500">
            +{white - 5}
          </span>
        )}
      </div>
    </div>
  );
}
