/**
 * The backgammon board — drawing only, no game logic.
 *
 * Geometry: 12 points per row split by the bar, plus a bear-off tray on the
 * right. The numbering drawn is absolute and shared by both sides: "1" is the
 * point at the bottom right, "24" the one at the top right.
 *
 *   index  0..5   bottom row, right of the bar   (white's home board)
 *   index  6..11  bottom row, left of the bar
 *   index 12..17  top row, left of the bar
 *   index 18..23  top row, right of the bar      (black's home board)
 */
import React from "react";
import {
  POINT_COUNT,
  checkersOn,
  pointLabel,
  type BgState,
  type Player,
  type Source,
  type Target,
} from "./rules";

const P = 46; // width of one point
const R = 20; // radius of one checker
const BAR = 48;
const FRAME = 26;
const TRAY = 48;
const TRAY_GAP = 8;
const POINT_H = 5 * 2 * R + 12;
const INNER_H = 2 * POINT_H + 76;
const INNER_W = 12 * P + BAR;
const WIDTH = FRAME * 2 + INNER_W + TRAY_GAP + TRAY;
const HEIGHT = FRAME * 2 + INNER_H;
/** How many checkers stack up before the pile switches to a counter. */
const STACK_MAX = 5;

const FRAME_FILL = "oklch(0.38 0.045 50)";
const FELT = "oklch(0.93 0.02 85)";
const POINT_LIGHT = "oklch(0.99 0.012 85)";
const POINT_DARK = "oklch(0.62 0.12 35)";
const RULE = "oklch(0.78 0.02 75)";

const CHECKER: Record<Player, { fill: string; edge: string; text: string }> = {
  white: { fill: "oklch(0.97 0.015 85)", edge: "oklch(0.66 0.02 70)", text: "oklch(0.35 0.02 70)" },
  black: { fill: "oklch(0.32 0.02 60)", edge: "oklch(0.16 0.01 60)", text: "oklch(0.95 0.01 85)" },
};

const PICK = "oklch(0.62 0.2 300)";
const LAND = "oklch(0.52 0.14 155)";
const HIT = "oklch(0.55 0.22 25)";

/** A point's screen column: 0..5 on the left, 6 the bar, 7..12 on the right. */
function columnOf(i: number): number {
  if (i < 6) return 12 - i;
  if (i < 12) return 11 - i;
  if (i < 18) return i - 12;
  return i - 18 + 7;
}

function columnX(col: number): number {
  if (col < 6) return FRAME + col * P + P / 2;
  if (col === 6) return FRAME + 6 * P + BAR / 2;
  return FRAME + 6 * P + BAR + (col - 7) * P + P / 2;
}

const isTopRow = (i: number) => i >= 12;
const pointX = (i: number) => columnX(columnOf(i));
const TOP_Y = FRAME;
const BOTTOM_Y = FRAME + INNER_H;
const MID_Y = FRAME + INNER_H / 2;
const TRAY_X = FRAME + INNER_W + TRAY_GAP;

/** The centre of the k-th checker on a point (0 = the one at the edge). */
function checkerCenter(i: number, k: number): [number, number] {
  const capped = Math.min(k, STACK_MAX - 1);
  const y = isTopRow(i) ? TOP_Y + R + 2 + capped * 2 * R : BOTTOM_Y - R - 2 - capped * 2 * R;
  return [pointX(i), y];
}

/** The centre of the k-th checker on the bar — each side on its own half. */
function barCenter(player: Player, k: number): [number, number] {
  const capped = Math.min(k, 3);
  const x = columnX(6);
  return player === "white"
    ? [x, MID_Y - 34 - capped * 2 * R]
    : [x, MID_Y + 34 + capped * 2 * R];
}

/** The borne-off counter, set in the frame opposite the tray. */
function trayLabel(player: Player): [number, number] {
  return [TRAY_X + TRAY / 2, player === "white" ? HEIGHT - FRAME + 18 : FRAME - 9];
}

interface BoardProps {
  state: BgState;
  /** Rendered width in pixels; the internal geometry does not change. */
  width?: number;
  showNumbers?: boolean;
  /** Whose turn it is — their bear-off tray is brought forward. */
  activePlayer?: Player | null;
  /** The starting point currently picked in the app's form. */
  selected?: Source | null;
  /** Where that checker would land. */
  target?: Target | null;
  /** Draw the landing square as a hit. */
  targetHit?: boolean;
}

function Checker({
  cx,
  cy,
  player,
  count,
}: {
  cx: number;
  cy: number;
  player: Player;
  count?: number;
}) {
  const skin = CHECKER[player];
  return (
    <g>
      <circle cx={cx} cy={cy} r={R - 2} fill={skin.fill} stroke={skin.edge} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={R - 8} fill="none" stroke={skin.edge} strokeWidth={1} opacity={0.5} />
      {count !== undefined && (
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          fontSize={15}
          fontWeight={600}
          fill={skin.text}
        >
          {count}
        </text>
      )}
    </g>
  );
}

export default function BackgammonBoard({
  state,
  width = WIDTH,
  showNumbers = true,
  activePlayer = null,
  selected = null,
  target = null,
  targetHit = false,
}: BoardProps) {
  const points: React.ReactElement[] = [];

  for (let i = 0; i < POINT_COUNT; i++) {
    const x = pointX(i);
    const top = isTopRow(i);
    const baseY = top ? TOP_Y : BOTTOM_Y;
    const apexY = top ? TOP_Y + POINT_H : BOTTOM_Y - POINT_H;
    points.push(
      <polygon
        key={`p${i}`}
        points={`${x - P / 2},${baseY} ${x + P / 2},${baseY} ${x},${apexY}`}
        fill={i % 2 === 0 ? POINT_DARK : POINT_LIGHT}
        stroke={RULE}
        strokeWidth={0.75}
      />,
    );
    if (showNumbers) {
      points.push(
        <text
          key={`n${i}`}
          x={x}
          y={top ? FRAME - 9 : HEIGHT - FRAME + 18}
          textAnchor="middle"
          fontSize={12}
          fill="oklch(0.88 0.02 75)"
          letterSpacing="0.06em"
        >
          {pointLabel(i)}
        </text>,
      );
    }
  }

  const checkers: React.ReactElement[] = [];
  for (let i = 0; i < POINT_COUNT; i++) {
    const player: Player = state.points[i] > 0 ? "white" : "black";
    const n = Math.abs(state.points[i]);
    for (let k = 0; k < Math.min(n, STACK_MAX); k++) {
      const [cx, cy] = checkerCenter(i, k);
      const last = k === STACK_MAX - 1 && n > STACK_MAX;
      checkers.push(
        <Checker key={`c${i}-${k}`} cx={cx} cy={cy} player={player} count={last ? n : undefined} />,
      );
    }
  }

  for (const player of ["white", "black"] as Player[]) {
    const n = state.bar[player];
    for (let k = 0; k < Math.min(n, 4); k++) {
      const [cx, cy] = barCenter(player, k);
      const last = k === 3 && n > 4;
      checkers.push(
        <Checker key={`b${player}${k}`} cx={cx} cy={cy} player={player} count={last ? n : undefined} />,
      );
    }
  }

  // The bear-off tray: one bar per checker taken off, stacked from the edge.
  const borne: React.ReactElement[] = [];
  for (const player of ["white", "black"] as Player[]) {
    const n = state.off[player];
    const skin = CHECKER[player];
    for (let k = 0; k < n; k++) {
      const h = 11;
      const y = player === "white" ? BOTTOM_Y - 6 - (k + 1) * (h + 1) : TOP_Y + 6 + k * (h + 1);
      borne.push(
        <rect
          key={`o${player}${k}`}
          x={TRAY_X + 6}
          y={y}
          width={TRAY - 12}
          height={h}
          rx={3}
          fill={skin.fill}
          stroke={skin.edge}
          strokeWidth={1}
        />,
      );
    }
  }

  const overlays: React.ReactElement[] = [];

  if (selected !== null) {
    if (selected === "bar") {
      overlays.push(
        <rect
          key="sel-bar"
          x={columnX(6) - BAR / 2 + 3}
          y={FRAME + 3}
          width={BAR - 6}
          height={INNER_H - 6}
          rx={6}
          fill="none"
          stroke={PICK}
          strokeWidth={3}
          className="bg-pulse"
        />,
      );
    } else {
      const x = pointX(selected);
      const top = isTopRow(selected);
      const baseY = top ? TOP_Y : BOTTOM_Y;
      const apexY = top ? TOP_Y + POINT_H : BOTTOM_Y - POINT_H;
      overlays.push(
        <polygon
          key="sel"
          points={`${x - P / 2},${baseY} ${x + P / 2},${baseY} ${x},${apexY}`}
          fill={PICK}
          fillOpacity={0.28}
          stroke={PICK}
          strokeWidth={3}
          className="bg-pulse"
        />,
      );
      const topIndex = Math.min(Math.abs(state.points[selected]), STACK_MAX) - 1;
      if (topIndex >= 0) {
        const [cx, cy] = checkerCenter(selected, topIndex);
        overlays.push(
          <circle
            key="sel-checker"
            cx={cx}
            cy={cy}
            r={R + 1}
            fill="none"
            stroke={PICK}
            strokeWidth={3}
            className="bg-pulse"
          />,
        );
      }
    }
  }

  if (target !== null) {
    const ring = targetHit ? HIT : LAND;
    if (target === "off") {
      overlays.push(
        <rect
          key="tgt-off"
          x={TRAY_X + 2}
          y={activePlayer === "black" ? TOP_Y + 2 : MID_Y}
          width={TRAY - 4}
          height={INNER_H / 2 - 4}
          rx={6}
          fill={ring}
          fillOpacity={0.22}
          stroke={ring}
          strokeWidth={3}
          className="bg-pulse"
        />,
      );
    } else {
      const player: Player = activePlayer ?? (state.points[target] >= 0 ? "white" : "black");
      const already = targetHit ? 0 : checkersOn(state, target, player);
      const [cx, cy] = checkerCenter(target, already);
      overlays.push(
        <circle
          key="tgt"
          cx={cx}
          cy={cy}
          r={R}
          fill={ring}
          fillOpacity={0.3}
          stroke={ring}
          strokeWidth={3}
          className="bg-pulse"
        />,
      );
    }
  }

  const [wtx, wty] = trayLabel("white");
  const [btx, bty] = trayLabel("black");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={width}
      style={{
        maxWidth: "100%",
        height: "auto",
        borderRadius: 10,
        boxShadow: "0 12px 40px oklch(0.4 0.03 70 / 0.22)",
        fontFamily: "'EB Garamond', Georgia, serif",
      }}
      role="img"
      aria-label="Backgammon board"
    >
      <rect width={WIDTH} height={HEIGHT} rx={10} fill={FRAME_FILL} />
      <rect x={FRAME} y={FRAME} width={INNER_W} height={INNER_H} fill={FELT} />
      <rect
        x={TRAY_X}
        y={FRAME}
        width={TRAY}
        height={INNER_H}
        fill={FELT}
        opacity={activePlayer ? 1 : 0.9}
      />

      {points}

      {/* The bar */}
      <rect x={columnX(6) - BAR / 2} y={FRAME} width={BAR} height={INNER_H} fill={FRAME_FILL} />
      <line
        x1={columnX(6) - BAR / 2}
        y1={MID_Y}
        x2={columnX(6) + BAR / 2}
        y2={MID_Y}
        stroke="oklch(0.5 0.04 50)"
        strokeWidth={1}
      />

      {/* Divider for the bear-off tray */}
      <line x1={TRAY_X} y1={MID_Y} x2={TRAY_X + TRAY} y2={MID_Y} stroke={RULE} strokeWidth={1} />
      {borne}

      {checkers}
      {overlays}

      <text x={wtx} y={wty} textAnchor="middle" fontSize={12} fill="oklch(0.88 0.02 75)">
        {state.off.white}/15
      </text>
      <text x={btx} y={bty} textAnchor="middle" fontSize={12} fill="oklch(0.88 0.02 75)">
        {state.off.black}/15
      </text>

      <style>{".bg-pulse{animation:bg-pulse 1.2s ease-in-out infinite}@keyframes bg-pulse{0%,100%{opacity:1}50%{opacity:0.35}}"}</style>
    </svg>
  );
}
