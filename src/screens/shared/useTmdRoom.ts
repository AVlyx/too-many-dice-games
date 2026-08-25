import { useEffect, useState } from "react";
import { TooManyDiceRoom, type DieType, type TmdPlayer } from "too-many-dice";

/**
 * Leave the host undefined so the SDK falls back to its built-in production
 * host. The "myapp.partykit.dev" in the docs is a placeholder, not a real host.
 */
const TMD_HOST: string | undefined = undefined;

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
 *
 * `dice` is depended on by value, not identity, so callers may pass a literal.
 */
export function useTmdRoom(playerLimit: number, dice: DieType[]): TmdRoomState {
  const [room, setRoom] = useState<TooManyDiceRoom | null>(null);
  const [players, setPlayers] = useState<TmdPlayer[]>([]);
  const [status, setStatus] = useState<RoomStatus>("connecting");
  const [error, setError] = useState<string | null>(null);

  const diceKey = dice.join(",");

  useEffect(() => {
    let cancelled = false;
    let created: TooManyDiceRoom | null = null;

    TooManyDiceRoom.create(TMD_HOST, {
      playerLimit,
      diceConfig: diceKey.split(",").map((type, i) => ({ id: `d${i + 1}`, type: type as DieType })),
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
  }, [playerLimit, diceKey]);

  return { room, players, status, error };
}
