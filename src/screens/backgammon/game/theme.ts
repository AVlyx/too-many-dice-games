import type { Player } from "./rules";

/** The colour swatch standing in for a side away from the board. */
export const PLAYER_SWATCH: Record<Player, string> = {
  white: "oklch(0.9 0.02 85)",
  black: "oklch(0.32 0.02 60)",
};

export const PLAYER_NAME: Record<Player, string> = { white: "White", black: "Black" };
