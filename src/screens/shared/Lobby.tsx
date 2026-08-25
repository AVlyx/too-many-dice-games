import { QRCodeSVG } from "qrcode.react";
import type { TmdPlayer, TooManyDiceRoom } from "too-many-dice";

/** How to present the seat taken by the n-th player to join. */
export interface SeatLabel {
  label: string;
  color: string;
}

interface LobbyProps {
  room: TooManyDiceRoom;
  players: TmdPlayer[];
  title: string;
  minPlayers: number;
  maxPlayers: number;
  seat: (index: number) => SeatLabel;
  onStart: () => void;
  starting: boolean;
}

/** The waiting room: QR code, room code, players connected so far. */
function Lobby({
  room,
  players,
  title,
  minPlayers,
  maxPlayers,
  seat,
  onStart,
  starting,
}: LobbyProps) {
  const enough = players.length >= minPlayers;

  return (
    <div className="tmd-lobby">
      <h1>{title}</h1>
      <p className="tmd-lede" style={{ textAlign: "center" }}>
        Scan the code with the Too Many Dice app, or type the room code into it.
      </p>

      <div className="tmd-qr">
        <QRCodeSVG value={room.qrCodeUrl} size={200} />
      </div>

      <div>
        <p className="tmd-code-label">Room code</p>
        <p className="tmd-code">{room.roomCode}</p>
      </div>

      <div>
        <p className="tmd-code-label">
          Players {players.length}/{maxPlayers}
        </p>
        {players.length === 0 ? (
          <p className="tmd-waiting">Waiting for players…</p>
        ) : (
          <ul className="tmd-players">
            {players.map((player, index) => (
              <li className="tmd-player" key={player.playerId}>
                <i className="tmd-dot" style={{ background: seat(index).color }} />
                <span className="tmd-player-name">{player.name}</span>
                <span className="tmd-player-meta">{seat(index).label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="tmd-cta" onClick={onStart} disabled={!enough || starting}>
        {starting ? "Starting…" : "Start game"}
      </button>
      {!enough && <p className="tmd-hint">At least {minPlayers} players are needed.</p>}
    </div>
  );
}

export default Lobby;
