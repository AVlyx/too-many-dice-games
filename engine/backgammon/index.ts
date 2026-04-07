export type {
  PlayerColor,
  PointState,
  BoardState,
  TurnPhase,
  DiceState,
  PlayerInfo,
  GameState,
  Move,
  GameAction,
} from "./types";

export { createInitialBoard, POINTS_COUNT, CHECKERS_PER_PLAYER } from "./constants";

export {
  getValidMoves,
  getValidSourcePoints,
  getMovesFromSource,
  applyMove,
  consumeDie,
  hasWon,
  canBearOff,
  getMaxDiceConstraint,
} from "./moves";

export { gameReducer, createInitialGameState } from "./rules";
