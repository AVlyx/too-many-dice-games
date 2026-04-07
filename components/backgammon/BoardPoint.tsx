"use client";

import type { PointState } from "@/engine/backgammon";
import { Checker } from "./Checker";

interface BoardPointProps {
  index: number;
  point: PointState;
  isTop: boolean;
  isHighlighted: boolean;
  isValidSource: boolean;
}

export function BoardPoint({
  index,
  point,
  isTop,
  isHighlighted,
  isValidSource,
}: BoardPointProps) {
  // Triangle color alternates
  const triangleColor =
    index % 2 === 0
      ? "border-emerald-800 dark:border-emerald-700"
      : "border-red-800 dark:border-red-700";

  // Stack direction
  const flexDir = isTop ? "flex-col" : "flex-col-reverse";

  // Highlight styles
  let highlightStyle = "";
  if (isHighlighted) {
    highlightStyle = "ring-2 ring-yellow-400 bg-yellow-400/20";
  } else if (isValidSource) {
    highlightStyle = "bg-blue-400/10";
  }

  // Show max 5 checkers, then a count badge
  const maxVisible = 5;
  const visibleCount = Math.min(point.count, maxVisible);
  const overflow = point.count - maxVisible;

  return (
    <div
      className={`relative flex ${flexDir} items-center gap-0.5 w-10 min-h-[120px] rounded ${highlightStyle} transition-colors`}
    >
      {/* Triangle shape */}
      <div
        className={`absolute inset-x-0 ${isTop ? "top-0" : "bottom-0"} h-[100px] ${
          isTop
            ? `border-l-[20px] border-r-[20px] border-t-[100px] ${triangleColor} border-l-transparent border-r-transparent`
            : `border-l-[20px] border-r-[20px] border-b-[100px] ${triangleColor} border-l-transparent border-r-transparent`
        } opacity-60`}
      />

      {/* Checkers */}
      <div
        className={`relative z-10 flex ${flexDir} items-center gap-0.5 py-1`}
      >
        {point.color &&
          Array.from({ length: visibleCount }, (_, i) => (
            <Checker key={i} color={point.color!} />
          ))}
        {overflow > 0 && (
          <span className="text-xs font-bold text-neutral-500">
            +{overflow}
          </span>
        )}
      </div>

      {/* Point number */}
      <span
        className={`absolute ${isTop ? "bottom-0" : "top-0"} text-[9px] text-neutral-400 font-mono`}
      >
        {index}
      </span>
    </div>
  );
}
