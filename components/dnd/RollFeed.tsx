"use client";

import type { ActiveRequest, RollResult } from "@/engine/dnd/types";
import { RollResultCard } from "./RollResultCard";

interface RollFeedProps {
  recentResults: RollResult[];
  activeRequests: ActiveRequest[];
  playerNames: Record<string, string>;
}

export function RollFeed({ recentResults, activeRequests, playerNames }: RollFeedProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        Live Feed
      </h2>

      {/* Pending requests */}
      {activeRequests.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {activeRequests.map((req) => (
            <div
              key={req.id}
              className="border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-2.5 flex items-center gap-2"
            >
              <span className="animate-pulse text-base">⏳</span>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{req.config.label || "Roll Request"}</div>
                <div className="text-xs text-neutral-400 truncate">
                  Waiting on {playerNames[req.playerId] ?? req.playerId}…
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {recentResults.length === 0 && activeRequests.length === 0 ? (
        <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-8">
          No rolls yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {recentResults.slice(0, 8).map((r) => (
            <RollResultCard key={r.id} result={r} compact />
          ))}
        </div>
      )}
    </div>
  );
}
