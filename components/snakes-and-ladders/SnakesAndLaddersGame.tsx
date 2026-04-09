"use client";

import { useCallback, useEffect, useRef } from "react";
import type { TooManyDiceRoom, TmdPlayer } from "too-many-dice";

import { useRoom } from "@/hooks/useRoom";
import { useSnakesAndLaddersGame } from "@/hooks/useSnakesAndLaddersGame";
import { PLAYER_LIMIT } from "@/engine/snakes-and-ladders";
import type { PlayerInfo } from "@/engine/snakes-and-ladders";

import { RoomLobby } from "@/components/room/RoomLobby";
import { SnakesAndLaddersBoard } from "./SnakesAndLaddersBoard";
import { GameStatus } from "./GameStatus";
import { PlayerList } from "./PlayerList";

const DICE_CONFIG = [{ type: "d6" as const }];

export function SnakesAndLaddersGame() {
  const { state, dispatch, stateRef } = useSnakesAndLaddersGame();
  const gameLoopRunning = useRef(false);
  const roomRef = useRef<TooManyDiceRoom | null>(null);

  const onPlayersReady = useCallback(
    (players: TmdPlayer[]) => {
      const playerInfos: PlayerInfo[] = players.map((p) => ({
        playerId: p.playerId,
        name: p.name,
      }));
      dispatch({ type: "PLAYERS_READY", players: playerInfos });
    },
    [dispatch]
  );

  const {
    room,
    roomCode,
    players,
    phase: roomPhase,
    error,
    startEarly,
  } = useRoom({
    playerLimit: PLAYER_LIMIT,
    diceConfig: DICE_CONFIG,
    onPlayersReady,
  });

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

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
          const playerId = st.playerOrder[st.currentPlayerIndex];
          const tmdPlayer = r.players.find((p) => p.playerId === playerId);
          if (!tmdPlayer) break;

          const results = await r.waitForRoll(tmdPlayer);
          const value = results[0].value;
          dispatch({ type: "DICE_ROLLED", value });

          // Brief pause so UI can show the roll result
          await new Promise((res) => setTimeout(res, 800));
          continue;
        }

        // waiting_for_players — wait and retry
        await new Promise((res) => setTimeout(res, 500));
      }
    } finally {
      gameLoopRunning.current = false;
    }
  }, [dispatch, stateRef]);

  useEffect(() => {
    if (state.phase !== "waiting_for_players" && !gameLoopRunning.current) {
      runGameLoop();
    }
  }, [state.phase, runGameLoop]);

  if (error) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

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
        onStart={startEarly}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      <GameStatus state={state} />
      <SnakesAndLaddersBoard state={state} />
      <PlayerList state={state} />
    </div>
  );
}
