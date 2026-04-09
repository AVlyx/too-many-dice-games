"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TooManyDiceRoom } from "too-many-dice";
import type { TmdPlayer, DiceConfig } from "too-many-dice";
import { TMD_HOST } from "@/lib/tmd";

export type RoomPhase = "creating" | "lobby" | "ready" | "error";

interface UseRoomOptions {
  playerLimit: number;
  diceConfig: DiceConfig[];
  onPlayersReady?: (players: TmdPlayer[]) => void;
}

export function useRoom(options: UseRoomOptions) {
  const [room, setRoom] = useState<TooManyDiceRoom | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<TmdPlayer[]>([]);
  const [phase, setPhase] = useState<RoomPhase>("creating");
  const [error, setError] = useState<string | null>(null);
  const readyFired = useRef(false);
  const onPlayersReadyRef = useRef(options.onPlayersReady);
  onPlayersReadyRef.current = options.onPlayersReady;

  const createRoom = useCallback(async () => {
    try {
      const r = await TooManyDiceRoom.create(TMD_HOST, {
        playerLimit: options.playerLimit,
        diceConfig: options.diceConfig,
        callbacks: {
          onPlayerJoined: (player) => {
            setPlayers((prev) => {
              const next = [...prev, player];
              if (
                next.length >= options.playerLimit &&
                !readyFired.current
              ) {
                readyFired.current = true;
                setPhase("ready");
                r.closeAccess();
                onPlayersReadyRef.current?.(next);
              }
              return next;
            });
          },
          onPlayerLeft: (player) => {
            setPlayers((prev) =>
              prev.filter((p) => p.playerId !== player.playerId)
            );
          },
        },
      });
      setRoom(r);
      setRoomCode(r.roomCode);
      setPhase("lobby");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create room");
      setPhase("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    createRoom();
    return () => {
      // cleanup handled by caller or BackgammonGame
    };
  }, [createRoom]);

  const startEarly = useCallback(() => {
    if (readyFired.current || players.length < 1 || !room) return;
    readyFired.current = true;
    setPhase("ready");
    room.closeAccess();
    onPlayersReadyRef.current?.(players);
  }, [room, players]);

  return { room, roomCode, players, phase, error, startEarly };
}
