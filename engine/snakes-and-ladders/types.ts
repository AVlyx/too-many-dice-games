export interface PlayerInfo {
  playerId: string;
  name: string;
}

export type TurnPhase = "waiting_for_players" | "rolling" | "game_over";

export interface SnakeOrLadderEvent {
  type: "snake" | "ladder";
  from: number;
  to: number;
}

export interface GameState {
  /** Square position for each playerId (0 = off board, 1–100 on board) */
  positions: Record<string, number>;
  /** Player IDs in turn order */
  playerOrder: string[];
  currentPlayerIndex: number;
  phase: TurnPhase;
  winner: PlayerInfo | null;
  players: PlayerInfo[];
  lastRoll: number | null;
  lastEvent: SnakeOrLadderEvent | null;
}

export type GameAction =
  | { type: "PLAYERS_READY"; players: PlayerInfo[] }
  | { type: "DICE_ROLLED"; value: number };
