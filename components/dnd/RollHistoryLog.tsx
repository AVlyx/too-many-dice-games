"use client";

import Image from "next/image";
import type { RollResult } from "@/engine/dnd/types";

interface RollHistoryLogProps {
  history: RollResult[];
}

function exportCsv(history: RollResult[]) {
  const header = "Time,Character,Roll,Dice,Modifiers,Total,DC,Pass/Fail";
  const rows = history.map((r) => {
    const time = new Date(r.timestamp).toLocaleTimeString();
    const dice = r.dice
      .map((d) => (d.kept ? `${d.value}${d.dieType}` : `(${d.value}${d.dieType})`))
      .join("+");
    const dc = r.config.dc ?? "";
    const passFail =
      r.passed !== undefined ? (r.passed ? "PASS" : "FAIL") : "";
    return [
      time,
      r.characterName,
      r.label,
      dice,
      r.modifierLabel,
      r.total,
      dc,
      passFail,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dnd-session-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function RollHistoryLog({ history }: RollHistoryLogProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-8">
        No rolls yet this session
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">{history.length} rolls</span>
        <button
          onClick={() => exportCsv(history)}
          className="text-xs px-3 py-1.5 rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-left">
              <th className="py-2 pr-3 font-medium">Time</th>
              <th className="py-2 pr-3 font-medium">Character</th>
              <th className="py-2 pr-3 font-medium">Roll</th>
              <th className="py-2 pr-3 font-medium">Dice</th>
              <th className="py-2 pr-3 font-medium">Mods</th>
              <th className="py-2 pr-3 font-medium text-right">Total</th>
              <th className="py-2 font-medium">DC</th>
            </tr>
          </thead>
          <tbody>
            {history.map((r) => (
              <tr
                key={r.id}
                className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <td className="py-2 pr-3 text-neutral-400 whitespace-nowrap">
                  {new Date(r.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </td>
                <td className="py-2 pr-3 max-w-[90px] truncate">
                  {r.characterName}
                  {r.isPrivate && (
                    <span className="ml-1 text-neutral-400">(pvt)</span>
                  )}
                </td>
                <td className="py-2 pr-3 font-medium max-w-[90px] truncate">
                  {r.label}
                </td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {r.dice.map((d, i) => (
                      <span
                        key={i}
                        className={`flex items-center gap-0.5 ${d.kept ? "" : "line-through opacity-40"}`}
                      >
                        <Image
                          src={`/diceIcon/${d.dieType}.svg`}
                          alt={d.dieType}
                          width={10}
                          height={10}
                          className="dark:invert"
                        />
                        {d.value}
                        {i < r.dice.length - 1 && (
                          <span className="text-neutral-400 ml-0.5">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2 pr-3 text-neutral-500 dark:text-neutral-400 max-w-[100px] truncate">
                  {r.modifierValue !== 0
                    ? `${r.modifierValue >= 0 ? "+" : ""}${r.modifierValue}`
                    : "—"}
                </td>
                <td className="py-2 pr-3 font-bold text-right tabular-nums">
                  {r.total}
                </td>
                <td className="py-2">
                  {r.config.dc !== undefined ? (
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                        r.passed
                          ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {r.passed ? "✓" : "✗"} {r.config.dc}
                    </span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
