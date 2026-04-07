export type PlayerColor = "white" | "black";

export interface PointState {
  count: number;
  color: PlayerColor | null;
}

export interface BoardState {
  /** 24 points indexed 0-23 */
  points: PointState[];
  bar: { white: number; black: number };
  borneOff: { white: number; black: number };
}

export type TurnPhase =
  | "waiting_for_players"
  | "rolling"
  | "selecting_move"
  | "turn_complete"
  | "game_over";

export interface DiceState {
  values: [number, number];
  remaining: number[];
}

export interface PlayerInfo {
  playerId: string;
  name: string;
}

export interface GameState {
  board: BoardState;
  currentPlayer: PlayerColor;
  phase: TurnPhase;
  dice: DiceState | null;
  /** Index into validSourcePoints for dpad cursor */
  selectedPointIndex: number;
  /** Point indices the current player can move from (-1 = bar) */
  validSourcePoints: number[];
  /** Which die value chosen via picker (null = auto or not yet chosen) */
  selectedDieValue: number | null;
  movesMadeThisTurn: Move[];
  winner: PlayerColor | null;
  players: {
    white: PlayerInfo | null;
    black: PlayerInfo | null;
  };
}

export interface Move {
  /** -1 for bar */
  from: number;
  /** 24 for bear-off */
  to: number;
  dieValue: number;
}

export type GameAction =
  | {
      type: "PLAYERS_READY";
      white: PlayerInfo;
      black: PlayerInfo;
    }
  | { type: "DICE_ROLLED"; values: [number, number] }
  | { type: "DPAD_NAVIGATE"; direction: "left" | "right" }
  | { type: "DIE_SELECTED"; value: number }
  | { type: "CONFIRM_MOVE" }
  | { type: "PASS_TURN" };
