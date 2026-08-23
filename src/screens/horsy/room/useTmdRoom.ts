import { useEffect, useState } from "react";
import { TooManyDiceRoom, type TmdPlayer } from "too-many-dice";

/**
 * Leave the host undefined so the SDK falls back to its built-in production
 * host. The "myapp.partykit.dev" in the docs is a placeholder, not a real host.
 */
const TMD_HOST: string | undefined = undefined;

export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;

export type RoomStatus = "connecting" | "ready" | "error";

export interface TmdRoomState {
  room: TooManyDiceRoom | null;
  players: TmdPlayer[];
  status: RoomStatus;
  error: string | null;
}

/**
 * Creates a Too Many Dice room for this page and keeps its player list in sync.
 * Safe under React StrictMode's double mount: the room created by the discarded
 * first pass is destroyed whether it resolves before or after the cleanup runs.
 */
export function useTmdRoom(): TmdRoomState {
  const [room, setRoom] = useState<TooManyDiceRoom | null>(null);
  const [players, setPlayers] = useState<TmdPlayer[]>([]);
  const [status, setStatus] = useState<RoomStatus>("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: TooManyDiceRoom | null = null;

    TooManyDiceRoom.create(TMD_HOST, {
      playerLimit: MAX_PLAYERS,
      diceConfig: [{ id: "d6", type: "d6" }],
      callbacks: {
        onPlayerJoined: (player) =>
          setPlayers((current) =>
            current.some((p) => p.playerId === player.playerId) ? current : [...current, player],
          ),
        onPlayerLeft: (player) =>
          setPlayers((current) => current.filter((p) => p.playerId !== player.playerId)),
      },
    })
      .then((instance) => {
        created = instance;
        if (cancelled) {
          void instance.destroy();
          return;
        }
        setRoom(instance);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      });

    return () => {
      cancelled = true;
      void created?.destroy();
    };
  }, []);

  return { room, players, status, error };
}
