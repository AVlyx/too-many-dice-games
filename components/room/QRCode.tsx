"use client";

import { QRCodeSVG } from "qrcode.react";

export function QRCode({ roomCode }: { roomCode: string }) {
  const url = `https://too-many-dice.com/join/${roomCode}`;
  return (
    <div className="p-4 bg-white rounded-xl inline-block">
      <QRCodeSVG value={url} size={180} />
    </div>
  );
}
