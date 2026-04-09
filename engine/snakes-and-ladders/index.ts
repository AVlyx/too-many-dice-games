export type {
  PlayerInfo,
  TurnPhase,
  SnakeOrLadderEvent,
  GameState,
  GameAction,
} from "./types";

export {
  BOARD_SIZE,
  PLAYER_LIMIT,
  SNAKES,
  LADDERS,
  PLAYER_COLORS,
} from "./constants";

export { gameReducer, createInitialGameState } from "./rules";
