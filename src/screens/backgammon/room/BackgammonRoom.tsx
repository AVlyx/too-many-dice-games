import { useState } from "react";
import { Link } from "react-router";
import { PLAYER_NAME, PLAYER_SWATCH } from "../game/theme";
import { MAX_PLAYERS, MIN_PLAYERS } from "../game/config";
import { PLAYERS } from "../game/rules";
import GameView, { type Seat } from "./GameView";
import Lobby from "../../shared/Lobby";
import { useTmdRoom } from "../../shared/useTmdRoom";
import "../../shared/game.css";

function BackgammonRoom() {
  const { room, players, status, error } = useTmdRoom(MAX_PLAYERS, ["d6", "d6"]);
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  // Frozen at kick-off: GameView's turn loop keys off this array's identity.
  const [seats, setSeats] = useState<Seat[]>([]);

  const start = () => {
    if (!room) return;
    setStarting(true);
    // Lock the room, then freeze the seating: the first to join takes white.
    void room
      .closeAccess()
      .catch(() => undefined)
      .then(() => {
        setSeats(players.slice(0, PLAYERS.length).map((player, i) => ({ player, side: PLAYERS[i] })));
        setStarted(true);
        setStarting(false);
      });
  };

  return (
    <div className="tmd-page">
      <Link className="tmd-back" to="/backgammon">
        ← Rules
      </Link>

      {status === "error" && (
        <div className="tmd-lobby">
          <h1>Could not open a room</h1>
          <p className="tmd-error">{error}</p>
        </div>
      )}

      {status === "connecting" && (
        <div className="tmd-lobby">
          <h1>Opening a room…</h1>
          <p className="tmd-waiting">Connecting to Too Many Dice.</p>
        </div>
      )}

      {room && !started && (
        <Lobby
          room={room}
          players={players}
          title="Take your seat"
          minPlayers={MIN_PLAYERS}
          maxPlayers={MAX_PLAYERS}
          seat={(index) => ({
            label: PLAYER_NAME[PLAYERS[index]].toLowerCase(),
            color: PLAYER_SWATCH[PLAYERS[index]],
          })}
          onStart={start}
          starting={starting}
        />
      )}

      {room && started && <GameView room={room} seats={seats} />}
    </div>
  );
}

export default BackgammonRoom;
