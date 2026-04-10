import type { DiceResult as SdkDiceResult, DieType } from "too-many-dice";
import type { CharacterProfile, DieResult, RollConfig, RollResult } from "./types";
import { ABILITY_LABELS } from "./types";

/** Raw intermediate before determining kept/dropped */
type RawDie = { value: number; dieType: DieType };

export function resolveModifier(
  config: RollConfig,
  profile: CharacterProfile | null
): { value: number; label: string } {
  let modValue = 0;
  const parts: string[] = [];

  const mod = config.modifier;
  if (mod.type === "ability" && profile) {
    const score = profile.abilities[mod.score];
    modValue += score;
    parts.push(`${ABILITY_LABELS[mod.score]} ${score >= 0 ? "+" : ""}${score}`);
  } else if (mod.type === "proficiency" && profile) {
    modValue += profile.proficiencyBonus;
    parts.push(`Prof +${profile.proficiencyBonus}`);
  } else if (mod.type === "flat") {
    modValue += mod.value;
    parts.push(`Flat ${mod.value >= 0 ? "+" : ""}${mod.value}`);
  }

  if (config.extraBonus !== 0) {
    modValue += config.extraBonus;
    parts.push(`Bonus ${config.extraBonus >= 0 ? "+" : ""}${config.extraBonus}`);
  }

  return {
    value: modValue,
    label: parts.length > 0 ? parts.join(", ") : "no modifier",
  };
}

function processDice(raw: RawDie[], config: RollConfig): DieResult[] {
  if (config.rollType === "advantage") {
    const [a, b] = raw;
    if (!b) return [{ value: a.value, kept: true, dieType: a.dieType }];
    const keepFirst = a.value >= b.value;
    return [
      { value: a.value, kept: keepFirst, dieType: a.dieType },
      { value: b.value, kept: !keepFirst, dieType: b.dieType },
    ];
  }
  if (config.rollType === "disadvantage") {
    const [a, b] = raw;
    if (!b) return [{ value: a.value, kept: true, dieType: a.dieType }];
    const keepFirst = a.value <= b.value;
    return [
      { value: a.value, kept: keepFirst, dieType: a.dieType },
      { value: b.value, kept: !keepFirst, dieType: b.dieType },
    ];
  }
  return raw.map((r) => ({ value: r.value, kept: true, dieType: r.dieType }));
}

function buildFromRaw(
  raw: RawDie[],
  config: RollConfig,
  profile: CharacterProfile | null,
  playerId: string,
  characterName: string,
  isPrivate: boolean
): RollResult {
  const dice = processDice(raw, config);
  const diceTotal = dice.filter((d) => d.kept).reduce((s, d) => s + d.value, 0);
  const { value: modifierValue, label: modifierLabel } = resolveModifier(config, profile);
  const total = diceTotal + modifierValue;
  const passed = config.dc !== undefined ? total >= config.dc : undefined;

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    playerId,
    characterName,
    label: config.label || "Dice Roll",
    config,
    dice,
    modifierValue,
    modifierLabel,
    total,
    passed,
    isPrivate,
  };
}

export function buildRollResultFromSdk(
  sdkResults: SdkDiceResult[],
  config: RollConfig,
  profile: CharacterProfile | null,
  playerId: string,
  characterName: string,
  isPrivate: boolean
): RollResult {
  const raw: RawDie[] = sdkResults.map((r) => ({ value: r.value, dieType: r.dieType }));
  return buildFromRaw(raw, config, profile, playerId, characterName, isPrivate);
}

/** Roll locally using Math.random — never touches the SDK */
export function rollLocally(config: RollConfig): RawDie[] {
  if (config.rollType !== "normal") {
    // Advantage/disadvantage: always exactly 1 die group, roll 2
    const dt = config.dice[0]?.diceType ?? "d20";
    const sides = parseInt(dt.slice(1));
    return [
      { value: Math.floor(Math.random() * sides) + 1, dieType: dt },
      { value: Math.floor(Math.random() * sides) + 1, dieType: dt },
    ];
  }
  return config.dice.flatMap(({ diceType, count }) => {
    const sides = parseInt(diceType.slice(1));
    return Array.from({ length: count }, () => ({
      value: Math.floor(Math.random() * sides) + 1,
      dieType,
    }));
  });
}

export function buildRollResult(
  config: RollConfig,
  profile: CharacterProfile | null,
  playerId: string,
  characterName: string,
  isPrivate: boolean
): RollResult {
  return buildFromRaw(rollLocally(config), config, profile, playerId, characterName, isPrivate);
}

/** Build the SDK dice array for setDice() from a RollConfig */
export function buildSdkDiceConfig(
  config: RollConfig
): Array<{ id: string; type: DieType }> {
  if (config.rollType !== "normal") {
    const dt = config.dice[0]?.diceType ?? "d20";
    return [
      { id: "adv-0", type: dt },
      { id: "adv-1", type: dt },
    ];
  }
  return config.dice.flatMap(({ diceType, count }) =>
    Array.from({ length: count }, (_, i) => ({
      id: `${diceType}-${i}`,
      type: diceType,
    }))
  );
}

/** Human-readable formula: "5 (d8) + 3 (d6) + 6 (d6) + 3 (DEX) = 17" */
export function formatFormula(
  dice: DieResult[],
  modifierValue: number,
  modifierLabel: string,
  total: number
): string {
  const keptDice = dice.filter((d) => d.kept);
  const diceStr = keptDice.map((d) => `${d.value} (${d.dieType})`).join(" + ");
  if (modifierValue === 0) return `${diceStr} = ${total}`;
  return `${diceStr} + ${modifierValue} (${modifierLabel}) = ${total}`;
}

/** Summary string for a config, e.g. "1d20 + 4d6" */
export function diceSummary(config: RollConfig): string {
  const groups = config.dice.map((g) => `${g.count}${g.diceType}`).join(" + ");
  if (config.rollType === "advantage") return `${groups} (adv)`;
  if (config.rollType === "disadvantage") return `${groups} (dis)`;
  return groups;
}
