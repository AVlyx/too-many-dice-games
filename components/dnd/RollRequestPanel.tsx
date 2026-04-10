"use client";

import Image from "next/image";
import type { TmdPlayer } from "too-many-dice";
import type { RollConfig, RollModifier, AbilityKey, DiceGroup, NpcEntry } from "@/engine/dnd/types";
import { DIE_TYPES, ABILITY_KEYS, ABILITY_LABELS, canUseAdvantage } from "@/engine/dnd/types";
import { diceSummary } from "@/engine/dnd/dice";
import type { DieType } from "too-many-dice";

interface RollRequestPanelProps {
  config: RollConfig;
  rollTarget: string;
  players: TmdPlayer[];
  npcs: NpcEntry[];
  characterNames: Record<string, string>;
  hasActiveRequests: boolean;
  onConfigChange: (patch: Partial<RollConfig>) => void;
  onTargetChange: (target: string) => void;
  onRequestRoll: () => void;
  onDmRoll: (visibility: "public" | "private") => void;
}

const MODIFIER_OPTIONS = [
  { label: "None", value: "none" },
  ...ABILITY_KEYS.map((k) => ({ label: ABILITY_LABELS[k], value: k })),
  { label: "Proficiency", value: "proficiency" },
];

function modifierToValue(mod: RollModifier): string {
  if (mod.type === "ability") return mod.score;
  if (mod.type === "proficiency") return "proficiency";
  return "none";
}

function valueToModifier(val: string): RollModifier {
  if (val === "none") return { type: "none" };
  if (val === "proficiency") return { type: "proficiency" };
  if (ABILITY_KEYS.includes(val as AbilityKey)) {
    return { type: "ability", score: val as AbilityKey };
  }
  return { type: "none" };
}

function DiceGroupRow({
  group,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  group: DiceGroup;
  index: number;
  canRemove: boolean;
  onChange: (g: DiceGroup) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        max={20}
        className="w-14 text-sm border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1.5 bg-transparent text-center"
        value={group.count}
        onChange={(e) =>
          onChange({ ...group, count: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })
        }
      />
      <span className="text-neutral-400 text-sm">×</span>
      <div className="flex gap-1 flex-wrap">
        {DIE_TYPES.map((dt) => (
          <button
            key={dt}
            onClick={() => onChange({ ...group, diceType: dt as DieType })}
            title={dt}
            className={`flex items-center gap-1 px-1.5 py-1 rounded border transition-colors text-xs ${
              group.diceType === dt
                ? "border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800"
                : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-400"
            }`}
          >
            <Image
              src={`/diceIcon/${dt}.svg`}
              alt={dt}
              width={16}
              height={16}
              className="dark:invert"
            />
            <span className="font-mono">{dt}</span>
          </button>
        ))}
      </div>
      {canRemove && (
        <button
          onClick={onRemove}
          className="text-neutral-400 hover:text-red-500 text-sm px-1 ml-auto shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function RollRequestPanel({
  config,
  rollTarget,
  players,
  npcs,
  characterNames,
  hasActiveRequests,
  onConfigChange,
  onTargetChange,
  onRequestRoll,
  onDmRoll,
}: RollRequestPanelProps) {
  const advAllowed = canUseAdvantage(config);
  const isPlayerTarget =
    rollTarget === "all" || players.some((p) => p.playerId === rollTarget);

  function updateGroup(index: number, g: DiceGroup) {
    const next = config.dice.map((d, i) => (i === index ? g : d));
    onConfigChange({ dice: next });
  }

  function removeGroup(index: number) {
    onConfigChange({ dice: config.dice.filter((_, i) => i !== index) });
  }

  function addGroup() {
    onConfigChange({ dice: [...config.dice, { count: 1, diceType: "d6" }] });
  }

  function setRollType(rt: RollConfig["rollType"]) {
    if (!advAllowed && rt !== "normal") return;
    onConfigChange({ rollType: rt });
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        Roll Configuration
      </h2>

      {/* Label */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-500 dark:text-neutral-400">Label</label>
        <input
          className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded px-3 py-2 bg-transparent focus:outline-none focus:border-neutral-400"
          placeholder="e.g. Sneak Attack"
          value={config.label}
          onChange={(e) => onConfigChange({ label: e.target.value })}
        />
      </div>

      {/* Dice Groups */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">Dice</label>
          <span className="text-xs font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
            {diceSummary(config)}
          </span>
        </div>

        {config.dice.map((group, i) => (
          <DiceGroupRow
            key={i}
            group={group}
            index={i}
            canRemove={config.dice.length > 1}
            onChange={(g) => updateGroup(i, g)}
            onRemove={() => removeGroup(i)}
          />
        ))}

        <button
          onClick={addGroup}
          className="text-xs text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-600 rounded py-1.5 hover:border-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          + Add Dice Group
        </button>
      </div>

      {/* Roll Type */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-500 dark:text-neutral-400">
          Roll Type
          {!advAllowed && (
            <span className="ml-1 text-neutral-400">(adv/dis requires single 1d__)</span>
          )}
        </label>
        <div className="flex gap-1">
          {(["normal", "advantage", "disadvantage"] as const).map((rt) => (
            <button
              key={rt}
              disabled={rt !== "normal" && !advAllowed}
              onClick={() => setRollType(rt)}
              className={`flex-1 text-xs py-1.5 rounded border transition-colors ${
                config.rollType === rt
                  ? rt === "advantage"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : rt === "disadvantage"
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    : "border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-400"
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {rt === "normal" ? "Normal" : rt === "advantage" ? "Adv ⬆" : "Dis ⬇"}
            </button>
          ))}
        </div>
      </div>

      {/* Modifier + Extra Bonus */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">Modifier</label>
          <select
            className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1.5 bg-transparent"
            value={modifierToValue(config.modifier)}
            onChange={(e) => onConfigChange({ modifier: valueToModifier(e.target.value) })}
          >
            {MODIFIER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">Extra Bonus</label>
          <input
            type="number"
            min={-20}
            max={20}
            className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1.5 bg-transparent text-center"
            value={config.extraBonus}
            onChange={(e) => onConfigChange({ extraBonus: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      {/* DC */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-500 dark:text-neutral-400">
          DC <span className="text-neutral-400">— optional</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={30}
            placeholder="—"
            className="w-20 text-sm border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1.5 bg-transparent text-center"
            value={config.dc ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              onConfigChange({ dc: val === "" ? undefined : parseInt(val) || undefined });
            }}
          />
          {config.dc !== undefined && (
            <button
              onClick={() => onConfigChange({ dc: undefined })}
              className="text-xs text-neutral-400 hover:text-neutral-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 flex flex-col gap-3">
        {/* Target */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">Target</label>
          <select
            className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1.5 bg-transparent"
            value={rollTarget}
            onChange={(e) => onTargetChange(e.target.value)}
          >
            <option value="all">All Players</option>
            {players.length > 0 && (
              <optgroup label="Players">
                {players.map((p) => (
                  <option key={p.playerId} value={p.playerId}>
                    {characterNames[p.playerId] ?? p.name}
                  </option>
                ))}
              </optgroup>
            )}
            {npcs.length > 0 && (
              <optgroup label="Mobs / NPCs">
                {npcs.map((npc) => (
                  <option key={npc.id} value={npc.id}>
                    {npc.profile.characterName}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="DM">
              <option value="dm">Dungeon Master</option>
            </optgroup>
          </select>
        </div>

        {/* Request Roll — players only */}
        {isPlayerTarget && (
          <button
            onClick={onRequestRoll}
            disabled={players.length === 0 || hasActiveRequests}
            className="w-full py-2.5 rounded-lg font-semibold text-sm bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {hasActiveRequests ? "⏳ Waiting for rolls…" : "🎲 Request Roll from Player"}
          </button>
        )}

        {/* DM / Mob Roll buttons */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">
            {isPlayerTarget ? "DM Roll (bypass player)" : "Roll"}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onDmRoll("public")}
              className="flex-1 py-2 rounded-lg text-sm border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Triggers dice on player phones"
            >
              🌐 Public
            </button>
            <button
              onClick={() => onDmRoll("private")}
              className="flex-1 py-2 rounded-lg text-sm border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Local RNG — only visible to you"
            >
              🔒 Private
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
