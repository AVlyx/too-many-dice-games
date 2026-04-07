"use client";

import type { PlayerColor } from "@/engine/backgammon";

const colorClasses: Record<PlayerColor, string> = {
  white: "bg-amber-100 border-amber-300",
  black: "bg-neutral-800 border-neutral-600",
};

export function Checker({
  color,
  size = "md",
}: {
  color: PlayerColor;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? "w-5 h-5" : "w-8 h-8";
  return (
    <div
      className={`${dims} rounded-full border-2 shadow-sm ${colorClasses[color]}`}
    />
  );
}
