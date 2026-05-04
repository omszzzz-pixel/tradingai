"use client";

import { useEffect, useState } from "react";
import { symbolShort, fmtPrice } from "@/lib/symbols";

type Stats = {
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
};

const ENDPOINTS = [
  "https://data-api.binance.vision/api/v3/ticker/24hr",
  "https://api.binance.com/api/v3/ticker/24hr",
];

async function fetch24h(symbol: string): Promise<Stats> {
  let lastErr: unknown = null;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(`${url}?symbol=${symbol}`, { cache: "no-store" });
      if (!res.ok) {
        lastErr = new Error(`status ${res.status}`);
        continue;
      }
      const j = (await res.json()) as Record<string, string>;
      return {
        lastPrice: Number(j.lastPrice),
        priceChange: Number(j.priceChange),
        priceChangePercent: Number(j.priceChangePercent),
        highPrice: Number(j.highPrice),
        lowPrice: Number(j.lowPrice),
        volume: Number(j.volume),
        quoteVolume: Number(j.quoteVolume),
      };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("ticker fetch failed");
}

function fmt(n: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function fmtCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

export default function Ticker({ symbol }: { symbol: string }) {
  const short = symbolShort(symbol);
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await fetch24h(symbol);
        if (!cancelled) setS(next);
      } catch {}
    }
    load();
    const t = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [symbol]);

  const isUp = (s?.priceChangePercent ?? 0) >= 0;
  const cls = isUp ? "up" : "down";
  const arrow = isUp ? "▲" : "▼";

  return (
    <div className="panel mb-3">
      <div className="px-4 py-3 flex flex-wrap items-center gap-x-7 gap-y-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-[18px] font-bold">{short}/USDT</span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--up)] tracking-wide">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--up)] opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--up)]" />
            </span>
            LIVE
          </span>
          <span className="chip">5분 · Binance</span>
        </div>

        <div className="flex items-baseline gap-2.5">
          <span className={`num text-[28px] font-bold leading-none ${cls}`}>
            {s ? fmtPrice(s.lastPrice) : "—"}
          </span>
          {s && (
            <span className={`num text-[14px] font-semibold ${cls}`}>
              {arrow} {fmt(Math.abs(s.priceChangePercent), 2)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-x-6 gap-y-1.5 flex-wrap ml-auto">
          <Stat
            label="24h 변동"
            value={s ? `${isUp ? "+" : ""}${fmtPrice(s.priceChange)}` : "—"}
            cls={cls}
          />
          <Stat label="24h 고가" value={s ? fmtPrice(s.highPrice) : "—"} />
          <Stat label="24h 저가" value={s ? fmtPrice(s.lowPrice) : "—"} />
          <Stat
            label="24h 거래대금"
            value={s ? `${fmtCompact(s.quoteVolume)} USDT` : "—"}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  cls,
}: {
  label: string;
  value: string;
  cls?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[12px] text-[var(--fg-3)]">{label}</span>
      <span className={`num text-[14px] font-medium ${cls ?? ""}`}>
        {value}
      </span>
    </div>
  );
}
