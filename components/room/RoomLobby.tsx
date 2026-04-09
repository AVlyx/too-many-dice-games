"use client";

import type { TmdPlayer } from "too-many-dice";
import { QRCode } from "./QRCode";

interface RoomLobbyProps {
  roomCode: string;
  players: TmdPlayer[];
  playerLimit: number;
  onStart?: () => void;
}

export function RoomLobby({ roomCode, players, playerLimit, onStart }: RoomLobbyProps) {
  return (
    <div className="flex flex-col items-center gap-8 py-16">
      <h2 className="text-2xl font-semibold">Join the Game</h2>

      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-neutral-500">
          Scan the QR code or enter the room code in the Too Many Dice app
        </p>
        <QRCode roomCode={roomCode} />
        <div className="text-center">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
            Room Code
          </p>
          <p className="text-4xl font-mono font-bold tracking-widest">
            {roomCode}
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-neutral-500 mb-3">
          Players ({players.length}/{playerLimit})
        </p>
        {players.length === 0 ? (
          <p className="text-neutral-400 animate-pulse">
            Waiting for players...
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {players.map((p) => (
              <li key={p.playerId} className="text-lg font-medium">
                {p.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {onStart && players.length >= 1 && (
        <button
          onClick={onStart}
          className="px-6 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg font-semibold"
        >
          Start Game
        </button>
      )}
    </div>
  );
}
