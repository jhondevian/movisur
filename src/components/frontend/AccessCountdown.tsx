"use client";

import { useEffect, useState } from "react";

function formatRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();

  if (diff <= 0) return "Vencido";

  const totalMinutes = Math.floor(diff / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function AccessCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(() => formatRemaining(expiresAt));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining(formatRemaining(expiresAt));
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [expiresAt]);

  return <span>{remaining}</span>;
}
