"use client";

import { useCallback, useEffect, useRef } from "react";
import type { TooManyDiceRoom, TmdPlayer } from "too-many-dice";
import { DpadForm, PickerForm } from "too-many-dice";
import type { CallbackFormHandle } from "too-many-dice";

import { useRoom } from "@/hooks/useRoom";
import { useBackgammonGame } from "@/hooks/useBackgammonGame";
import type { GameState, PlayerColor } from "@/engine/backgammon";
import { getMovesFromSource } from "@/engine/backgammon";

import { RoomLobby } from "@/components/room/RoomLobby";
import { BackgammonBoard } from "./BackgammonBoard";
import { DiceDisplay } from "./DiceDisplay";
import { GameStatus } from "./GameStatus";

const DICE_CONFIG = [{ type: "d6" as const }, { type: "d6" as const }];
const PLAYER_LIMIT = 2;

export function BackgammonGame() {
  const { state, dispatch, stateRef } = useBackgammonGame();
  const gameLoopRunning = useRef(false);
  const roomRef = useRef<TooManyDiceRoom | null>(null);

  const onPlayersReady = useCallback(
    (players: TmdPlayer[]) => {
      dispatch({
        type: "PLAYERS_READY",
        white: { playerId: players[0].playerId, name: players[0].name },
        black: { playerId: players[1].playerId, name: players[1].name },
      });
    },
    [dispatch]
  );

  const { room, roomCode, players, phase: roomPhase, error } = useRoom({
    playerLimit: PLAYER_LIMIT,
    diceConfig: DICE_CONFIG,
    onPlayersReady,
  });

  // Store room ref for async access
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // Get TmdPlayer for a color
  const getTmdPlayer = useCallback(
    (color: PlayerColor): TmdPlayer | null => {
      const info = stateRef.current.players[color];
      if (!info || !room) return null;
      return room.players.find((p) => p.playerId === info.playerId) ?? null;
    },
    [room, stateRef]
  );

  // Send a callback form for one sub-move and wait for confirm
  const sendMoveForm = useCallback(
    (
      r: TooManyDiceRoom,
      player: TmdPlayer,
      st: GameState
    ): Promise<void> => {
      return new Promise<void>((resolve) => {
        const remaining = st.dice!.remaining;
        const uniqueRemaining = [...new Set(remaining)];
        const needsPicker = uniqueRemaining.length > 1;

        const fields: Array<{
          field: DpadForm | PickerForm;
          onChange: (value: unknown) => void;
        }> = [
          {
            field: new DpadForm("navigate", "Select point", {
              up: { visibility: "hidden" },
              down: { visibility: "hidden" },
              left: { visibility: "enabled" },
              right: { visibility: "enabled" },
            }),
            onChange: (value) => {
              dispatch({
                type: "DPAD_NAVIGATE",
                direction: value as "left" | "right",
              });
            },
          },
        ];

        if (needsPicker) {
          fields.push({
            field: new PickerForm(
              "die",
              "Use die",
              uniqueRemaining.map(String)
            ),
            onChange: (value) => {
              dispatch({ type: "DIE_SELECTED", value: Number(value) });
            },
          });
        }

        let handle: CallbackFormHandle | null = null;

        r.sendCallbackForm({
          targetPlayer: player,
          fields,
          buttons: [
            {
              label: "Confirm",
              onClick: () => {
                dispatch({ type: "CONFIRM_MOVE" });
                handle?.clear();
                resolve();
              },
            },
          ],
        }).then((h) => {
          handle = h;
        });
      });
    },
    [dispatch]
  );

  // Main game loop
  const runGameLoop = useCallback(async () => {
    if (gameLoopRunning.current) return;
    gameLoopRunning.current = true;

    try {
      while (true) {
        const r = roomRef.current;
        if (!r) break;

        const st = stateRef.current;

        if (st.phase === "game_over") break;

        if (st.phase === "rolling") {
          const player = getTmdPlayer(st.currentPlayer);
          if (!player) break;

          const results = await r.waitForRoll(player);
          const values: [number, number] = [
            results[0].value,
            results[1].value,
          ];
          dispatch({ type: "DICE_ROLLED", values });

          // Small delay to let state settle
          await new Promise((res) => setTimeout(res, 100));
          continue;
        }

        if (st.phase === "selecting_move") {
          const player = getTmdPlayer(st.currentPlayer);
          if (!player) break;

          // Wait for the player to make a move via callback form
          await sendMoveForm(r, player, stateRef.current);

          // After confirm, check if we need more moves
          await new Promise((res) => setTimeout(res, 100));
          const afterState = stateRef.current;

          if (
            afterState.phase === "selecting_move" &&
            afterState.validSourcePoints.length > 0
          ) {
            // More sub-moves to make, loop continues
            continue;
          }

          if (
            afterState.phase === "turn_complete" ||
            (afterState.phase === "selecting_move" &&
              afterState.validSourcePoints.length === 0)
          ) {
            dispatch({ type: "PASS_TURN" });
            await new Promise((res) => setTimeout(res, 300));
            continue;
          }

          continue;
        }

        if (st.phase === "turn_complete") {
          dispatch({ type: "PASS_TURN" });
          await new Promise((res) => setTimeout(res, 300));
          continue;
        }

        // waiting_for_players — wait and retry
        await new Promise((res) => setTimeout(res, 500));
      }
    } finally {
      gameLoopRunning.current = false;
    }
  }, [dispatch, getTmdPlayer, sendMoveForm, stateRef]);

  // Start game loop when players are ready
  useEffect(() => {
    if (state.phase !== "waiting_for_players" && !gameLoopRunning.current) {
      runGameLoop();
    }
  }, [state.phase, runGameLoop]);

  // Compute highlighted point
  const highlightedPoint =
    state.phase === "selecting_move" && state.validSourcePoints.length > 0
      ? state.validSourcePoints[state.selectedPointIndex] ?? null
      : null;

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  // Lobby state
  if (roomPhase === "creating" || roomPhase === "lobby") {
    if (!roomCode) {
      return (
        <div className="flex flex-col items-center py-16">
          <p className="animate-pulse">Creating room...</p>
        </div>
      );
    }
    return (
      <RoomLobby
        roomCode={roomCode}
        players={players}
        playerLimit={PLAYER_LIMIT}
      />
    );
  }

  // Game state
  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      <GameStatus state={state} />
      <DiceDisplay dice={state.dice} />
      <BackgammonBoard
        board={state.board}
        highlightedPoint={highlightedPoint}
        validSourcePoints={state.validSourcePoints}
      />

      {/* Borne off summary */}
      <div className="flex gap-8 text-sm">
        <span>
          {state.players.white?.name ?? "White"}: {state.board.borneOff.white}/15 off
        </span>
        <span>
          {state.players.black?.name ?? "Black"}: {state.board.borneOff.black}/15 off
        </span>
      </div>
    </div>
  );
}
