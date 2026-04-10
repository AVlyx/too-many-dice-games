"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  TooManyDiceRoom,
  TextForm,
  PickerForm,
  SliderForm,
  type TmdPlayer,
  type SubmitFormGroup,
  type DieType,
} from "too-many-dice";
import { TMD_HOST } from "@/lib/tmd";
import { useDndGame } from "@/hooks/useDndGame";
import {
  buildRollResult,
  buildRollResultFromSdk,
  buildSdkDiceConfig,
} from "@/engine/dnd/dice";
import type {
  RollConfig,
  RollPreset,
  CharacterProfile,
  AbilityKey,
  RollModifier,
} from "@/engine/dnd/types";
import { CLASS_OPTIONS } from "@/engine/dnd/types";
import { DmDashboard } from "./DmDashboard";
import { QRCode } from "@/components/room/QRCode";

export function DndGame() {
  const { state, dispatch, stateRef } = useDndGame();
  const roomRef = useRef<TooManyDiceRoom | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  // Accumulates pending profile submit-forms so re-sends include all pending players
  const pendingProfileFormsRef = useRef<SubmitFormGroup[]>([]);

  const collectProfileForPlayer = useCallback(async (player: TmdPlayer) => {
    const room = roomRef.current;
    if (!room) return;

    const group: SubmitFormGroup = {
      formId: `profile-${player.playerId}`,
      targetPlayer: player,
      fields: [
        new TextForm("name", "Character Name", { required: true }),
        new PickerForm("class", "Class", CLASS_OPTIONS),
        new SliderForm("str", "STR modifier", -5, 10, 1),
        new SliderForm("dex", "DEX modifier", -5, 10, 1),
        new SliderForm("con", "CON modifier", -5, 10, 1),
        new SliderForm("int", "INT modifier", -5, 10, 1),
        new SliderForm("wis", "WIS modifier", -5, 10, 1),
        new SliderForm("cha", "CHA modifier", -5, 10, 1),
        new SliderForm("prof", "Proficiency Bonus", 2, 6, 1),
        new SliderForm("level", "Level", 1, 20, 1),
      ],
      submitButton: { label: "Join Session" },
    };

    pendingProfileFormsRef.current = [...pendingProfileFormsRef.current, group];
    await room.sendSubmitForms(pendingProfileFormsRef.current);
  }, []);

  // Create room on mount
  useEffect(() => {
    let destroyed = false;

    TooManyDiceRoom.create(TMD_HOST, {
      diceConfig: [{ type: "d20" }],
      callbacks: {
        onPlayerJoined: (player) => {
          dispatchRef.current({ type: "PLAYER_JOINED", player });
          void collectProfileForPlayer(player);
        },
        onPlayerLeft: (player) => {
          dispatchRef.current({ type: "PLAYER_LEFT", playerId: player.playerId });
          pendingProfileFormsRef.current = pendingProfileFormsRef.current.filter(
            (g) => g.formId !== `profile-${player.playerId}`
          );
        },
        onFormSubmit: ({ formId, playerId, answers }) => {
          if (formId.startsWith("profile-")) {
            const profile: CharacterProfile = {
              characterName: (answers.name as string) || "Unknown",
              class: (answers.class as string) || "Other",
              abilities: {
                str: Number(answers.str ?? 0),
                dex: Number(answers.dex ?? 0),
                con: Number(answers.con ?? 0),
                int: Number(answers.int ?? 0),
                wis: Number(answers.wis ?? 0),
                cha: Number(answers.cha ?? 0),
              },
              proficiencyBonus: Number(answers.prof ?? 2),
              level: Number(answers.level ?? 1),
              isNpc: false,
            };
            dispatchRef.current({ type: "PROFILE_COLLECTED", playerId, profile });
            pendingProfileFormsRef.current = pendingProfileFormsRef.current.filter(
              (g) => g.formId !== formId
            );
          }
        },
      },
    })
      .then((room) => {
        if (destroyed) { void room.destroy(); return; }
        roomRef.current = room;
        setRoomCode(room.roomCode);
      })
      .catch((e) => {
        setRoomError(e instanceof Error ? e.message : "Failed to create room");
      });

    return () => {
      destroyed = true;
      void roomRef.current?.destroy();
    };
  }, [collectProfileForPlayer]);

  /** Send a roll request to specific players via callback form */
  const requestRoll = useCallback(
    async (config: RollConfig, targetPlayerIds: string[]) => {
      const room = roomRef.current;
      if (!room) return;

      const allPlayers = stateRef.current.players;
      const targets = allPlayers.filter((p) =>
        targetPlayerIds.includes(p.playerId)
      );
      if (targets.length === 0) return;

      const sdkDice = buildSdkDiceConfig(config);
      await room.setDice(sdkDice);

      await Promise.all(
        targets.map(async (player) => {
          const requestId = crypto.randomUUID();
          dispatchRef.current({
            type: "ROLL_REQUESTED",
            request: { id: requestId, playerId: player.playerId, config },
          });

          const rawResults = await room.waitForRoll(player);
          const st = stateRef.current;
          const profile = st.characterProfiles[player.playerId] ?? null;
          const charName =
            profile?.characterName ??
            st.players.find((p) => p.playerId === player.playerId)?.name ??
            player.playerId;
          const result = buildRollResultFromSdk(
            rawResults,
            config,
            profile,
            player.playerId,
            charName,
            false
          );
          dispatchRef.current({ type: "ROLL_RECEIVED", result });
          dispatchRef.current({ type: "ROLL_REQUEST_DONE", requestId });
        })
      );
    },
    [stateRef]
  );

  /**
   * DM rolls dice directly (for self, NPC, or mob).
   * Public = triggers dice physics on connected phones via SDK.
   * Private = local Math.random only.
   * rollerId = "dm" | playerId | NPC uuid
   */
  const dmRoll = useCallback(
    async (config: RollConfig, visibility: "public" | "private", rollerId: string) => {
      const room = roomRef.current;
      const st = stateRef.current;
      const profile = st.characterProfiles[rollerId] ?? null;
      const characterName =
        profile?.characterName ??
        (rollerId === "dm" ? "Dungeon Master" : rollerId);

      if (visibility === "private" || !room || room.players.length === 0) {
        const result = buildRollResult(config, profile, rollerId, characterName, true);
        dispatchRef.current({ type: "ROLL_RECEIVED", result });
      } else {
        const sdkDice = buildSdkDiceConfig(config);
        await room.setDice(sdkDice);
        const rawResults = await room.roll();
        const result = buildRollResultFromSdk(
          rawResults,
          config,
          profile,
          rollerId,
          characterName,
          false
        );
        dispatchRef.current({ type: "ROLL_RECEIVED", result });
      }
    },
    [stateRef]
  );

  /** Ask a player to save one of their presets via callback form */
  const requestPresetFromPlayer = useCallback(async (player: TmdPlayer) => {
    const room = roomRef.current;
    if (!room) return;

    const presetData = {
      name: "",
      diceType: "d20" as DieType,
      count: 1,
      modifierType: "None",
      extraBonus: 0,
    };

    return new Promise<void>((resolve) => {
      let handle: CallbackFormHandle | null = null;

      room
        .sendCallbackForm({
          targetPlayer: player,
          fields: [
            {
              field: new TextForm("name", "Preset Name"),
              onChange: (v) => { presetData.name = v as string; },
            },
            {
              field: new PickerForm("dice", "Dice Type", ["d4", "d6", "d8", "d10", "d12", "d20"]),
              onChange: (v) => { presetData.diceType = v as DieType; },
            },
            {
              field: new SliderForm("count", "Count", 1, 10, 1),
              onChange: (v) => { presetData.count = v as number; },
            },
            {
              field: new PickerForm("mod", "Modifier", [
                "None", "STR", "DEX", "CON", "INT", "WIS", "CHA", "Proficiency",
              ]),
              onChange: (v) => { presetData.modifierType = v as string; },
            },
            {
              field: new SliderForm("bonus", "Flat Bonus", -10, 10, 1),
              onChange: (v) => { presetData.extraBonus = v as number; },
            },
          ],
          buttons: [
            {
              label: "Save Preset",
              onClick: (playerId) => {
                const mod = presetData.modifierType;
                const modifier: RollModifier =
                  mod === "None"
                    ? { type: "none" }
                    : mod === "Proficiency"
                    ? { type: "proficiency" }
                    : { type: "ability", score: mod.toLowerCase() as AbilityKey };

                const preset: RollPreset = {
                  id: crypto.randomUUID(),
                  name: presetData.name || "Preset",
                  config: {
                    label: presetData.name || "Preset",
                    dice: [{ count: presetData.count, diceType: presetData.diceType }],
                    modifier,
                    extraBonus: presetData.extraBonus,
                    rollType: "normal",
                  },
                };

                dispatchRef.current({ type: "PLAYER_PRESET_SAVED", playerId, preset });
                void handle?.clear();
                resolve();
              },
            },
          ],
        })
        .then((h) => { handle = h; });
    });
  }, []);

  const handleEndSession = useCallback(() => {
    void roomRef.current?.destroy();
    setSessionEnded(true);
  }, []);

  if (roomError) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-red-500">Error: {roomError}</p>
      </div>
    );
  }

  if (sessionEnded) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-2xl font-bold">Session Ended</p>
        <p className="text-neutral-500">All session data has been cleared.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold"
        >
          Start New Session
        </button>
      </div>
    );
  }

  if (!roomCode) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="animate-pulse">Creating session…</p>
      </div>
    );
  }

  // Lobby: no players yet
  if (state.players.length === 0) {
    return (
      <div className="flex flex-col items-center gap-8 py-12">
        <h2 className="text-2xl font-semibold">D&amp;D Session Ready</h2>
        <p className="text-sm text-neutral-500">
          Players: scan QR or enter the room code in the Too Many Dice app
        </p>
        <QRCode roomCode={roomCode} />
        <div className="text-center">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Room Code</p>
          <p className="text-4xl font-mono font-bold tracking-widest">{roomCode}</p>
        </div>
        <p className="text-sm text-neutral-400 animate-pulse">
          Waiting for players to join…
        </p>
      </div>
    );
  }

  return (
    <DmDashboard
      state={state}
      dispatch={dispatch}
      roomCode={roomCode}
      onRequestRoll={requestRoll}
      onDmRoll={dmRoll}
      onRequestPlayerPreset={requestPresetFromPlayer}
      onEndSession={handleEndSession}
    />
  );
}
