"use client";

import { DndGame } from "@/components/dnd/DndGame";

export default function DndPage() {
  return (
    <main className="flex-1 flex flex-col">
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <DndGame />
      </div>
    </main>
  );
}
