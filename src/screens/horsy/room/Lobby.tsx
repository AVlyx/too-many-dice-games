import { QRCodeSVG } from "qrcode.react";
import type { TmdPlayer, TooManyDiceRoom } from "too-many-dice";
import { ORDER, type PlayerColor } from "../game/PetitsChevauxBoard";
import { MAX_PLAYERS, MIN_PLAYERS } from "./useTmdRoom";

const SWATCH: Record<PlayerColor, string> = {
  red: "oklch(0.55 0.16 25)",
  blue: "oklch(0.52 0.12 255)",
  yellow: "oklch(0.72 0.13 85)",
  green: "oklch(0.5 0.12 150)",
};

interface LobbyProps {
  room: TooManyDiceRoom;
  players: TmdPlayer[];
  onStart: () => void;
  starting: boolean;
}

function Lobby({ room, players, onStart, starting }: LobbyProps) {
  const enough = players.length >= MIN_PLAYERS;

  return (
    <div className="horsy-lobby">
      <h1>Join the stable</h1>
      <p className="horsy-lede" style={{ textAlign: "center" }}>
        Scan the code with the Too Many Dice app, or type the room code into it.
      </p>

      <div className="horsy-qr">
        <QRCodeSVG value={room.qrCodeUrl} size={200} />
      </div>

      <div>
        <p className="horsy-code-label">Room code</p>
        <p className="horsy-code">{room.roomCode}</p>
      </div>

      <div>
        <p className="horsy-code-label">
          Players {players.length}/{MAX_PLAYERS}
        </p>
        {players.length === 0 ? (
          <p className="horsy-waiting">Waiting for players…</p>
        ) : (
          <ul className="horsy-players">
            {players.map((player, index) => (
              <li className="horsy-player" key={player.playerId}>
                <i className="horsy-dot" style={{ background: SWATCH[ORDER[index]] }} />
                <span className="horsy-player-name">{player.name}</span>
                <span className="horsy-player-meta">{ORDER[index]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="horsy-cta" onClick={onStart} disabled={!enough || starting}>
        {starting ? "Starting…" : "Start game"}
      </button>
      {!enough && <p className="horsy-hint">At least {MIN_PLAYERS} players are needed.</p>}
    </div>
  );
}

export default Lobby;
