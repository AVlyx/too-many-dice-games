import type { BoardState, Move, PlayerColor, PointState } from "./types";
import {
  POINTS_COUNT,
  HOME_START_WHITE,
  HOME_END_WHITE,
  HOME_START_BLACK,
  HOME_END_BLACK,
  CHECKERS_PER_PLAYER,
} from "./constants";

// ── Helpers ──────────────────────────────────────────────────────────────────

function cloneBoard(board: BoardState): BoardState {
  return {
    points: board.points.map((p) => ({ ...p })),
    bar: { ...board.bar },
    borneOff: { ...board.borneOff },
  };
}

/** Direction of movement: white goes negative, black goes positive */
function direction(player: PlayerColor): 1 | -1 {
  return player === "black" ? 1 : -1;
}

function homeRange(player: PlayerColor): [number, number] {
  return player === "white"
    ? [HOME_START_WHITE, HOME_END_WHITE]
    : [HOME_START_BLACK, HOME_END_BLACK];
}

/** Check if a destination point is blocked (2+ opponent checkers) */
function isBlocked(point: PointState, player: PlayerColor): boolean {
  return point.color !== null && point.color !== player && point.count >= 2;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Can the player bear off? True when all remaining checkers are in
 * the home board or already borne off.
 */
export function canBearOff(board: BoardState, player: PlayerColor): boolean {
  const [homeStart, homeEnd] = homeRange(player);
  let checkersOutside = 0;

  for (let i = 0; i < POINTS_COUNT; i++) {
    if (i >= homeStart && i <= homeEnd) continue;
    if (board.points[i].color === player) {
      checkersOutside += board.points[i].count;
    }
  }
  checkersOutside += board.bar[player];
  return checkersOutside === 0;
}

/**
 * Get the destination point index for a move. Returns -1 if off the board
 * (bear off) or null if the move is impossible.
 */
function getDestination(
  from: number,
  dieValue: number,
  player: PlayerColor
): number | null {
  if (from === -1) {
    // Entering from bar
    const dest = player === "black" ? dieValue - 1 : POINTS_COUNT - dieValue;
    if (dest < 0 || dest >= POINTS_COUNT) return null;
    return dest;
  }

  const dest = from + dieValue * direction(player);

  if (player === "white") {
    if (dest < 0) return 24; // bear off
    if (dest >= POINTS_COUNT) return null;
  } else {
    if (dest >= POINTS_COUNT) return 24; // bear off
    if (dest < 0) return null;
  }

  return dest;
}

/**
 * Get all valid moves from a specific point with a specific die value.
 */
function getMovesFromPoint(
  board: BoardState,
  player: PlayerColor,
  from: number,
  dieValue: number
): Move[] {
  const dest = getDestination(from, dieValue, player);
  if (dest === null) return [];

  if (dest === 24) {
    // Bear off
    if (!canBearOff(board, player)) return [];

    const [homeStart, homeEnd] = homeRange(player);

    // For bearing off, the die must be exact or higher with no checkers
    // on higher points within the home board.
    const distanceToOff =
      player === "white" ? from + 1 : POINTS_COUNT - from;

    if (dieValue === distanceToOff) {
      return [{ from, to: 24, dieValue }];
    }

    if (dieValue > distanceToOff) {
      // Allowed only if no checkers on higher points
      const hasHigher =
        player === "white"
          ? board.points
              .slice(from + 1, homeEnd + 1)
              .some((p) => p.color === player && p.count > 0)
          : board.points
              .slice(homeStart, from)
              .some((p) => p.color === player && p.count > 0);

      if (!hasHigher) {
        return [{ from, to: 24, dieValue }];
      }
    }

    return [];
  }

  // Normal move
  if (isBlocked(board.points[dest], player)) return [];

  return [{ from, to: dest, dieValue }];
}

/**
 * Get all valid moves for a player given remaining dice values.
 */
export function getValidMoves(
  board: BoardState,
  player: PlayerColor,
  remaining: number[]
): Move[] {
  const uniqueValues = [...new Set(remaining)];
  const moves: Move[] = [];
  const seen = new Set<string>();

  // If player has checkers on bar, must enter those first
  if (board.bar[player] > 0) {
    for (const dv of uniqueValues) {
      for (const m of getMovesFromPoint(board, player, -1, dv)) {
        const key = `${m.from}:${m.to}:${m.dieValue}`;
        if (!seen.has(key)) {
          seen.add(key);
          moves.push(m);
        }
      }
    }
    return moves;
  }

  // Check all points with player's checkers
  for (let i = 0; i < POINTS_COUNT; i++) {
    const pt = board.points[i];
    if (pt.color !== player || pt.count === 0) continue;

    for (const dv of uniqueValues) {
      for (const m of getMovesFromPoint(board, player, i, dv)) {
        const key = `${m.from}:${m.to}:${m.dieValue}`;
        if (!seen.has(key)) {
          seen.add(key);
          moves.push(m);
        }
      }
    }
  }

  return moves;
}

/**
 * Get all point indices from which the player can legally move.
 * Returns -1 for bar.
 */
export function getValidSourcePoints(
  board: BoardState,
  player: PlayerColor,
  remaining: number[]
): number[] {
  const moves = getValidMoves(board, player, remaining);
  const sources = new Set(moves.map((m) => m.from));
  // Sort: bar (-1) first, then ascending for white (home side first),
  // or ascending for black
  return [...sources].sort((a, b) => a - b);
}

/**
 * Get valid moves from a specific source point.
 */
export function getMovesFromSource(
  board: BoardState,
  player: PlayerColor,
  from: number,
  remaining: number[]
): Move[] {
  const uniqueValues = [...new Set(remaining)];
  const moves: Move[] = [];
  const seen = new Set<string>();

  for (const dv of uniqueValues) {
    for (const m of getMovesFromPoint(board, player, from, dv)) {
      const key = `${m.from}:${m.to}:${m.dieValue}`;
      if (!seen.has(key)) {
        seen.add(key);
        moves.push(m);
      }
    }
  }

  return moves;
}

/**
 * Apply a move to the board, returning a new board state.
 * Handles hitting opponent blots.
 */
export function applyMove(
  board: BoardState,
  move: Move,
  player: PlayerColor
): BoardState {
  const next = cloneBoard(board);
  const opponent: PlayerColor = player === "white" ? "black" : "white";

  // Remove checker from source
  if (move.from === -1) {
    next.bar[player]--;
  } else {
    next.points[move.from].count--;
    if (next.points[move.from].count === 0) {
      next.points[move.from].color = null;
    }
  }

  // Place checker at destination
  if (move.to === 24) {
    // Bear off
    next.borneOff[player]++;
  } else {
    // Hit opponent blot?
    if (
      next.points[move.to].color === opponent &&
      next.points[move.to].count === 1
    ) {
      next.points[move.to].count = 0;
      next.points[move.to].color = null;
      next.bar[opponent]++;
    }

    next.points[move.to].count++;
    next.points[move.to].color = player;
  }

  return next;
}

/**
 * Remove one instance of a die value from remaining.
 */
export function consumeDie(remaining: number[], value: number): number[] {
  const idx = remaining.indexOf(value);
  if (idx === -1) return remaining;
  const next = [...remaining];
  next.splice(idx, 1);
  return next;
}

/**
 * Check if the player has won (all 15 checkers borne off).
 */
export function hasWon(board: BoardState, player: PlayerColor): boolean {
  return board.borneOff[player] >= CHECKERS_PER_PLAYER;
}

/**
 * Backgammon rule: player must use the maximum number of dice possible.
 * If only one die can be used, must use the higher one.
 *
 * Returns the set of remaining dice values that are forced.
 * If both dice can be used, returns null (no constraint).
 */
export function getMaxDiceConstraint(
  board: BoardState,
  player: PlayerColor,
  remaining: number[]
): number[] | null {
  if (remaining.length <= 1) return null;

  const uniqueValues = [...new Set(remaining)];
  if (uniqueValues.length === 1) return null; // doubles, no constraint needed

  // Check if both dice can be used in some sequence
  for (const firstValue of uniqueValues) {
    const otherValue = uniqueValues.find((v) => v !== firstValue);
    if (otherValue === undefined) continue;

    const firstMoves = getValidMoves(board, player, [firstValue]);
    for (const m1 of firstMoves) {
      const boardAfter = applyMove(board, m1, player);
      const secondMoves = getValidMoves(boardAfter, player, [otherValue]);
      if (secondMoves.length > 0) {
        return null; // both can be used, no constraint
      }
    }
  }

  // Only one die can be used — must use the higher value if possible
  const sorted = [...uniqueValues].sort((a, b) => b - a);
  for (const v of sorted) {
    const moves = getValidMoves(board, player, [v]);
    if (moves.length > 0) {
      return [v];
    }
  }

  return []; // no moves at all
}
