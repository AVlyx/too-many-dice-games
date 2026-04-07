import type { BoardState, PointState } from "./types";

export const POINTS_COUNT = 24;
export const CHECKERS_PER_PLAYER = 15;

/** White's home board: points 0-5 */
export const HOME_START_WHITE = 0;
export const HOME_END_WHITE = 5;

/** Black's home board: points 18-23 */
export const HOME_START_BLACK = 18;
export const HOME_END_BLACK = 23;

function emptyPoint(): PointState {
  return { count: 0, color: null };
}

function point(color: "white" | "black", count: number): PointState {
  return { count, color };
}

/**
 * Standard backgammon starting position.
 *
 * White moves from high (23) toward low (0).
 * Black moves from low (0) toward high (23).
 *
 * White: 2 on pt0, 5 on pt11, 3 on pt16, 5 on pt18
 * Black: 2 on pt23, 5 on pt12, 3 on pt7, 5 on pt5
 */
export function createInitialBoard(): BoardState {
  const points: PointState[] = Array.from({ length: 24 }, () => emptyPoint());

  // White checkers
  points[0] = point("white", 2);
  points[11] = point("white", 5);
  points[16] = point("white", 3);
  points[18] = point("white", 5);

  // Black checkers
  points[23] = point("black", 2);
  points[12] = point("black", 5);
  points[7] = point("black", 3);
  points[5] = point("black", 5);

  return {
    points,
    bar: { white: 0, black: 0 },
    borneOff: { white: 0, black: 0 },
  };
}
