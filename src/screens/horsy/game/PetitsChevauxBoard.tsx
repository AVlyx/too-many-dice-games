/**
 * Le jeu des petits chevaux — board only, no game logic.
 *
 * Geometry: 15x15 grid.
 *  - track: 56 cases around the perimeter, index 0 = top-left corner, clockwise.
 *  - escalier: 6 cases per player, index 0 = outermost, 5 = closest to the centre.
 *  - écurie: 2x2 stable per player, slots 0..3.
 *  - arrivée: centre case (col 8, row 8).
 *
 * Each player's escalier entry sits at the middle of one side; their departure
 * case ("D") is the case just after it, so a full lap is 55 steps.
 *
 *   red    escalier = top,    entry 7,  departure 8
 *   blue   escalier = right,  entry 21, departure 22
 *   yellow escalier = bottom, entry 35, departure 36
 *   green  escalier = left,   entry 49, departure 50
 */
import React, { useState } from "react";

export type PlayerColor = "red" | "blue" | "yellow" | "green";
export type PieceLoc = "stable" | "track" | "ladder" | "home";

export interface Piece {
  id: string;
  color: PlayerColor;
  loc: PieceLoc;
  /** track: 0..55 · ladder: 0..5 · stable: 0..3 · home: ignored */
  i: number;
}

export const ORDER: PlayerColor[] = ["red", "blue", "yellow", "green"];
export const ENTRY: Record<PlayerColor, number> = { red: 7, blue: 21, yellow: 35, green: 49 };
export const START: Record<PlayerColor, number> = { red: 8, blue: 22, yellow: 36, green: 50 };
export const TRACK_LENGTH = 56;
export const LADDER_LENGTH = 6;

const COL: Record<PlayerColor, [number, number, number]> = {
  red: [0.55, 0.16, 25],
  blue: [0.52, 0.12, 255],
  yellow: [0.72, 0.13, 85],
  green: [0.5, 0.12, 150],
};
const NAME: Record<PlayerColor, string> = {
  red: "Red",
  blue: "Blue",
  yellow: "Yellow",
  green: "Green",
};
const STABLE: Record<PlayerColor, [number, number]> = {
  green: [2, 2],
  red: [13, 2],
  blue: [13, 13],
  yellow: [2, 13],
};
const SLOT: [number, number][] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
];
const HOME: [number, number] = [8, 8];

const ok = (c: [number, number, number], a?: number) =>
  `oklch(${c[0]} ${c[1]} ${c[2]}${a === undefined ? "" : ` / ${a}`})`;

export function trackCoord(i: number): [number, number] {
  if (i < 14) return [i + 1, 1];
  if (i < 28) return [15, i - 13];
  if (i < 42) return [15 - (i - 28), 15];
  return [1, 15 - (i - 42)];
}

export function ladderCoord(color: PlayerColor, k: number): [number, number] {
  if (color === "red") return [8, 2 + k];
  if (color === "blue") return [14 - k, 8];
  if (color === "yellow") return [8, 14 - k];
  return [2 + k, 8];
}

export function pieceCoord(p: Piece): [number, number] {
  if (p.loc === "track") return trackCoord(p.i);
  if (p.loc === "ladder") return ladderCoord(p.color, p.i);
  if (p.loc === "home") return HOME;
  const s = STABLE[p.color];
  const o = SLOT[p.i % 4];
  return [s[0] + o[0], s[1] + o[1]];
}

export const initialPieces: Piece[] = ORDER.flatMap((color) =>
  [0, 1, 2, 3].map((n) => ({ id: `${color}-${n + 1}`, color, loc: "stable" as PieceLoc, i: n })),
);

interface BoardProps {
  pieces?: Piece[];
  cell?: number;
  showNumbers?: boolean;
  pieceStyle?: "knight" | "disc";
  boardColor?: string;
  onCaseClick?: (loc: PieceLoc, i: number, color?: PlayerColor) => void;
  onPieceClick?: (piece: Piece) => void;
}

export default function PetitsChevauxBoard({
  pieces: piecesProp,
  cell = 44,
  showNumbers = false,
  pieceStyle = "knight",
  boardColor = "oklch(0.93 0.02 85)",
  onCaseClick,
  onPieceClick,
}: BoardProps) {
  // Replace / lift this as you wire up your own game logic.
  const [pieces] = useState<Piece[]>(piecesProp ?? initialPieces);
  const list = piecesProp ?? pieces;

  const base = (c: number, r: number): React.CSSProperties => ({
    gridColumn: c,
    gridRow: r,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "oklch(0.985 0.006 85)",
    border: "1px solid oklch(0.82 0.015 80)",
    borderRadius: 3,
    fontSize: 11,
    letterSpacing: "0.04em",
    color: "oklch(0.66 0.02 60)",
    cursor: onCaseClick ? "pointer" : "default",
  });

  const track = Array.from({ length: TRACK_LENGTH }, (_, i) => {
    const [c, r] = trackCoord(i);
    const st = base(c, r);
    const owner = ORDER.find((k) => START[k] === i);
    const entry = ORDER.find((k) => ENTRY[k] === i);
    if (owner) {
      st.background = ok(COL[owner], 0.22);
      st.border = `2px solid ${ok(COL[owner])}`;
      st.color = ok(COL[owner]);
    } else if (entry) {
      st.background = ok(COL[entry], 0.14);
      st.border = `1px dashed ${ok(COL[entry])}`;
      st.color = ok(COL[entry]);
    }
    return (
      <div key={`t${i}`} style={st} onClick={() => onCaseClick?.("track", i)}>
        {owner ? "S" : entry ? "\u2192" : showNumbers ? i + 1 : ""}
      </div>
    );
  });

  const ladders = ORDER.flatMap((color) =>
    Array.from({ length: LADDER_LENGTH }, (_, k) => {
      const [c, r] = ladderCoord(color, k);
      const st = base(c, r);
      st.background = ok(COL[color], 0.16 + k * 0.13);
      st.border = `1px solid ${ok(COL[color], 0.5)}`;
      st.color = "oklch(0.99 0 0 / 0.85)";
      return (
        <div key={`l${color}${k}`} style={st} onClick={() => onCaseClick?.("ladder", k, color)}>
          {showNumbers ? k + 1 : ""}
        </div>
      );
    }),
  );

  const stables = ORDER.flatMap((color) => {
    const s = STABLE[color];
    return [
      <div
        key={`s${color}`}
        onClick={() => onCaseClick?.("stable", 0, color)}
        style={{
          gridColumn: `${s[0]} / span 2`,
          gridRow: `${s[1]} / span 2`,
          background: ok(COL[color], 0.1),
          border: `1px solid ${ok(COL[color], 0.45)}`,
          borderRadius: 8,
        }}
      />,
      <div
        key={`sl${color}`}
        style={{
          gridColumn: `${s[0]} / span 2`,
          gridRow: s[1] === 2 ? s[1] + 2 : s[1] - 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: ok(COL[color], 0.9),
        }}
      >
        {NAME[color]}
      </div>,
    ];
  });

  const seen: Record<string, number> = {};
  const horses = list.map((p) => {
    const [c, r] = pieceCoord(p);
    const key = `${c}:${r}`;
    const n = seen[key] ?? 0;
    seen[key] = n + 1;
    return (
      <div
        key={p.id}
        onClick={() => onPieceClick?.(p)}
        style={{
          gridColumn: c,
          gridRow: r,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize:
            p.loc === "home" ? cell * 0.38 : pieceStyle === "knight" ? cell * 0.68 : cell * 0.5,
          lineHeight: 1,
          color: ok(COL[p.color]),
          textShadow: "0 1px 0 oklch(1 0 0 / 0.7)",
          transform: n
            ? `translate(${n * (p.loc === "home" ? 8 : 5)}px, ${-n * (p.loc === "home" ? 8 : 5)}px)`
            : undefined,
          zIndex: 5 + n,
          cursor: onPieceClick ? "pointer" : "default",
          pointerEvents: onPieceClick ? "auto" : "none",
        }}
      >
        {pieceStyle === "knight" ? "\u265E" : "\u25CF"}
      </div>
    );
  });

  return (
    <div
      style={{
        display: "inline-block",
        padding: 18,
        background: boardColor,
        borderRadius: 10,
        boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.6), 0 12px 40px oklch(0.4 0.03 70 / 0.16)",
        fontFamily: "'EB Garamond', Georgia, serif",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(15, ${cell}px)`,
          gridTemplateRows: `repeat(15, ${cell}px)`,
          gap: 2,
        }}
      >
        {stables}
        {track}
        {ladders}
        <div
          style={{
            gridColumn: 8,
            gridRow: 8,
            background: "oklch(0.985 0.006 85)",
            border: "1px solid oklch(0.72 0.015 80)",
            borderRadius: "50%",
            boxShadow: "0 0 0 5px oklch(0.96 0.012 85), 0 0 0 6px oklch(0.82 0.015 80)",
          }}
        />
        {horses}
      </div>
    </div>
  );
}
