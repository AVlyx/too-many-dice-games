"use client";

import { useState } from "react";
import type { TmdPlayer } from "too-many-dice";
import type { DndState, DndAction } from "@/hooks/useDndGame";
import type { RollConfig, RollPreset, NpcEntry, CharacterProfile } from "@/engine/dnd/types";
import { QRCode } from "@/components/room/QRCode";
import { PlayerList } from "./PlayerList";
import { RollRequestPanel } from "./RollRequestPanel";
import { RollFeed } from "./RollFeed";
import { RollHistoryLog } from "./RollHistoryLog";
import { PresetList } from "./PresetList";

type Tab = "history" | "presets";

interface DmDashboardProps {
  state: DndState;
  dispatch: React.Dispatch<DndAction>;
  roomCode: string;
  onRequestRoll: (config: RollConfig, targetPlayerIds: string[]) => void;
  /** rollerId = playerId | NPC uuid | "dm" */
  onDmRoll: (config: RollConfig, visibility: "public" | "private", rollerId: string) => void;
  onRequestPlayerPreset: (player: TmdPlayer) => void;
  onEndSession: () => void;
}

export function DmDashboard({
  state,
  dispatch,
  roomCode,
  onRequestRoll,
  onDmRoll,
  onRequestPlayerPreset,
  onEndSession,
}: DmDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const [showRoomCode, setShowRoomCode] = useState(false);

  const {
    players,
    characterProfiles,
    npcs,
    rollHistory,
    activeRequests,
    dmPresets,
    playerPresets,
    rollConfig,
    rollTarget,
  } = state;

  // Build a complete name map: players + NPCs + DM
  const characterNames: Record<string, string> = { dm: "Dungeon Master" };
  for (const p of players) {
    characterNames[p.playerId] = characterProfiles[p.playerId]?.characterName ?? p.name;
  }
  for (const npc of npcs) {
    characterNames[npc.id] = npc.profile.characterName;
  }

  const activeRequestPlayerIds = activeRequests.map((r) => r.playerId);
  const isPlayerTarget =
    rollTarget === "all" || players.some((p) => p.playerId === rollTarget);

  function handleRequestRoll() {
    const targetIds =
      rollTarget === "all" ? players.map((p) => p.playerId) : [rollTarget];
    onRequestRoll(rollConfig, targetIds);
  }

  function handleDmRoll(visibility: "public" | "private") {
    // When "all players" is selected, DM rolls as themselves
    const rollerId = rollTarget === "all" ? "dm" : rollTarget;
    onDmRoll(rollConfig, visibility, rollerId);
  }

  function handleAddNpc(profile: CharacterProfile) {
    const npc: NpcEntry = { id: crypto.randomUUID(), profile };
    dispatch({ type: "NPC_ADDED", npc });
  }

  function handleSaveDmPreset(preset: RollPreset) {
    dispatch({ type: "DM_PRESET_SAVED", preset });
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">D&amp;D Session</h1>
          <button
            onClick={() => setShowRoomCode((s) => !s)}
            className="flex items-center gap-1.5 text-sm font-mono font-bold tracking-widest px-3 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {roomCode}
            <span className="text-xs font-normal text-neutral-400">
              {showRoomCode ? "▲" : "▼"}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">
            {players.length} player{players.length !== 1 ? "s" : ""}
            {npcs.length > 0 && ` · ${npcs.length} NPC${npcs.length !== 1 ? "s" : ""}`}
          </span>
          <button
            onClick={onEndSession}
            className="text-sm px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Room code popover */}
      {showRoomCode && (
        <div className="flex items-center gap-6 p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-900">
          <QRCode roomCode={roomCode} />
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Room Code</p>
            <p className="text-3xl font-mono font-bold tracking-widest">{roomCode}</p>
            <p className="text-xs text-neutral-500 mt-2">
              Players scan QR or enter this code in the Too Many Dice app
            </p>
          </div>
        </div>
      )}

      {/* Main 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-4">
        {/* Players + NPCs */}
        <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <PlayerList
            players={players}
            characterProfiles={characterProfiles}
            activeRequestPlayerIds={activeRequestPlayerIds}
            npcs={npcs}
            onAddNpc={handleAddNpc}
            onRemoveNpc={(id) => dispatch({ type: "NPC_REMOVED", npcId: id })}
          />
        </div>

        {/* Roll Configuration */}
        <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <RollRequestPanel
            config={rollConfig}
            rollTarget={rollTarget}
            players={players}
            npcs={npcs}
            characterNames={characterNames}
            hasActiveRequests={activeRequests.length > 0}
            onConfigChange={(patch) => dispatch({ type: "SET_ROLL_CONFIG", config: patch })}
            onTargetChange={(t) => dispatch({ type: "SET_ROLL_TARGET", target: t })}
            onRequestRoll={handleRequestRoll}
            onDmRoll={handleDmRoll}
          />
        </div>

        {/* Live Feed */}
        <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <RollFeed
            recentResults={rollHistory}
            activeRequests={activeRequests}
            playerNames={characterNames}
          />
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          {(["history", "presets"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-sm py-2.5 font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/50"
              }`}
            >
              {tab === "history" ? `History (${rollHistory.length})` : "Presets"}
            </button>
          ))}
        </div>
        <div className="p-4 bg-white dark:bg-neutral-900">
          {activeTab === "history" && <RollHistoryLog history={rollHistory} />}
          {activeTab === "presets" && (
            <PresetList
              dmPresets={dmPresets}
              playerPresets={playerPresets}
              players={players}
              characterNames={characterNames}
              currentConfig={rollConfig}
              onLoadPreset={(config) => dispatch({ type: "LOAD_PRESET", config })}
              onSaveDmPreset={handleSaveDmPreset}
              onDeleteDmPreset={(id) => dispatch({ type: "DM_PRESET_DELETED", presetId: id })}
              onRequestPlayerPreset={onRequestPlayerPreset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
