import type { GameState, GameAction } from "./types";
import { BOARD_SIZE, SNAKES, LADDERS } from "./constants";

export function createInitialGameState(): GameState {
  return {
    positions: {},
    playerOrder: [],
    currentPlayerIndex: 0,
    phase: "waiting_for_players",
    winner: null,
    players: [],
    lastRoll: null,
    lastEvent: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLAYERS_READY": {
      const positions: Record<string, number> = {};
      const playerOrder: string[] = [];
      for (const p of action.players) {
        positions[p.playerId] = 0;
        playerOrder.push(p.playerId);
      }
      return {
        ...state,
        players: action.players,
        positions,
        playerOrder,
        currentPlayerIndex: 0,
        phase: "rolling",
      };
    }

    case "DICE_ROLLED": {
      const playerId = state.playerOrder[state.currentPlayerIndex];
      const currentPos = state.positions[playerId];
      const newPos = currentPos + action.value;

      // Exceeds 100 — don't move
      if (newPos > BOARD_SIZE) {
        const nextIndex =
          (state.currentPlayerIndex + 1) % state.playerOrder.length;
        return {
          ...state,
          lastRoll: action.value,
          lastEvent: null,
          currentPlayerIndex: nextIndex,
        };
      }

      // Check for snakes or ladders
      let finalPos = newPos;
      let event: GameState["lastEvent"] = null;

      if (SNAKES[newPos] !== undefined) {
        finalPos = SNAKES[newPos];
        event = { type: "snake", from: newPos, to: finalPos };
      } else if (LADDERS[newPos] !== undefined) {
        finalPos = LADDERS[newPos];
        event = { type: "ladder", from: newPos, to: finalPos };
      }

      const newPositions = { ...state.positions, [playerId]: finalPos };

      // Check for win
      if (finalPos === BOARD_SIZE) {
        const winner = state.players.find((p) => p.playerId === playerId)!;
        return {
          ...state,
          positions: newPositions,
          lastRoll: action.value,
          lastEvent: event,
          winner,
          phase: "game_over",
        };
      }

      const nextIndex =
        (state.currentPlayerIndex + 1) % state.playerOrder.length;
      return {
        ...state,
        positions: newPositions,
        lastRoll: action.value,
        lastEvent: event,
        currentPlayerIndex: nextIndex,
      };
    }

    default:
      return state;
  }
}
