import { applyMove, initialState, legalMovesForDie, PLAYERS } from "./rules";

/**
 * An illustrative position: White has opened 6-5 (the "lover's leap") and Black
 * has answered 3-1, making its 20 point. Used for the board shown on the game
 * page and for the thumbnail on the home page.
 */
export const demoState = (() => {
  let state = initialState();
  const play = (side: (typeof PLAYERS)[number], die: number, from: number) => {
    const move = legalMovesForDie(state, side, die).find((m) => m.from === from);
    if (move) state = applyMove(state, move);
  };
  play("white", 6, 23);
  play("white", 5, 17);
  play("black", 3, 16);
  play("black", 1, 18);
  return state;
})();
