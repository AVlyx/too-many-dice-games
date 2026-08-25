import { Link } from "react-router";
import PetitsChevauxBoard from "../horsy/game/PetitsChevauxBoard";
import { demoPieces } from "../horsy/game/demo";
import { MAX_PLAYERS as HORSY_MAX, MIN_PLAYERS as HORSY_MIN } from "../horsy/game/config";
import BackgammonBoard from "../backgammon/game/BackgammonBoard";
import { demoState } from "../backgammon/game/demo";
import "../shared/game.css";
import "./home.css";

const APP_STORE_URL = "https://apps.apple.com/app/too-many-dice/id6802084109";
const DOCS_URL = "https://docs.too-many-dice.com";
const CONTACT_URL = "mailto:anton@vancleem.com?subject=A%20game%20for%20Too%20Many%20Dice";

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M16.7 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.8-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.3 2.6 1.3-.1 1.8-.8 3.4-.8s2 .8 3.4.8c1.4 0 2.3-1.2 3.2-2.5.6-.9 1.1-1.9 1.4-2.9-3.1-1.2-3.2-4.1-3.2-4.2ZM14.2 5.3c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5Z" />
    </svg>
  );
}

function AndroidMark() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.2 5.1 6.3 3.6a.4.4 0 0 1 .7-.4l.9 1.5A8.2 8.2 0 0 1 12 4c1.5 0 2.9.3 4.1.7l.9-1.5a.4.4 0 0 1 .7.4l-.9 1.5A6.2 6.2 0 0 1 20 10.3H4a6.2 6.2 0 0 1 3.2-5.2Z"
      />
      <circle cx="9" cy="7.7" r="0.85" fill="var(--soon-bg)" />
      <circle cx="15" cy="7.7" r="0.85" fill="var(--soon-bg)" />
      <rect x="4" y="11.4" width="16" height="8.6" rx="2.4" fill="currentColor" />
    </svg>
  );
}

function Home() {
  return (
    <div className="tmd-page home">
      <header className="home-hero">
        <h1>Too many dice games</h1>
        <p className="tmd-lede">
          Board games that run in your browser, and one app that turns every phone in the room into
          its dice. No accounts, no rulebook arguments, no lost pieces under the sofa.
        </p>

        <div className="home-stores">
          <a className="home-store is-live" href={APP_STORE_URL} target="_blank" rel="noreferrer">
            <AppleMark />
            <span>
              <span className="home-store-top">Download on the</span>
              <span className="home-store-name">App Store</span>
            </span>
          </a>

          <span className="home-store is-soon">
            <AndroidMark />
            <span>
              <span className="home-store-top">Not yet on</span>
              <span className="home-store-name">Android</span>
            </span>
          </span>
        </div>

        <p className="home-store-note">
          Too Many Dice is on iPhone and iPad today. There is no Android version yet. I am looking
          for people willing to test the app so I can put it on the play store. Until then you can
          use the main site instead https://too-many-dice.com. For people willing to test the app,
          send me a mail and I'll add you. I need 12 testers for google to validate the app.
        </p>
      </header>

      <section className="home-section">
        <h2>Put the game on the big screen</h2>
        <p className="home-section-lede">
          These games are not meant to be played on a phone. Open one on a laptop, or cast it to the
          TV. The app in your pocket is the controller: it rolls the dice and plays your move.
        </p>

        <ol className="home-steps">
          <li className="home-step">
            <h3>Open a game on the big screen</h3>
            <p>
              Pick a game below on a laptop or a TV browser and hit <strong>Create a room</strong>.
              That screen keeps the board, whose turn it is, and the log of what happened.
            </p>
          </li>
          <li className="home-step">
            <h3>Everyone scans the QR code</h3>
            <p>
              The room shows a QR code and a short room code. Each player joins from their own phone
              with the Too Many Dice app. No sign-up, nothing to install per game.
            </p>
          </li>
          <li className="home-step">
            <h3>Your phone becomes the dice</h3>
            <p>
              On your turn, roll on the phone and choose your move there. The board on the big
              screen follows your choice live, then passes the turn along.
            </p>
          </li>
        </ol>
      </section>

      <section className="home-section">
        <h2>The games</h2>
        <p className="home-section-lede">
          Every game is free, runs in the browser, and needs nothing but the app to play.
        </p>

        <div className="home-grid">
          <Link className="home-card" to="/horsy">
            <div className="home-thumb">
              <PetitsChevauxBoard pieces={demoPieces} cell={12} />
            </div>
            <div className="home-card-body">
              <h3>Le jeu des petits chevaux</h3>
              <p>
                The French classic. Roll a six to leave the stable, run a full lap of the track,
                knock rivals home on the way, then climb your own staircase to the centre.
              </p>
              <div className="home-card-meta">
                <span className="home-tag">
                  {HORSY_MIN}–{HORSY_MAX} players
                </span>
                <span className="home-tag">One d6</span>
                <span className="home-tag">~30 min</span>
              </div>
              <span className="home-card-go">Rules and room →</span>
            </div>
          </Link>

          <Link className="home-card" to="/backgammon">
            <div className="home-thumb">
              <BackgammonBoard state={demoState} width={310} />
            </div>
            <div className="home-card-body">
              <h3>Backgammon</h3>
              <p>
                The oldest racing game there is. Fifteen checkers a side, two dice, a course that
                runs the opposite way to your opponent&rsquo;s, and a bar to be sent back to.
              </p>
              <div className="home-card-meta">
                <span className="home-tag">2 players</span>
                <span className="home-tag">Two d6</span>
                <span className="home-tag">~20 min</span>
              </div>
              <span className="home-card-go">Rules and room →</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="home-build">
        <h2>Bring your own game</h2>
        <p>
          The app is just a controller, and anyone can write something for it to control. The SDK
          hands you a room, the players, their rolls and the forms you show on their phones. The
          board and the rules are yours to write.
        </p>
        <p>
          If you want to make your own game, check out the docs, it is surprisingly easy. If you
          want, send me a message and I'll add it to this page.
        </p>
        <div className="home-build-actions">
          <a className="tmd-cta" href={DOCS_URL} target="_blank" rel="noreferrer">
            Read the docs →
          </a>
          <a className="tmd-cta is-ghost" href={CONTACT_URL}>
            Send me a message
          </a>
        </div>
      </section>
    </div>
  );
}

export default Home;
