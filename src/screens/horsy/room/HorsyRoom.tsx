import { useState } from "react";
import { Link } from "react-router";
import { ORDER } from "../game/PetitsChevauxBoard";
import GameView, { type Seat } from "./GameView";
import Lobby from "./Lobby";
import { useTmdRoom } from "./useTmdRoom";
import "../horsy.css";

function HorsyRoom() {
  const { room, players, status, error } = useTmdRoom();
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  // Frozen at kick-off: GameView's turn loop keys off this array's identity.
  const [seats, setSeats] = useState<Seat[]>([]);

  const start = () => {
    if (!room) return;
    setStarting(true);
    // Lock the room, then freeze the seating: join order decides the colours.
    void room
      .closeAccess()
      .catch(() => undefined)
      .then(() => {
        setSeats(players.slice(0, ORDER.length).map((player, i) => ({ player, color: ORDER[i] })));
        setStarted(true);
        setStarting(false);
      });
  };

  return (
    <div className="horsy">
      <Link className="horsy-back" to="/horsy">
        ← Rules
      </Link>

      {status === "error" && (
        <div className="horsy-lobby">
          <h1>Could not open a room</h1>
          <p className="horsy-error">{error}</p>
        </div>
      )}

      {status === "connecting" && (
        <div className="horsy-lobby">
          <h1>Opening a room…</h1>
          <p className="horsy-waiting">Connecting to Too Many Dice.</p>
        </div>
      )}

      {room && !started && (
        <Lobby room={room} players={players} onStart={start} starting={starting} />
      )}

      {room && started && <GameView room={room} seats={seats} />}
    </div>
  );
}

export default HorsyRoom;
