import { Link, useNavigate } from "react-router";
import PetitsChevauxBoard, {
  ORDER,
  type Piece,
  type PlayerColor,
} from "./game/PetitsChevauxBoard";
import { MAX_PLAYERS, MIN_PLAYERS } from "./room/useTmdRoom";
import "./horsy.css";

const SWATCH: Record<PlayerColor, string> = {
  red: "oklch(0.55 0.16 25)",
  blue: "oklch(0.52 0.12 255)",
  yellow: "oklch(0.72 0.13 85)",
  green: "oklch(0.5 0.12 150)",
};

/** A mid-game position: a horse in the stable, on the track, on the ladder and home. */
const demoPieces: Piece[] = [
  { id: "red-1", color: "red", loc: "home", i: 0 },
  { id: "red-2", color: "red", loc: "ladder", i: 3 },
  { id: "red-3", color: "red", loc: "track", i: 2 },
  { id: "red-4", color: "red", loc: "stable", i: 3 },
  { id: "blue-1", color: "blue", loc: "ladder", i: 0 },
  { id: "blue-2", color: "blue", loc: "track", i: 17 },
  { id: "blue-3", color: "blue", loc: "track", i: 30 },
  { id: "blue-4", color: "blue", loc: "stable", i: 1 },
  { id: "yellow-1", color: "yellow", loc: "track", i: 44 },
  { id: "yellow-2", color: "yellow", loc: "track", i: 36 },
  { id: "yellow-3", color: "yellow", loc: "stable", i: 0 },
  { id: "yellow-4", color: "yellow", loc: "stable", i: 2 },
  { id: "green-1", color: "green", loc: "track", i: 8 },
  { id: "green-2", color: "green", loc: "stable", i: 1 },
  { id: "green-3", color: "green", loc: "stable", i: 2 },
  { id: "green-4", color: "green", loc: "stable", i: 3 },
];

function HorsyMain() {
  const navigate = useNavigate();

  return (
    <div className="horsy">
      <Link className="horsy-back" to="/">
        ← All games
      </Link>

      <h1>Le jeu des petits chevaux</h1>
      <p className="horsy-lede">
        The French classic: four horses per stable, one d6, and a long lap around the board before
        you may climb your own staircase to the centre. {MIN_PLAYERS}–{MAX_PLAYERS} players, played
        on this screen with the dice rolled from everyone's phone.
      </p>

      <div className="horsy-split">
        <div className="horsy-rules">
          <h2>The goal</h2>
          <p>Be the first to bring all four of your horses home to the centre case.</p>

          <h2>Leaving the stable</h2>
          <ul>
            <li>
              Every horse starts in its stable. You need to roll a <strong>6</strong> to bring one
              out — it goes onto your departure case, the one outlined in your colour.
            </li>
            <li>
              Roll anything else while all four are stabled and your turn is simply skipped.
            </li>
          </ul>

          <h2>Moving</h2>
          <ul>
            <li>
              Move one horse clockwise by the number rolled. A full lap of the track is 55 steps.
            </li>
            <li>
              Landing exactly on an opponent's horse <strong>sends it back to its stable</strong>.
            </li>
            <li>
              Your own horse blocks a case: you may not land on it. You may still jump over any
              horse on the way.
            </li>
          </ul>

          <h2>The staircase</h2>
          <ul>
            <li>
              After a full lap you reach the dashed case in your colour and climb your own
              six-case staircase — nobody else can enter it.
            </li>
            <li>
              The centre must be reached with an <strong>exact roll</strong>. Too high a number and
              the horse cannot move at all.
            </li>
          </ul>

          <h2>Rolling a 6</h2>
          <p>
            A 6 lets you play a move and then <strong>roll again</strong>. It is the only way out of
            the stable, so it is always worth having a horse waiting.
          </p>

          <h2>Playing with the Too Many Dice app</h2>
          <ul>
            <li>Create a room below — the next screen shows a QR code to scan.</li>
            <li>Each player joins from the app; the board lives on this screen.</li>
            <li>
              On your turn, roll the dice on your phone. A form then lets you pick which horse to
              move — your choice lights up on the board as you scroll through it.
            </li>
            <li>Tap <strong>Submit</strong> and the move is played, then it is the next player's turn.</li>
          </ul>

          <button className="horsy-cta" onClick={() => void navigate("/horsy/room")}>
            Create a room
          </button>
        </div>

        <div className="horsy-example">
          <PetitsChevauxBoard pieces={demoPieces} cell={30} />
          <p className="horsy-caption">
            A game in progress. Red has one horse home, one on the staircase, one on the track and
            one still stabled.
          </p>
          <div className="horsy-legend">
            {ORDER.map((color) => (
              <span key={color}>
                <i className="horsy-dot" style={{ background: SWATCH[color] }} />
                {color[0].toUpperCase() + color.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HorsyMain;
