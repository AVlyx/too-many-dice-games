import type { GameState, GameAction, PlayerColor, DiceState } from "./types";
import { createInitialBoard } from "./constants";
import {
  getValidSourcePoints,
  getMovesFromSource,
  applyMove,
  consumeDie,
  hasWon,
  getMaxDiceConstraint,
} from "./moves";

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: "white",
    phase: "waiting_for_players",
    dice: null,
    selectedPointIndex: 0,
    validSourcePoints: [],
    selectedDieValue: null,
    movesMadeThisTurn: [],
    winner: null,
    players: { white: null, black: null },
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLAYERS_READY":
      return {
        ...state,
        players: { white: action.white, black: action.black },
        phase: "rolling",
      };

    case "DICE_ROLLED": {
      const [d1, d2] = action.values;
      const isDoubles = d1 === d2;
      const remaining = isDoubles ? [d1, d1, d1, d1] : [d1, d2];

      // Check max-dice constraint for non-doubles
      const constraint = !isDoubles
        ? getMaxDiceConstraint(state.board, state.currentPlayer, remaining)
        : null;
      const effectiveRemaining = constraint ?? remaining;

      const validSources = getValidSourcePoints(
        state.board,
        state.currentPlayer,
        effectiveRemaining
      );

      if (validSources.length === 0) {
        // No valid moves — turn passes
        return {
          ...state,
          dice: { values: action.values, remaining: effectiveRemaining },
          validSourcePoints: [],
          selectedPointIndex: 0,
          selectedDieValue: null,
          movesMadeThisTurn: [],
          phase: "turn_complete",
        };
      }

      return {
        ...state,
        dice: { values: action.values, remaining: effectiveRemaining },
        validSourcePoints: validSources,
        selectedPointIndex: 0,
        selectedDieValue: null,
        movesMadeThisTurn: [],
        phase: "selecting_move",
      };
    }

    case "DPAD_NAVIGATE": {
      if (state.validSourcePoints.length === 0) return state;
      const len = state.validSourcePoints.length;
      let idx = state.selectedPointIndex;
      if (action.direction === "right") {
        idx = (idx + 1) % len;
      } else {
        idx = (idx - 1 + len) % len;
      }
      return {
        ...state,
        selectedPointIndex: idx,
        selectedDieValue: null, // reset die selection on navigation
      };
    }

    case "DIE_SELECTED":
      return {
        ...state,
        selectedDieValue: action.value,
      };

    case "CONFIRM_MOVE": {
      if (!state.dice || state.validSourcePoints.length === 0) return state;

      const from = state.validSourcePoints[state.selectedPointIndex];
      const remaining = state.dice.remaining;
      const uniqueRemaining = [...new Set(remaining)];

      // Determine which die value to use
      let dieValue: number;
      if (state.selectedDieValue !== null && remaining.includes(state.selectedDieValue)) {
        dieValue = state.selectedDieValue;
      } else if (uniqueRemaining.length === 1) {
        dieValue = uniqueRemaining[0];
      } else {
        // No die selected and multiple values — shouldn't happen
        // Default to first available
        dieValue = uniqueRemaining[0];
      }

      // Find matching move
      const possibleMoves = getMovesFromSource(
        state.board,
        state.currentPlayer,
        from,
        [dieValue]
      );
      if (possibleMoves.length === 0) return state;

      const move = possibleMoves[0];
      const newBoard = applyMove(state.board, move, state.currentPlayer);
      const newRemaining = consumeDie(remaining, dieValue);

      // Check for win
      if (hasWon(newBoard, state.currentPlayer)) {
        return {
          ...state,
          board: newBoard,
          dice: { ...state.dice, remaining: newRemaining },
          movesMadeThisTurn: [...state.movesMadeThisTurn, move],
          winner: state.currentPlayer,
          phase: "game_over",
          validSourcePoints: [],
          selectedPointIndex: 0,
          selectedDieValue: null,
        };
      }

      // More dice to use?
      if (newRemaining.length === 0) {
        return {
          ...state,
          board: newBoard,
          dice: { ...state.dice, remaining: newRemaining },
          movesMadeThisTurn: [...state.movesMadeThisTurn, move],
          phase: "turn_complete",
          validSourcePoints: [],
          selectedPointIndex: 0,
          selectedDieValue: null,
        };
      }

      // Check for more valid moves with remaining dice
      const newValidSources = getValidSourcePoints(
        newBoard,
        state.currentPlayer,
        newRemaining
      );

      if (newValidSources.length === 0) {
        // No more valid moves
        return {
          ...state,
          board: newBoard,
          dice: { ...state.dice, remaining: newRemaining },
          movesMadeThisTurn: [...state.movesMadeThisTurn, move],
          phase: "turn_complete",
          validSourcePoints: [],
          selectedPointIndex: 0,
          selectedDieValue: null,
        };
      }

      return {
        ...state,
        board: newBoard,
        dice: { ...state.dice, remaining: newRemaining },
        movesMadeThisTurn: [...state.movesMadeThisTurn, move],
        validSourcePoints: newValidSources,
        selectedPointIndex: 0,
        selectedDieValue: null,
      };
    }

    case "PASS_TURN": {
      const nextPlayer: PlayerColor =
        state.currentPlayer === "white" ? "black" : "white";
      return {
        ...state,
        currentPlayer: nextPlayer,
        phase: "rolling",
        dice: null,
        selectedPointIndex: 0,
        validSourcePoints: [],
        selectedDieValue: null,
        movesMadeThisTurn: [],
      };
    }

    default:
      return state;
  }
}
