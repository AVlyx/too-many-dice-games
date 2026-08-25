import { Link, useNavigate } from "react-router";
import BackgammonBoard from "./game/BackgammonBoard";
import { PLAYER_NAME, PLAYER_SWATCH } from "./game/theme";
import { MAX_PLAYERS } from "./game/config";
import { applyMove, initialState, legalMovesForDie, PLAYERS } from "./game/rules";
import "../shared/game.css";

/**
 * An illustrative position: White has opened 6-5 (the "lover's leap") and Black
 * has answered 3-1, making its 20 point.
 */
const demoState = (() => {
  let state = initialState();
  const play = (side: (typeof PLAYERS)[number], die: number, from: number) => {
    const move = legalMovesForDie(state, side, die).find((m) => m.from === from);
    if (move) state = applyMove(state, move);
  };
  play("white", 6, 23);
  play("white", 5, 17);
  play("black", 3, 16);
  play("black", 1, 18);
  return state;
})();

function BackgammonMain() {
  const navigate = useNavigate();

  return (
    <div className="tmd-page">
      <Link className="tmd-back" to="/">
        ← All games
      </Link>

      <h1>Backgammon</h1>
      <p className="tmd-lede">
        The oldest racing game there is: fifteen checkers a side, two d6, and a course that runs the
        opposite way to your opponent&rsquo;s. {MAX_PLAYERS} players, played on this screen with the
        dice rolled from everyone&rsquo;s phone.
      </p>

      <button className="tmd-cta is-top" onClick={() => void navigate("/backgammon/room")}>
        Create a room
      </button>

      <div className="tmd-split">
        <div className="tmd-rules">
          <h2>The goal</h2>
          <p>
            Bring all fifteen of your checkers round into your home board, then bear them all off
            before your opponent does.
          </p>

          <h2>The board</h2>
          <ul>
            <li>
              The 24 points are numbered <strong>1 to 24</strong> on this screen, and both sides
              read the same numbers — no numbering to flip round in your head.
            </li>
            <li>
              <strong>White</strong> runs down from point 24 towards point 1; its home board is
              points 1 to 6, bottom right.
            </li>
            <li>
              <strong>Black</strong> runs up from point 1 towards point 24; its home board is points
              19 to 24, top right.
            </li>
            <li>The middle column is the bar, the channel on the right the bear-off tray.</li>
          </ul>

          <h2>Moving</h2>
          <ul>
            <li>
              Each die is played separately: move two checkers one die each, or one checker both
              dice in turn.
            </li>
            <li>
              A <strong>double</strong> is played four times: four moves of the same value.
            </li>
            <li>
              A point held by <strong>two or more opposing checkers</strong> is closed — you may not
              land there.
            </li>
            <li>
              You must play <strong>as many dice as you can</strong>. If only one of the two is
              playable, it has to be the higher one. The game only ever offers you legal moves.
            </li>
          </ul>

          <h2>Hitting and entering</h2>
          <ul>
            <li>
              A lone checker on a point is a <em>blot</em>. Landing on it is a <strong>hit</strong>:
              the checker goes to the bar.
            </li>
            <li>
              While you have a checker on the bar you may play nothing else — you have to enter it
              in your opponent&rsquo;s home board. A die of <em>d</em> enters on point 25 − <em>d</em>{" "}
              for White, point <em>d</em> for Black.
            </li>
            <li>If neither entry point is open, the turn is skipped.</li>
          </ul>

          <h2>Bearing off</h2>
          <ul>
            <li>
              Once all fifteen checkers are home you start bearing off. A die of <em>d</em> takes off
              the checker sitting on the <em>d</em>-th point of your home board.
            </li>
            <li>
              A die higher than you need only bears off your furthest-back checker. Otherwise you
              have to use it to move inside your home board.
            </li>
            <li>
              Getting hit while bearing off sends that checker back to the bar — the whole lap has
              to be run again.
            </li>
          </ul>

          <h2>Scoring</h2>
          <p>
            An ordinary game is worth 1 point. If the loser has borne off nothing it is a{" "}
            <strong>gammon</strong> (2 points); if on top of that they still have a checker on the
            bar or in the winner&rsquo;s home board, it is a <strong>backgammon</strong> (3 points).
          </p>

          <h2>Playing with the Too Many Dice app</h2>
          <ul>
            <li>Create a room above — the next screen shows a QR code to scan.</li>
            <li>
              Both players join from the app; the board lives on this screen. The first to join
              takes white and moves first.
            </li>
            <li>
              On your turn, roll both dice on your phone. A form then appears carrying a{" "}
              <strong>picker</strong> to choose which die to play and a <strong>d-pad</strong> that
              cycles through the starting points — one entry per point, however many checkers are
              stacked on it.
            </li>
            <li>
              The board follows your choice live: the point you are moving from and the square you
              would land on light up, in red if it is a hit.
            </li>
            <li>
              Tap <strong>Play</strong> to make the move. The form comes back for the next die, then
              it is your opponent&rsquo;s turn.
            </li>
          </ul>
        </div>

        <div className="tmd-example">
          <BackgammonBoard state={demoState} width={520} activePlayer="white" />
          <p className="tmd-caption">
            Two moves in: White opened 6-5 and ran a checker from point 24 to point 13; Black
            answered 3-1 to make its 20 point.
          </p>
          <div className="tmd-legend">
            {PLAYERS.map((side) => (
              <span key={side}>
                <i
                  className="tmd-dot"
                  style={{
                    background: PLAYER_SWATCH[side],
                    boxShadow: "0 0 0 1px oklch(0.6 0.02 70)",
                  }}
                />
                {PLAYER_NAME[side]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BackgammonMain;
