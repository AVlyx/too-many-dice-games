import { useEffect, useRef, useState } from "react";
import {
  DpadForm,
  MessageForm,
  type CallbackFormHandle,
  type TmdPlayer,
  type TooManyDiceRoom,
} from "too-many-dice";
import PetitsChevauxBoard, {
  initialPieces,
  type BoardCell,
  type Piece,
  type PlayerColor,
} from "../game/PetitsChevauxBoard";
import {
  allStabled,
  applyMove,
  describeMove,
  legalMoves,
  locateProgress,
  winner,
  type Move,
} from "../game/rules";

const SWATCH: Record<PlayerColor, string> = {
  red: "oklch(0.55 0.16 25)",
  blue: "oklch(0.52 0.12 255)",
  yellow: "oklch(0.72 0.13 85)",
  green: "oklch(0.5 0.12 150)",
};

/** A player never gets longer than this to roll before the turn becomes retryable. */
const ROLL_TIMEOUT_MS = 10 * 60 * 1000;

export interface Seat {
  player: TmdPlayer;
  color: PlayerColor;
}

interface Highlight {
  pieceId: string;
  target: BoardCell;
  capture: boolean;
}

interface GameViewProps {
  room: TooManyDiceRoom;
  seats: Seat[];
}

/** Cancellation token for the turn loop — checked after every await. */
interface Abort {
  stopped: boolean;
}

function highlightFor(move: Move): Highlight {
  const { loc, i } = locateProgress(move.color, move.to);
  return {
    pieceId: move.pieceId,
    target: { loc, i, color: move.color },
    capture: Boolean(move.capturesPieceId),
  };
}

function GameView({ room, seats }: GameViewProps) {
  const [pieces, setPieces] = useState<Piece[]>(initialPieces);
  const [turn, setTurn] = useState(0);
  const [die, setDie] = useState<number | null>(null);
  const [phase, setPhase] = useState<"roll" | "choose" | "blocked" | "done">("roll");
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  // The phone now only carries a d-pad, so the shared screen names the pick.
  const [choice, setChoice] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [champion, setChampion] = useState<PlayerColor | null>(null);
  const [restart, setRestart] = useState(0);

  // The turn loop is long-lived and async, so it reads the authoritative state
  // through refs rather than through its (stale) render closure.
  const piecesRef = useRef(pieces);
  const turnRef = useRef(0);
  const formRef = useRef<CallbackFormHandle | null>(null);

  useEffect(() => {
    const abort: Abort = { stopped: false };

    const say = (line: string) => setLog((current) => [line, ...current].slice(0, 60));

    const commit = (next: Piece[]) => {
      piecesRef.current = next;
      setPieces(next);
    };

    /**
     * Asks the player which horse to move. Left and right rotate through the
     * legal moves, wrapping at both ends; the current pick is mirrored onto the
     * board so the phone only has to carry the controls. moves[0] starts
     * selected because a player may submit without touching the d-pad.
     */
    const askMove = (player: TmdPlayer, moves: Move[], rolled: number) =>
      new Promise<Move>((resolve) => {
        let index = 0;
        let handle: CallbackFormHandle | null = null;

        const show = () => {
          setHighlight(highlightFor(moves[index]));
          setChoice(
            moves.length > 1
              ? `${describeMove(moves[index])}  (${index + 1}/${moves.length})`
              : describeMove(moves[index]),
          );
        };
        show();

        const rotate = (step: number) => {
          index = (index + step + moves.length) % moves.length;
          show();
        };

        void room
          .sendCallbackForm({
            targetPlayer: player,
            title: `You rolled ${rolled}`,
            fields: [
              {
                field: new MessageForm(
                  "hint",
                  moves.length === 1
                    ? "One horse can move — check the board, then tap Submit."
                    : "Cycle through your horses, then tap Submit.",
                ),
              },
              {
                field: new DpadForm("horse", "Choose a horse", {
                  left: { visibility: moves.length > 1 ? "enabled" : "disabled" },
                  right: { visibility: moves.length > 1 ? "enabled" : "disabled" },
                  up: { visibility: "hidden" },
                  down: { visibility: "hidden" },
                }),
                onChange: (value) => {
                  if (value === "left") rotate(-1);
                  if (value === "right") rotate(1);
                },
              },
            ],
            buttons: [
              {
                label: "Submit",
                onClick: () => {
                  void (async () => {
                    await handle?.clear();
                    formRef.current = null;
                    setHighlight(null);
                    setChoice(null);
                    resolve(moves[index]);
                  })();
                },
              },
            ],
          })
          .then((created) => {
            handle = created;
            formRef.current = created;
          });
      });

    /** Tells the player why they cannot play and waits for them to dismiss it. */
    const askAcknowledge = (player: TmdPlayer, message: string) =>
      new Promise<void>((resolve) => {
        let handle: CallbackFormHandle | null = null;
        void room
          .sendCallbackForm({
            targetPlayer: player,
            title: "No move available",
            fields: [{ field: new MessageForm("reason", message) }],
            buttons: [
              {
                label: "OK",
                onClick: () => {
                  void (async () => {
                    await handle?.clear();
                    formRef.current = null;
                    resolve();
                  })();
                },
              },
            ],
          })
          .then((created) => {
            handle = created;
            formRef.current = created;
          });
      });

    const playTurn = async (seat: Seat) => {
      // A 6 buys another roll, so a turn is a loop rather than a single move.
      for (;;) {
        setPhase("roll");
        setDie(null);
        const results = await room.waitForRoll(seat.player, ROLL_TIMEOUT_MS);
        if (abort.stopped) return;

        const rolled = results[0]?.value;
        if (rolled === undefined) throw new Error("The roll came back empty");
        setDie(rolled);
        say(`${seat.player.name} rolled a ${rolled}`);

        const moves = legalMoves(piecesRef.current, seat.color, rolled);
        if (moves.length === 0) {
          setPhase("blocked");
          const message = allStabled(piecesRef.current, seat.color)
            ? "You need a 6 to bring a horse out of the stable"
            : `No legal move with a ${rolled}`;
          say(`${seat.player.name} cannot play - ${message.toLowerCase()}`);
          await askAcknowledge(seat.player, message);
          // Even a wasted 6 ends the turn, so this loop cannot spin forever.
          return;
        }

        setPhase("choose");
        const move = await askMove(seat.player, moves, rolled);
        if (abort.stopped) return;

        commit(applyMove(piecesRef.current, move));
        say(`${seat.player.name}: ${describeMove(move)}`);

        const champ = winner(piecesRef.current);
        if (champ) {
          setChampion(champ);
          setPhase("done");
          say(`${seat.player.name} brought every horse home!`);
          return;
        }

        if (rolled !== 6) return;
        say(`${seat.player.name} rolled a 6 - another roll`);
      }
    };

    const run = async () => {
      try {
        for (;;) {
          await playTurn(seats[turnRef.current]);
          if (abort.stopped || winner(piecesRef.current)) return;
          turnRef.current = (turnRef.current + 1) % seats.length;
          setTurn(turnRef.current);
        }
      } catch (err: unknown) {
        if (abort.stopped) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    void run();

    return () => {
      abort.stopped = true;
      void formRef.current?.clear();
      formRef.current = null;
    };
  }, [room, seats, restart]);

  const seat = seats[turn];
  const done = champion !== null;

  return (
    <div className="tmd-game">
      <PetitsChevauxBoard
        pieces={pieces}
        cell={42}
        highlightPieceId={highlight?.pieceId ?? null}
        highlightTarget={highlight?.target ?? null}
        highlightCapture={highlight?.capture ?? false}
        activeColor={done ? champion : seat.color}
      />

      <div className="tmd-panel">
        {done ? (
          <div className="tmd-banner">
            <h2>{champion} wins</h2>
            <p>All four horses are home.</p>
          </div>
        ) : (
          <div className="tmd-turn">
            <h2>{seat.player.name}</h2>
            <p className="tmd-player-meta" style={{ color: SWATCH[seat.color] }}>
              playing {seat.color}
            </p>
            <p className="tmd-die">{die ?? "-"}</p>
            <p className="tmd-hint">
              {phase === "roll" && "Roll the dice in the app."}
              {phase === "choose" && "Cycle through horses on the d-pad, then tap Submit."}
              {phase === "blocked" && "No move available - tap OK in the app."}
            </p>
            {phase === "choose" && choice && <p className="tmd-choice">{choice}</p>}
          </div>
        )}

        {error && (
          <div className="tmd-error">
            <p>{error}</p>
            <button
              className="tmd-cta is-ghost"
              onClick={() => {
                setError(null);
                setRestart((n) => n + 1);
              }}
            >
              Retry turn
            </button>
          </div>
        )}

        <ul className="tmd-players">
          {seats.map((s, index) => (
            <li
              className={`tmd-player${index === turn && !done ? " is-turn" : ""}`}
              key={s.player.playerId}
            >
              <i className="tmd-dot" style={{ background: SWATCH[s.color] }} />
              <span className="tmd-player-name">{s.player.name}</span>
              <span className="tmd-player-meta">
                {pieces.filter((p) => p.color === s.color && p.loc === "home").length}/4 home
              </span>
            </li>
          ))}
        </ul>

        <div>
          <p className="tmd-code-label">Log</p>
          <ul className="tmd-log">
            {log.map((line, index) => (
              <li key={`${String(log.length - index)}-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default GameView;
