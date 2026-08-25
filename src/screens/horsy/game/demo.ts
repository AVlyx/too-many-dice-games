import type { Piece } from "./PetitsChevauxBoard";

/**
 * A mid-game position: a horse in the stable, on the track, on the ladder and
 * home. Used for the board shown on the game page and for the thumbnail on the
 * home page.
 */
export const demoPieces: Piece[] = [
  { id: "red-1", color: "red", loc: "home", i: 0 },
  { id: "red-2", color: "red", loc: "ladder", i: 3 },
  { id: "red-3", color: "red", loc: "track", i: 2 },
  { id: "red-4", color: "red", loc: "stable", i: 3 },
  { id: "blue-1", color: "blue", loc: "ladder", i: 0 },
  { id: "blue-2", color: "blue", loc: "track", i: 17 },
  { id: "blue-3", color: "blue", loc: "track", i: 30 },
  { id: "blue-4", color: "blue", loc: "stable", i: 1 },
  { id: "yellow-1", color: "yellow", loc: "track", i: 44 },
  { id: "yellow-2", color: "yellow", loc: "track", i: 36 },
  { id: "yellow-3", color: "yellow", loc: "stable", i: 0 },
  { id: "yellow-4", color: "yellow", loc: "stable", i: 2 },
  { id: "green-1", color: "green", loc: "track", i: 8 },
  { id: "green-2", color: "green", loc: "stable", i: 1 },
  { id: "green-3", color: "green", loc: "stable", i: 2 },
  { id: "green-4", color: "green", loc: "stable", i: 3 },
];
