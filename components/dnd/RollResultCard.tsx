"use client";

import Image from "next/image";
import type { RollResult } from "@/engine/dnd/types";
import { formatFormula } from "@/engine/dnd/dice";

interface RollResultCardProps {
  result: RollResult;
  compact?: boolean;
}

export function RollResultCard({ result, compact = false }: RollResultCardProps) {
  const {
    label,
    characterName,
    dice,
    modifierValue,
    modifierLabel,
    total,
    passed,
    config,
    isPrivate,
  } = result;

  const formula = formatFormula(dice, modifierValue, modifierLabel, total);
  const hasDC = config.dc !== undefined;
  const isAdvantage = config.rollType === "advantage";
  const isDisadvantage = config.rollType === "disadvantage";

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm truncate">{label}</span>
            {isPrivate && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                Private
              </span>
            )}
            {(isAdvantage || isDisadvantage) && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  isAdvantage
                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                }`}
              >
                {isAdvantage ? "Adv" : "Dis"}
              </span>
            )}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {characterName}
            {hasDC && ` · DC ${config.dc}`}
          </div>
        </div>

        {/* Total + Pass/Fail */}
        <div className="flex items-center gap-2 shrink-0">
          {hasDC && (
            <span
              className={`text-xs font-bold px-2 py-1 rounded ${
                passed
                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                  : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
              }`}
            >
              {passed ? "PASS" : "FAIL"}
            </span>
          )}
          <span className="text-2xl font-bold tabular-nums">{total}</span>
        </div>
      </div>

      {/* Dice breakdown — each die with its own icon */}
      <div className="flex items-center flex-wrap gap-1.5 mb-2">
        {dice.map((die, i) => (
          <div
            key={i}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-sm font-mono ${
              die.kept
                ? "bg-neutral-100 dark:bg-neutral-800"
                : "opacity-40"
            }`}
          >
            <Image
              src={`/diceIcon/${die.dieType}.svg`}
              alt={die.dieType}
              width={13}
              height={13}
              className="dark:invert"
            />
            <span className={die.kept ? "" : "line-through"}>{die.value}</span>
            {!die.kept && (
              <span className="text-xs text-neutral-400">drop</span>
            )}
          </div>
        ))}

        {modifierValue !== 0 && (
          <>
            <span className="text-neutral-400">+</span>
            <span className="text-sm text-neutral-600 dark:text-neutral-300">
              {modifierValue >= 0 ? "+" : ""}{modifierValue}
            </span>
          </>
        )}
      </div>

      {/* Formula */}
      {!compact && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono break-all">
          {formula}
        </div>
      )}
    </div>
  );
}
