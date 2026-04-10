"use client";

import { useState } from "react";
import type { TmdPlayer } from "too-many-dice";
import type { CharacterProfile, NpcEntry, AbilityKey } from "@/engine/dnd/types";
import { ABILITY_KEYS, ABILITY_LABELS, CLASS_OPTIONS } from "@/engine/dnd/types";

interface PlayerListProps {
  players: TmdPlayer[];
  characterProfiles: Record<string, CharacterProfile>;
  activeRequestPlayerIds: string[];
  npcs: NpcEntry[];
  onAddNpc: (profile: CharacterProfile) => void;
  onRemoveNpc: (id: string) => void;
}

function ProfileCard({
  name,
  profile,
  isActive,
  badge,
  onRemove,
}: {
  name: string;
  profile: CharacterProfile | null;
  isActive?: boolean;
  badge?: string;
  onRemove?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border rounded-lg p-2.5 transition-colors cursor-pointer select-none ${
        isActive
          ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/10"
          : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
      }`}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isActive && (
            <span className="animate-pulse text-amber-500 shrink-0">⏳</span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm truncate">
                {profile?.characterName ?? "…"}
              </span>
              {badge && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                  {badge}
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-400 truncate">
              {name}
              {profile && ` · ${profile.class} · Lvl ${profile.level}`}
              {!profile && " · filling profile…"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-neutral-400">{expanded ? "▲" : "▼"}</span>
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="text-xs text-red-400 hover:text-red-600 ml-1 px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {expanded && profile && (
        <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="grid grid-cols-6 gap-1 text-center">
            {ABILITY_KEYS.map((key) => (
              <div key={key} className="flex flex-col">
                <span className="text-xs text-neutral-400">{ABILITY_LABELS[key]}</span>
                <span className="text-sm font-bold tabular-nums">
                  {profile.abilities[key] >= 0 ? "+" : ""}{profile.abilities[key]}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            <span>Prof +{profile.proficiencyBonus}</span>
            <span>Level {profile.level}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const EMPTY_NPC: CharacterProfile = {
  characterName: "",
  class: "Fighter",
  abilities: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  proficiencyBonus: 2,
  level: 1,
  isNpc: true,
};

export function PlayerList({
  players,
  characterProfiles,
  activeRequestPlayerIds,
  npcs,
  onAddNpc,
  onRemoveNpc,
}: PlayerListProps) {
  const [showNpcForm, setShowNpcForm] = useState(false);
  const [npcForm, setNpcForm] = useState<CharacterProfile>(EMPTY_NPC);

  function handleAddNpc() {
    if (!npcForm.characterName.trim()) return;
    onAddNpc({ ...npcForm });
    setNpcForm(EMPTY_NPC);
    setShowNpcForm(false);
  }

  function setAbility(key: AbilityKey, value: number) {
    setNpcForm((f) => ({ ...f, abilities: { ...f.abilities, [key]: value } }));
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        Players ({players.length})
      </h2>

      {players.length === 0 && (
        <p className="text-sm text-neutral-400 dark:text-neutral-500 animate-pulse py-2">
          Waiting for players to join…
        </p>
      )}

      {players.map((player) => (
        <ProfileCard
          key={player.playerId}
          name={player.name}
          profile={characterProfiles[player.playerId] ?? null}
          isActive={activeRequestPlayerIds.includes(player.playerId)}
        />
      ))}

      {/* NPCs */}
      {npcs.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mt-2">
            NPCs / Enemies
          </h2>
          {npcs.map((npc) => (
            <ProfileCard
              key={npc.id}
              name="NPC"
              profile={npc.profile}
              badge="NPC"
              onRemove={() => onRemoveNpc(npc.id)}
            />
          ))}
        </>
      )}

      {/* Add NPC button / form */}
      {!showNpcForm ? (
        <button
          onClick={() => setShowNpcForm(true)}
          className="text-sm text-neutral-500 dark:text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg py-2 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          + Add NPC / Enemy
        </button>
      ) : (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 flex flex-col gap-2 bg-white dark:bg-neutral-900">
          <div className="font-semibold text-sm">New NPC</div>

          <input
            className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1 bg-transparent"
            placeholder="Name"
            value={npcForm.characterName}
            onChange={(e) => setNpcForm((f) => ({ ...f, characterName: e.target.value }))}
          />

          <select
            className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1 bg-transparent"
            value={npcForm.class}
            onChange={(e) => setNpcForm((f) => ({ ...f, class: e.target.value }))}
          >
            {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
          </select>

          <div className="grid grid-cols-3 gap-1">
            {ABILITY_KEYS.map((key) => (
              <div key={key} className="flex flex-col gap-0.5">
                <label className="text-xs text-neutral-400">{ABILITY_LABELS[key]}</label>
                <input
                  type="number"
                  min={-5}
                  max={10}
                  className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-1 bg-transparent text-center"
                  value={npcForm.abilities[key]}
                  onChange={(e) => setAbility(key, parseInt(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1">
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-neutral-400">Prof Bonus</label>
              <input
                type="number"
                min={2}
                max={6}
                className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-1 bg-transparent text-center"
                value={npcForm.proficiencyBonus}
                onChange={(e) => setNpcForm((f) => ({ ...f, proficiencyBonus: parseInt(e.target.value) || 2 }))}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-neutral-400">Level</label>
              <input
                type="number"
                min={1}
                max={20}
                className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-1 bg-transparent text-center"
                value={npcForm.level}
                onChange={(e) => setNpcForm((f) => ({ ...f, level: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddNpc}
              className="flex-1 text-sm py-1.5 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium"
            >
              Add NPC
            </button>
            <button
              onClick={() => setShowNpcForm(false)}
              className="text-sm px-3 py-1.5 rounded border border-neutral-200 dark:border-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
