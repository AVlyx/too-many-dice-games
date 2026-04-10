import type { DieType } from "too-many-dice";

export type { DieType };

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type AbilityScores = Record<AbilityKey, number>;

export interface CharacterProfile {
  characterName: string;
  class: string;
  abilities: AbilityScores;
  proficiencyBonus: number;
  level: number;
  isNpc: boolean;
}

export type RollModifier =
  | { type: "ability"; score: AbilityKey }
  | { type: "proficiency" }
  | { type: "flat"; value: number }
  | { type: "none" };

/** A single group of identical dice, e.g. { count: 4, diceType: "d6" } */
export interface DiceGroup {
  count: number;
  diceType: DieType;
}

export interface RollConfig {
  label: string;
  /** One or more dice groups, e.g. [{ count:1, diceType:"d8" }, { count:4, diceType:"d6" }] */
  dice: DiceGroup[];
  modifier: RollModifier;
  extraBonus: number;
  /** Advantage/disadvantage only valid when dice is a single group with count=1 */
  rollType: "normal" | "advantage" | "disadvantage";
  dc?: number;
}

export interface DieResult {
  value: number;
  kept: boolean;
  dieType: DieType;
}

export interface RollResult {
  id: string;
  timestamp: number;
  /** Player TMD playerId, NPC UUID, or "dm" */
  playerId: string;
  characterName: string;
  label: string;
  config: RollConfig;
  dice: DieResult[];
  modifierValue: number;
  modifierLabel: string;
  total: number;
  passed?: boolean;
  isPrivate: boolean;
}

export interface RollPreset {
  id: string;
  name: string;
  config: RollConfig;
}

export interface ActiveRequest {
  id: string;
  playerId: string;
  config: RollConfig;
}

export interface NpcEntry {
  id: string;
  profile: CharacterProfile;
}

export const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];
export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};
export const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];
export const CLASS_OPTIONS = [
  "Barbarian", "Bard", "Cleric", "Druid", "Fighter",
  "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer",
  "Warlock", "Wizard", "Other",
];

/** Returns true if advantage/disadvantage is applicable to this config */
export function canUseAdvantage(config: RollConfig): boolean {
  return config.dice.length === 1 && config.dice[0].count === 1;
}
