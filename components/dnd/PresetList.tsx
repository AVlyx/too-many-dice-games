"use client";

import { useState } from "react";
import Image from "next/image";
import type { TmdPlayer } from "too-many-dice";
import type { RollPreset, RollConfig } from "@/engine/dnd/types";
import { DIE_TYPES } from "@/engine/dnd/types";

interface PresetListProps {
  dmPresets: RollPreset[];
  playerPresets: Record<string, RollPreset[]>;
  players: TmdPlayer[];
  characterNames: Record<string, string>;
  currentConfig: RollConfig;
  onLoadPreset: (config: RollConfig) => void;
  onSaveDmPreset: (preset: RollPreset) => void;
  onDeleteDmPreset: (id: string) => void;
  onRequestPlayerPreset: (player: TmdPlayer) => void;
}

function PresetChip({
  preset,
  onLoad,
  onDelete,
}: {
  preset: RollPreset;
  onLoad: () => void;
  onDelete?: () => void;
}) {
  const { name, config } = preset;
  const modStr =
    config.modifier.type === "ability"
      ? config.modifier.score.toUpperCase()
      : config.modifier.type === "proficiency"
      ? "Prof"
      : config.modifier.type === "flat"
      ? `+${config.modifier.value}`
      : "";

  return (
    <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1.5">
      <Image
        src={`/diceIcon/${config.diceType}.svg`}
        alt={config.diceType}
        width={14}
        height={14}
        className="dark:invert shrink-0"
      />
      <button
        onClick={onLoad}
        className="text-sm font-medium hover:underline text-left min-w-0 truncate"
        title={`${config.count}${config.diceType}${modStr ? ` + ${modStr}` : ""}`}
      >
        {name}
      </button>
      <span className="text-xs text-neutral-400 shrink-0">
        {config.count}{config.diceType}
        {modStr && ` +${modStr}`}
        {config.rollType === "advantage" && " ⬆"}
        {config.rollType === "disadvantage" && " ⬇"}
      </span>
      {onDelete && (
        <button
          onClick={onDelete}
          className="text-neutral-400 hover:text-red-500 ml-1 text-xs shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function PresetList({
  dmPresets,
  playerPresets,
  players,
  characterNames,
  currentConfig,
  onLoadPreset,
  onSaveDmPreset,
  onDeleteDmPreset,
  onRequestPlayerPreset,
}: PresetListProps) {
  const [newPresetName, setNewPresetName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  function handleSave() {
    const name = newPresetName.trim() || currentConfig.label || "Preset";
    onSaveDmPreset({
      id: crypto.randomUUID(),
      name,
      config: { ...currentConfig },
    });
    setNewPresetName("");
    setShowSaveForm(false);
  }

  const playerPresetEntries = players
    .map((p) => ({ player: p, presets: playerPresets[p.playerId] ?? [] }))
    .filter((e) => e.presets.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* DM Presets */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            DM Presets
          </h3>
          <button
            onClick={() => setShowSaveForm((s) => !s)}
            className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {showSaveForm ? "Cancel" : "+ Save Current Roll"}
          </button>
        </div>

        {showSaveForm && (
          <div className="flex gap-2">
            <input
              className="flex-1 text-sm border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1.5 bg-transparent"
              placeholder={currentConfig.label || "Preset name…"}
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
            <button
              onClick={handleSave}
              className="text-sm px-3 py-1.5 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium"
            >
              Save
            </button>
          </div>
        )}

        {dmPresets.length === 0 ? (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            No presets yet. Configure a roll and save it.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {dmPresets.map((preset) => (
              <PresetChip
                key={preset.id}
                preset={preset}
                onLoad={() => onLoadPreset(preset.config)}
                onDelete={() => onDeleteDmPreset(preset.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Player Presets */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Player Presets
          </h3>
        </div>

        {players.length === 0 && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            No players connected.
          </p>
        )}

        {players.length > 0 && playerPresetEntries.length === 0 && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            No player presets yet. Request one below.
          </p>
        )}

        {playerPresetEntries.map(({ player, presets }) => (
          <div key={player.playerId} className="flex flex-col gap-1">
            <div className="text-xs font-medium text-neutral-500">
              {characterNames[player.playerId] ?? player.name}
            </div>
            {presets.map((preset) => (
              <PresetChip
                key={preset.id}
                preset={preset}
                onLoad={() => onLoadPreset(preset.config)}
              />
            ))}
          </div>
        ))}

        {players.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Request a preset from:
            </div>
            <div className="flex flex-wrap gap-1">
              {players.map((p) => (
                <button
                  key={p.playerId}
                  onClick={() => onRequestPlayerPreset(p)}
                  className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {characterNames[p.playerId] ?? p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dice icon legend */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-neutral-100 dark:border-neutral-800">
        {DIE_TYPES.map((dt) => (
          <div key={dt} className="flex items-center gap-1 text-xs text-neutral-400">
            <Image
              src={`/diceIcon/${dt}.svg`}
              alt={dt}
              width={14}
              height={14}
              className="dark:invert"
            />
            {dt}
          </div>
        ))}
      </div>
    </div>
  );
}
