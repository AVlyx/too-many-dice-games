"use client";

import { useReducer, useRef, useCallback } from "react";
import {
  gameReducer,
  createInitialGameState,
  type GameState,
  type GameAction,
} from "@/engine/backgammon";

export function useBackgammonGame() {
  const [state, rawDispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const stateRef = useRef<GameState>(state);

  const dispatch = useCallback((action: GameAction) => {
    rawDispatch(action);
    // We need stateRef to be updated synchronously for async callbacks.
    // Since React batches state updates, we compute the next state ourselves.
    stateRef.current = gameReducer(stateRef.current, action);
  }, []);

  return { state, dispatch, stateRef };
}
