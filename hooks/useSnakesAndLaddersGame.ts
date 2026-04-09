"use client";

import { useReducer, useRef, useCallback } from "react";
import {
  gameReducer,
  createInitialGameState,
  type GameState,
  type GameAction,
} from "@/engine/snakes-and-ladders";

export function useSnakesAndLaddersGame() {
  const [state, rawDispatch] = useReducer(
    gameReducer,
    undefined,
    createInitialGameState
  );
  const stateRef = useRef<GameState>(state);

  const dispatch = useCallback((action: GameAction) => {
    rawDispatch(action);
    stateRef.current = gameReducer(stateRef.current, action);
  }, []);

  return { state, dispatch, stateRef };
}
