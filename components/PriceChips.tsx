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

  return (
    <div className="flex items-center gap-x-6 gap-y-1.5 flex-wrap px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-2)] overflow-x-auto">
      {SYMBOLS.map((c) => {
        const s = stats[c.id];
        const isUp = (s?.pct ?? 0) >= 0;
        const cls = isUp ? "up" : "down";
        const arrow = isUp ? "▲" : "▼";
        return (
          <div key={c.id} className="flex items-baseline gap-1.5 shrink-0">
            <span className="text-[13px] font-bold">{c.short}</span>
            <span className={`num text-[14px] font-semibold ${cls}`}>
              {s ? fmtPrice(s.lastPrice) : "—"}
            </span>
            {s && (
              <span className={`num text-[11px] font-medium ${cls}`}>
                {arrow} {Math.abs(s.pct).toFixed(2)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
