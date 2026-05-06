"use client";

import { useEffect, useState } from "react";
import { fmtPrice, SYMBOLS } from "@/lib/symbols";

type Stat = { lastPrice: number; pct: number };

const ENDPOINTS = [
  "https://data-api.binance.vision/api/v3/ticker/24hr",
  "https://api.binance.com/api/v3/ticker/24hr",
];

async function fetchAll(): Promise<Record<string, Stat>> {
  const symbolsParam = JSON.stringify(SYMBOLS.map((s) => s.id));
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(
        `${url}?symbols=${encodeURIComponent(symbolsParam)}`,
        { cache: "no-store" },
      );
      if (!res.ok) continue;
      const arr = (await res.json()) as {
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
      }[];
      const out: Record<string, Stat> = {};
      for (const s of arr) {
        out[s.symbol] = {
          lastPrice: Number(s.lastPrice),
          pct: Number(s.priceChangePercent),
        };
      }
      return out;
    } catch {}
  }
  return {};
}

function Item({
  short,
  stat,
}: {
  short: string;
  stat: Stat | undefined;
}) {
  const isUp = (stat?.pct ?? 0) >= 0;
  const cls = isUp ? "up" : "down";
  const arrow = isUp ? "▲" : "▼";
  return (
    <div className="flex items-baseline gap-1.5 px-5 shrink-0">
      <span className="text-[12px] font-bold text-[var(--fg-2)]">{short}</span>
      <span className={`num text-[13px] font-semibold ${cls}`}>
        {stat ? fmtPrice(stat.lastPrice) : "—"}
      </span>
      {stat && (
        <span className={`num text-[11px] ${cls}`}>
          {arrow}
          {Math.abs(stat.pct).toFixed(2)}%
        </span>
      )}
    </div>
  );
}

export default function PriceChips() {
  const [stats, setStats] = useState<Record<string, Stat>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const next = await fetchAll();
      if (!cancelled) setStats(next);
    }
    load();
    const t = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // Repeat 4x to ensure seamless wrap regardless of viewport width
  const sequence = [...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS];

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-2)] py-1.5 overflow-hidden whitespace-nowrap">
      <div className="ticker-track">
        {sequence.map((c, i) => (
          <Item key={`${c.id}-${i}`} short={c.short} stat={stats[c.id]} />
        ))}
      </div>
    </div>
  );
}
