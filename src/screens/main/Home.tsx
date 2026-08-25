import { Link } from "react-router";

function Home() {
  return (
    <div style={{ padding: "0 32px 64px" }}>
      <h1>Too many dice games</h1>
      <p>Couch games played on one screen, with the dice rolled from everyone&rsquo;s phone.</p>
      <p style={{ marginTop: 32 }}>
        <Link to="/horsy">Le jeu des petits chevaux →</Link>
      </p>
      <p style={{ marginTop: 12 }}>
        <Link to="/backgammon">Backgammon →</Link>
      </p>
    </div>
  );
}

export default Home;
