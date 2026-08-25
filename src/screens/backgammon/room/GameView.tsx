import { useEffect, useRef, useState } from "react";
import {
  DpadForm,
  MessageForm,
  PickerForm,
  type CallbackFormHandle,
  type TmdPlayer,
  type TooManyDiceRoom,
} from "too-many-dice";
import BackgammonBoard from "../game/BackgammonBoard";
import { PLAYER_NAME, PLAYER_SWATCH } from "../game/theme";
import {
  applyMove,
  describeMove,
  diceFromRoll,
  diceOf,
  initialState,
  pipCount,
  playableMoves,
  pointLabel,
  sourcesOf,
  winKind,
  winner,
  WIN_POINTS,
  type BgMove,
  type BgState,
  type Player,
  type Source,
  type Target,
} from "../game/rules";

/** A player never gets longer than this to roll before the turn becomes retryable. */
const ROLL_TIMEOUT_MS = 10 * 60 * 1000;

export interface Seat {
  player: TmdPlayer;
  side: Player;
}

interface Highlight {
  source: Source;
  target: Target;
  hit: boolean;
}

interface GameViewProps {
  room: TooManyDiceRoom;
  seats: Seat[];
}

/** Cancellation token for the turn loop — checked after every await. */
interface Abort {
  stopped: boolean;
}

function sourceText(source: Source): string {
  return source === "bar" ? "the bar" : `point ${pointLabel(source)}`;
}

function GameView({ room, seats }: GameViewProps) {
  const [state, setState] = useState<BgState>(initialState);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState<number[]>([]);
  const [remaining, setRemaining] = useState<number[]>([]);
  const [phase, setPhase] = useState<"roll" | "choose" | "blocked" | "done">("roll");
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  // The phone only carries a picker and a d-pad, so the shared screen names the pick.
  const [choice, setChoice] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [champion, setChampion] = useState<Player | null>(null);
  const [restart, setRestart] = useState(0);

  // The turn loop is long-lived and async, so it reads the authoritative state
  // through refs rather than through its (stale) render closure.
  const stateRef = useRef(state);
  const turnRef = useRef(0);
  const formRef = useRef<CallbackFormHandle | null>(null);

  useEffect(() => {
    const abort: Abort = { stopped: false };

    const say = (line: string) => setLog((current) => [line, ...current].slice(0, 60));

    const commit = (next: BgState) => {
      stateRef.current = next;
      setState(next);
    };

    /**
     * Asks the player which move to make. The picker chooses the die, the d-pad
     * cycles through the starting points — one entry per point, however many
     * checkers are stacked on it. The current pick is mirrored onto the board
     * so the phone only has to carry the controls.
     */
    const askMove = (player: TmdPlayer, moves: BgMove[], left: number[]) =>
      new Promise<BgMove>((resolve) => {
        const dieOptions = diceOf(moves);
        let die = dieOptions[0];
        let sources = sourcesOf(moves.filter((m) => m.die === die));
        let index = 0;
        let handle: CallbackFormHandle | null = null;

        const current = (): BgMove =>
          moves.find((m) => m.die === die && m.from === sources[index])!;

        const show = () => {
          const move = current();
          setHighlight({ source: move.from, target: move.to, hit: move.hit });
          setChoice(
            sources.length > 1
              ? `Die ${die} · ${describeMove(move)}  (${index + 1}/${sources.length})`
              : `Die ${die} · ${describeMove(move)}`,
          );
        };

        const pickDie = (value: number) => {
          if (!dieOptions.includes(value)) return;
          die = value;
          sources = sourcesOf(moves.filter((m) => m.die === die));
          index = 0;
          show();
        };

        const rotate = (step: number) => {
          index = (index + step + sources.length) % sources.length;
          show();
        };

        show();

        // Fixed when the form is created, so it looks at every starting point
        // across all dice — the picker can still change which die is played.
        const manySources = sourcesOf(moves).length > 1;
        const anyChoice = manySources || dieOptions.length > 1;

        void room
          .sendCallbackForm({
            targetPlayer: player,
            title: `Dice left: ${left.join(" and ")}`,
            fields: [
              {
                field: new MessageForm(
                  "hint",
                  anyChoice
                    ? "Pick the die, then cycle through the starting points. The board follows your choice."
                    : "Only one move is possible — check the board, then tap Play.",
                ),
              },
              {
                field: new PickerForm(
                  "die",
                  "Die to play",
                  dieOptions.map((d) => String(d)),
                ),
                onChange: (value) => {
                  const parsed = Number(value);
                  if (!Number.isNaN(parsed)) pickDie(parsed);
                },
              },
              {
                field: new DpadForm("source", "Starting point", {
                  left: { visibility: manySources ? "enabled" : "disabled" },
                  right: { visibility: manySources ? "enabled" : "disabled" },
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
                label: "Play",
                onClick: () => {
                  void (async () => {
                    const move = current();
                    await handle?.clear();
                    formRef.current = null;
                    setHighlight(null);
                    setChoice(null);
                    resolve(move);
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

    /** Tells the player why the turn is lost and waits for them to dismiss it. */
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
      setPhase("roll");
      setDice([]);
      setRemaining([]);

      const results = await room.waitForRoll(seat.player, ROLL_TIMEOUT_MS);
      if (abort.stopped) return;

      const a = results[0]?.value;
      const b = results[1]?.value;
      if (a === undefined || b === undefined) throw new Error("The roll came back incomplete");

      const rolled = diceFromRoll(a, b);
      setDice(rolled);
      say(
        a === b
          ? `${seat.player.name} rolled double ${a} - four moves`
          : `${seat.player.name} rolled ${a} and ${b}`,
      );

      // Each die is played on its own, so we ask again while one is still playable.
      let left = rolled;
      while (left.length > 0) {
        const moves = playableMoves(stateRef.current, seat.side, left);
        if (moves.length === 0) {
          setPhase("blocked");
          const message =
            stateRef.current.bar[seat.side] > 0
              ? "Your checker on the bar cannot enter - the opposing home board is closed."
              : `No legal move with ${left.length > 1 ? "these dice" : "this die"}.`;
          say(`${seat.player.name} cannot play - turn skipped`);
          await askAcknowledge(seat.player, message);
          return;
        }

        setPhase("choose");
        setRemaining(left);
        const move = await askMove(seat.player, moves, left);
        if (abort.stopped) return;

        commit(applyMove(stateRef.current, move));
        say(`${PLAYER_NAME[seat.side]}: ${describeMove(move)} (die ${move.die})`);

        const used = left.indexOf(move.die);
        left = left.slice(0, used).concat(left.slice(used + 1));
        setRemaining(left);

        const champ = winner(stateRef.current);
        if (champ) {
          setChampion(champ);
          setPhase("done");
          say(`${seat.player.name} bore off all fifteen checkers!`);
          return;
        }
      }
    };

    const run = async () => {
      try {
        for (;;) {
          await playTurn(seats[turnRef.current]);
          if (abort.stopped || winner(stateRef.current)) return;
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
  const kind = champion ? winKind(state, champion) : null;

  return (
    <div className="tmd-game">
      <BackgammonBoard
        state={state}
        width={720}
        activePlayer={done ? champion : seat.side}
        selected={highlight?.source ?? null}
        target={highlight?.target ?? null}
        targetHit={highlight?.hit ?? false}
      />

      <div className="tmd-panel">
        {done && kind ? (
          <div className="tmd-banner">
            <h2>{PLAYER_NAME[champion]} wins</h2>
            <p>
              {kind === "single" && "A single game"}
              {kind === "gammon" && "Gammon \u2014 the loser bore off nothing"}
              {kind === "backgammon" && "Backgammon \u2014 the loser is still in the winner\u2019s home board"}{" "}
              · {WIN_POINTS[kind]} point{WIN_POINTS[kind] > 1 ? "s" : ""}
            </p>
          </div>
        ) : (
          <div className="tmd-turn">
            <h2>{seat.player.name}</h2>
            <p className="tmd-player-meta" style={{ color: PLAYER_SWATCH[seat.side] }}>
              playing {PLAYER_NAME[seat.side].toLowerCase()}
            </p>
            <p className="tmd-die">{dice.length > 0 ? dice.join(" ") : "–"}</p>
            <p className="tmd-hint">
              {phase === "roll" && "Roll both dice in the app."}
              {phase === "choose" &&
                "Pick the die in the picker, then cycle through the starting points."}
              {phase === "blocked" && "No move available - tap OK in the app."}
            </p>
            {phase === "choose" && remaining.length > 0 && (
              <p className="tmd-hint">Dice left: {remaining.join(", ")}</p>
            )}
            {phase === "choose" && choice && <p className="tmd-choice">{choice}</p>}
            {highlight && (
              <p className="tmd-hint">
                From {sourceText(highlight.source)}
                {highlight.hit ? " · hits an opposing checker" : ""}
              </p>
            )}
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
              <i
                className="tmd-dot"
                style={{
                  background: PLAYER_SWATCH[s.side],
                  boxShadow: "0 0 0 1px oklch(0.6 0.02 70)",
                }}
              />
              <span className="tmd-player-name">{s.player.name}</span>
              <span className="tmd-player-meta">
                {state.off[s.side]}/15 off · {pipCount(state, s.side)} pips
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
