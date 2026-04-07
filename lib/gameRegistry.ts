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
];
