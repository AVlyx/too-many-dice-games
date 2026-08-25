/**
 * Backgammon — rules engine. Pure functions, no React.
 *
 * The board is an array of 24 points in absolute numbering: the point drawn as
 * "1" is index 0, at the bottom right.
 *
 *   points[i] > 0  →  points[i] white checkers
 *   points[i] < 0  → -points[i] black checkers
 *
 * White runs down (23 → 0) and bears off at the bottom; its home board is
 * 0..5. Black runs up (0 → 23) and bears off at the top; its home board is
 * 18..23. Both sides therefore read the same numbering off the shared screen.
 */

export type Player = "white" | "black";

export const PLAYERS: Player[] = ["white", "black"];
export const POINT_COUNT = 24;
export const CHECKERS_PER_PLAYER = 15;

/** Where a checker starts from: a point, or the bar. */
export type Source = number | "bar";
/** Where it lands: a point, or off the board. */
export type Target = number | "off";

export interface BgState {
  points: number[];
  bar: Record<Player, number>;
  off: Record<Player, number>;
}

export interface BgMove {
  player: Player;
  die: number;
  from: Source;
  to: Target;
  /** The move lands on a lone opponent checker and sends it to the bar. */
  hit: boolean;
}

export function opponent(player: Player): Player {
  return player === "white" ? "black" : "white";
}

/** The side's sign in `points`. */
export function sign(player: Player): number {
  return player === "white" ? 1 : -1;
}

/** The standard opening position: 2 / 5 / 3 / 5 checkers. */
export function initialState(): BgState {
  const points = Array.from({ length: POINT_COUNT }, () => 0);
  points[23] = 2;
  points[12] = 5;
  points[7] = 3;
  points[5] = 5;
  points[0] = -2;
  points[11] = -5;
  points[16] = -3;
  points[18] = -5;
  return { points, bar: { white: 0, black: 0 }, off: { white: 0, black: 0 } };
}

/** How many checkers `player` has on point `i`. */
export function checkersOn(state: BgState, i: number, player: Player): number {
  return Math.max(0, state.points[i] * sign(player));
}

/** The point a checker on the bar enters on with this die. */
export function entryPoint(player: Player, die: number): number {
  return player === "white" ? POINT_COUNT - die : die - 1;
}

/** How many pips a checker on `i` still has to travel to bear off. */
export function pipsToOff(player: Player, i: number): number {
  return player === "white" ? i + 1 : POINT_COUNT - i;
}

export function inHomeBoard(player: Player, i: number): boolean {
  return player === "white" ? i <= 5 : i >= 18;
}

/** True once all 15 checkers are home: bearing off may start. */
export function canBearOff(state: BgState, player: Player): boolean {
  if (state.bar[player] > 0) return false;
  for (let i = 0; i < POINT_COUNT; i++) {
    if (checkersOn(state, i, player) > 0 && !inHomeBoard(player, i)) return false;
  }
  return true;
}

/** The distance to the edge of the side's furthest-back checker. */
function farthestPips(state: BgState, player: Player): number {
  let max = 0;
  for (let i = 0; i < POINT_COUNT; i++) {
    if (checkersOn(state, i, player) > 0) max = Math.max(max, pipsToOff(player, i));
  }
  return max;
}

/** Total pips left to travel — the usual measure of who is ahead in the race. */
export function pipCount(state: BgState, player: Player): number {
  let total = state.bar[player] * (POINT_COUNT + 1);
  for (let i = 0; i < POINT_COUNT; i++) {
    total += checkersOn(state, i, player) * pipsToOff(player, i);
  }
  return total;
}

/**
 * Every move playable with this single die, ignoring the other dice. A point
 * held by two or more opponent checkers is closed.
 */
export function legalMovesForDie(state: BgState, player: Player, die: number): BgMove[] {
  const s = sign(player);
  const moves: BgMove[] = [];

  // While a checker sits on the bar, nothing else may move.
  if (state.bar[player] > 0) {
    const to = entryPoint(player, die);
    const occupant = state.points[to] * s;
    if (occupant >= -1) moves.push({ player, die, from: "bar", to, hit: occupant === -1 });
    return moves;
  }

  const bearing = canBearOff(state, player);
  const farthest = bearing ? farthestPips(state, player) : 0;

  for (let i = 0; i < POINT_COUNT; i++) {
    if (checkersOn(state, i, player) === 0) continue;
    const to = player === "white" ? i - die : i + die;

    if (to >= 0 && to < POINT_COUNT) {
      const occupant = state.points[to] * s;
      if (occupant >= -1) moves.push({ player, die, from: i, to, hit: occupant === -1 });
      continue;
    }

    if (!bearing) continue;
    const need = pipsToOff(player, i);
    // An exact count always bears off; a bigger die only bears off the
    // furthest-back checker.
    if (die === need || (die > need && need === farthest)) {
      moves.push({ player, die, from: i, to: "off", hit: false });
    }
  }

  return moves;
}

/** Plays `move`, returning a new state. The original is left untouched. */
export function applyMove(state: BgState, move: BgMove): BgState {
  const s = sign(move.player);
  const points = state.points.slice();
  const bar = { ...state.bar };
  const off = { ...state.off };

  if (move.from === "bar") bar[move.player] -= 1;
  else points[move.from] -= s;

  if (move.to === "off") {
    off[move.player] += 1;
  } else {
    if (move.hit) {
      points[move.to] = 0;
      bar[opponent(move.player)] += 1;
    }
    points[move.to] += s;
  }

  return { points, bar, off };
}

/** The dice of one roll: doubles are played four times. */
export function diceFromRoll(a: number, b: number): number[] {
  return a === b ? [a, a, a, a] : [a, b];
}

function without(dice: number[], index: number): number[] {
  return dice.slice(0, index).concat(dice.slice(index + 1));
}

/**
 * The most dice this side can still play. The rules require playing as many
 * dice as possible, so this figure is what filters the moves on offer.
 */
export function maxDiceUsable(state: BgState, player: Player, dice: number[]): number {
  if (dice.length === 0) return 0;
  let best = 0;
  const tried = new Set<number>();

  for (let i = 0; i < dice.length; i++) {
    const die = dice[i];
    if (tried.has(die)) continue;
    tried.add(die);
    const rest = without(dice, i);
    for (const move of legalMovesForDie(state, player, die)) {
      const used = 1 + maxDiceUsable(applyMove(state, move), player, rest);
      if (used > best) best = used;
      if (best === dice.length) return best;
    }
  }

  return best;
}

/**
 * The moves actually worth offering given the dice left:
 *  - only those that keep the maximum number of dice playable;
 *  - when just one of the two dice can be played, it must be the higher one.
 */
export function playableMoves(state: BgState, player: Player, dice: number[]): BgMove[] {
  const max = maxDiceUsable(state, player, dice);
  if (max === 0) return [];

  const moves: BgMove[] = [];
  const tried = new Set<number>();
  for (let i = 0; i < dice.length; i++) {
    const die = dice[i];
    if (tried.has(die)) continue;
    tried.add(die);
    const rest = without(dice, i);
    for (const move of legalMovesForDie(state, player, die)) {
      if (1 + maxDiceUsable(applyMove(state, move), player, rest) === max) moves.push(move);
    }
  }

  if (max === 1 && dice.length === 2 && dice[0] !== dice[1]) {
    const high = Math.max(dice[0], dice[1]);
    const strongest = moves.filter((m) => m.die === high);
    if (strongest.length > 0) return strongest;
  }

  return moves;
}

/** The distinct starting points among these moves, in board order. */
export function sourcesOf(moves: BgMove[]): Source[] {
  const sources: Source[] = [];
  if (moves.some((m) => m.from === "bar")) sources.push("bar");
  const seen = new Set<number>();
  for (const move of moves) {
    if (move.from === "bar" || seen.has(move.from)) continue;
    seen.add(move.from);
    sources.push(move.from);
  }
  sources.sort((a, b) => (a === "bar" ? -1 : b === "bar" ? 1 : a - b));
  return sources;
}

/** The distinct die values among these moves, highest first. */
export function diceOf(moves: BgMove[]): number[] {
  return [...new Set(moves.map((m) => m.die))].sort((a, b) => b - a);
}

export function winner(state: BgState): Player | null {
  return PLAYERS.find((p) => state.off[p] === CHECKERS_PER_PLAYER) ?? null;
}

export type WinKind = "single" | "gammon" | "backgammon";

/** Single, gammon (the loser bore off nothing) or backgammon (still in the winner's home). */
export function winKind(state: BgState, champion: Player): WinKind {
  const loser = opponent(champion);
  if (state.off[loser] > 0) return "single";
  if (state.bar[loser] > 0) return "backgammon";
  for (let i = 0; i < POINT_COUNT; i++) {
    if (checkersOn(state, i, loser) > 0 && inHomeBoard(champion, i)) return "backgammon";
  }
  return "gammon";
}

export const WIN_POINTS: Record<WinKind, number> = { single: 1, gammon: 2, backgammon: 3 };

/** The number drawn on the board for index `i`. */
export function pointLabel(i: number): number {
  return i + 1;
}

function sourceLabel(source: Source): string {
  return source === "bar" ? "bar" : `point ${pointLabel(source)}`;
}

function targetLabel(target: Target): string {
  return target === "off" ? "off" : `point ${pointLabel(target)}`;
}

/** Readable label for a move, mirrored onto the shared screen. */
export function describeMove(move: BgMove): string {
  const head = `${sourceLabel(move.from)} → ${targetLabel(move.to)}`;
  const capitalised = head[0].toUpperCase() + head.slice(1);
  return move.hit ? `${capitalised} · hit` : capitalised;
}
