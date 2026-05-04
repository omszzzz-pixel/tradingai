"use client";

import { useEffect, useState } from "react";

type Item = {
  time: string;
  agent: string;
  text: string;
  cls: "up" | "down" | "neutral";
};

function relTime(iso: string): string {
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function ActivityTicker({ symbol }: { symbol?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setItems([]);
    setIdx(0);
    async function load() {
      try {
        const url = symbol
          ? `/api/activity?symbol=${symbol}`
          : "/api/activity";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as { items: Item[] };
        if (!cancelled) setItems(j.items ?? []);
      } catch {}
    }
    load();
    const t = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [symbol]);

  useEffect(() => {
    if (items.length === 0) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 4000);
    return () => clearInterval(t);
  }, [items.length]);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  if (items.length === 0) return null;
  const item = items[idx];

  return (
    <div className="panel mb-3 overflow-hidden">
      <div className="px-3 py-2 flex items-center gap-2 text-[12px]">
        <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--accent)] uppercase shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]" />
          </span>
          최근 활동
        </span>
        <span className="font-semibold shrink-0">🤖 {item.agent}</span>
        <span
          className={
            item.cls === "up"
              ? "up font-medium truncate flex-1"
              : item.cls === "down"
              ? "down font-medium truncate flex-1"
              : "text-[var(--fg-2)] truncate flex-1"
          }
        >
          {item.text}
        </span>
        <span className="num text-[11px] text-[var(--fg-3)] shrink-0 font-medium">
          ({relTime(item.time)})
        </span>
      </div>
    </div>
  );
}
