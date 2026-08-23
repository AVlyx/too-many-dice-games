/**
 * Le jeu des petits chevaux — rules engine. Pure functions, no React.
 *
 * A horse's position is expressed as its *progress* along its own path:
 *
 *   -1        in the stable
 *   0..55     on the track, case (START[color] + p) % 56 — p = 55 is ENTRY[color]
 *   56..61    ladder case p - 56
 *   62        home (the centre)
 *
 * A full lap is therefore 55 steps and the centre sits at PATH_END = 62.
 */
import {
  ORDER,
  START,
  TRACK_LENGTH,
  LADDER_LENGTH,
  type Piece,
  type PieceLoc,
  type PlayerColor,
} from "./PetitsChevauxBoard";

export const STABLE_PROGRESS = -1;
export const LADDER_START = TRACK_LENGTH; // 56
export const PATH_END = TRACK_LENGTH + LADDER_LENGTH; // 62 — the centre
export const HORSES_PER_PLAYER = 4;

export type MoveKind = "exit" | "advance" | "enter-ladder" | "finish";

export interface Move {
  pieceId: string;
  color: PlayerColor;
  from: number;
  to: number;
  kind: MoveKind;
  /** id of the opponent horse sent back to its stable by this move */
  capturesPieceId?: string;
}

/** Where a horse sits along its own path. */
export function progressOf(p: Piece): number {
  if (p.loc === "stable") return STABLE_PROGRESS;
  if (p.loc === "home") return PATH_END;
  if (p.loc === "ladder") return LADDER_START + p.i;
  return (p.i - START[p.color] + TRACK_LENGTH) % TRACK_LENGTH;
}

/** Inverse of progressOf: the board location a given progress maps to. */
export function locateProgress(
  color: PlayerColor,
  progress: number,
): { loc: PieceLoc; i: number } {
  if (progress >= PATH_END) return { loc: "home", i: 0 };
  if (progress >= LADDER_START) return { loc: "ladder", i: progress - LADDER_START };
  return { loc: "track", i: (START[color] + progress) % TRACK_LENGTH };
}

/** The absolute track case a progress sits on, or null when off the track. */
export function trackIndexOf(color: PlayerColor, progress: number): number | null {
  if (progress < 0 || progress >= LADDER_START) return null;
  return (START[color] + progress) % TRACK_LENGTH;
}

function firstFreeStableSlot(pieces: Piece[], color: PlayerColor): number {
  const taken = new Set(
    pieces.filter((p) => p.color === color && p.loc === "stable").map((p) => p.i),
  );
  for (let i = 0; i < HORSES_PER_PLAYER; i++) if (!taken.has(i)) return i;
  return 0;
}

/** The horse standing on `progress` of `color`'s path, if any. */
function occupantAt(pieces: Piece[], color: PlayerColor, progress: number): Piece | undefined {
  if (progress >= PATH_END) return undefined; // the centre stacks
  if (progress >= LADDER_START) {
    return pieces.find(
      (p) => p.color === color && p.loc === "ladder" && p.i === progress - LADDER_START,
    );
  }
  const cell = trackIndexOf(color, progress);
  return pieces.find((p) => p.loc === "track" && p.i === cell);
}

function kindOf(from: number, to: number): MoveKind {
  if (to >= PATH_END) return "finish";
  if (from < LADDER_START && to >= LADDER_START) return "enter-ladder";
  return from === STABLE_PROGRESS ? "exit" : "advance";
}

/** Every move `color` may legally play with `die`. Empty means the turn is skipped. */
export function legalMoves(pieces: Piece[], color: PlayerColor, die: number): Move[] {
  const moves: Move[] = [];

  for (const piece of pieces) {
    if (piece.color !== color || piece.loc === "home") continue;

    const from = progressOf(piece);
    // Leaving the stable takes a 6 and always lands on the departure case.
    const to = from === STABLE_PROGRESS ? (die === 6 ? 0 : null) : from + die;
    if (to === null) continue;
    // The centre must be reached exactly — overshooting is not a move.
    if (to > PATH_END) continue;

    const blocker = occupantAt(pieces, color, to);
    if (blocker) {
      // Own horses block; ladder cases are private so any occupant there is own.
      if (blocker.color === color) continue;
      moves.push({
        pieceId: piece.id,
        color,
        from,
        to,
        kind: kindOf(from, to),
        capturesPieceId: blocker.id,
      });
      continue;
    }
    moves.push({ pieceId: piece.id, color, from, to, kind: kindOf(from, to) });
  }

  return moves;
}

/** Plays `move`, returning a new piece list. Captured horses go back to their stable. */
export function applyMove(pieces: Piece[], move: Move): Piece[] {
  const next = pieces.map((p) => {
    if (p.id !== move.pieceId) return p;
    const { loc, i } = locateProgress(move.color, move.to);
    return { ...p, loc, i };
  });

  if (move.capturesPieceId) {
    const victim = next.find((p) => p.id === move.capturesPieceId)!;
    const slot = firstFreeStableSlot(next, victim.color);
    return next.map((p) =>
      p.id === victim.id ? { ...p, loc: "stable" as PieceLoc, i: slot } : p,
    );
  }

  return next;
}

/** The colour that has brought all four horses home, if any. */
export function winner(pieces: Piece[]): PlayerColor | null {
  return (
    ORDER.find(
      (color) =>
        pieces.filter((p) => p.color === color && p.loc === "home").length === HORSES_PER_PLAYER,
    ) ?? null
  );
}

export function horsesHome(pieces: Piece[], color: PlayerColor): number {
  return pieces.filter((p) => p.color === color && p.loc === "home").length;
}

/** True when every horse of `color` is still stabled — i.e. they simply need a 6. */
export function allStabled(pieces: Piece[], color: PlayerColor): boolean {
  return pieces.every((p) => p.color !== color || p.loc === "stable");
}

function horseNumber(pieceId: string): string {
  return pieceId.split("-")[1] ?? "?";
}

function spot(color: PlayerColor, progress: number): string {
  if (progress === STABLE_PROGRESS) return "stable";
  if (progress >= PATH_END) return "home";
  if (progress >= LADDER_START) return `ladder ${progress - LADDER_START + 1}`;
  return `case ${(trackIndexOf(color, progress) ?? 0) + 1}`;
}

/**
 * Label shown in the app's picker. Prefixed with the horse number so that every
 * option in a turn is unique — the picker answers with the label string.
 */
export function describeMove(move: Move): string {
  const head = `Horse ${horseNumber(move.pieceId)}`;
  const tail = move.capturesPieceId
    ? ` — captures ${move.capturesPieceId.split("-")[0]} ${horseNumber(move.capturesPieceId)}`
    : "";
  if (move.kind === "exit") return `${head} · stable → start${tail}`;
  return `${head} · ${spot(move.color, move.from)} → ${spot(move.color, move.to)}${tail}`;
}
