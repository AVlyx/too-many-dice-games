import { useEffect, useState } from "react";
import { TmdPlayer, TooManyDiceRoom } from "too-many-dice"; //from too-many-dice npm package, I am trying to create a room but the import says Cannot find module 'too-many-dice' or its corresponding type declarations

function BackgammonRoom() {
  const [roomStarted, startRoom] = useState(false);
  const [room, setRoom] = useState<TooManyDiceRoom | null>(null);
  const [players, setPlayers] = useState<TmdPlayer[]>([]);

  useEffect(() => {
    const createRoom = async () => {
      const room_ = await TooManyDiceRoom.create("myapp.partykit.dev", {
        playerLimit: 2,
        diceConfig: [{ type: "d6" }, { type: "d6" }],
        callbacks: {
          onPlayerJoined: (player) => setPlayers((currentPlayers) => [...currentPlayers, player]),
          onPlayerLeft: (player) =>
            setPlayers((currentPlayers) =>
              currentPlayers.filter((currentPlayer) => currentPlayer.playerId !== player.playerId),
            ),
          onResult: (results) => console.log("Roll results:", results),
        },
      });
      setRoom(room_);
    };

    createRoom();
  }, []);

  if (!roomStarted) {
    return;
  } else {
  }
}

export default BackgammonRoom;
