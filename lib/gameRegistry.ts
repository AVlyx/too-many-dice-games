export interface GameEntry {
  slug: string;
  name: string;
  description: string;
  playerCount: number;
  href: string;
}

export const games: GameEntry[] = [
  {
    slug: "backgammon",
    name: "Backgammon",
    description: "Classic board game of strategy and luck. Roll dice and race to bear off all your checkers.",
    playerCount: 2,
    href: "/games/backgammon",
  },
  {
    slug: "snakes-and-ladders",
    name: "Snakes & Ladders",
    description: "Classic race to the top! Roll dice, climb ladders, and avoid snakes. Up to 10 players.",
    playerCount: 10,
    href: "/games/snakes-and-ladders",
  },
];
