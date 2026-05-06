"use client";

import { useEffect, useState } from "react";
import { fmtPrice, SYMBOLS } from "@/lib/symbols";

type Stat = { lastPrice: number; pct: number };

type Extras = {
  fearGreed?: { value: number; label: string };
  btcDominance?: number;
  kimchiPct?: number;
};

const BINANCE_ENDPOINTS = [
  "https://data-api.binance.vision/api/v3/ticker/24hr",
  "https://api.binance.com/api/v3/ticker/24hr",
];

async function fetchBinance(): Promise<Record<string, Stat>> {
  const symbolsParam = JSON.stringify(SYMBOLS.map((s) => s.id));
  for (const url of BINANCE_ENDPOINTS) {
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

async function fetchFearGreed(): Promise<Extras["fearGreed"] | undefined> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    const j = (await res.json()) as {
      data: { value: string; value_classification: string }[];
    };
    const item = j.data?.[0];
    if (!item) return undefined;
    const labelMap: Record<string, string> = {
      "Extreme Fear": "극도공포",
      "Fear": "공포",
      "Neutral": "중립",
      "Greed": "탐욕",
      "Extreme Greed": "극도탐욕",
    };
    return {
      value: Number(item.value),
      label: labelMap[item.value_classification] ?? item.value_classification,
    };
  } catch {
    return undefined;
  }
}

async function fetchBtcDominance(): Promise<number | undefined> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", {
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    const j = (await res.json()) as {
      data: { market_cap_percentage: { btc: number } };
    };
    return j.data?.market_cap_percentage?.btc;
  } catch {
    return undefined;
  }
}

async function fetchKimchi(
  binanceBtc: number | undefined,
): Promise<number | undefined> {
  if (!binanceBtc) return undefined;
  try {
    const res = await fetch(
      "https://api.upbit.com/v1/ticker?markets=KRW-BTC,KRW-USDT",
      { cache: "no-store" },
    );
    if (!res.ok) return undefined;
    const arr = (await res.json()) as {
      market: string;
      trade_price: number;
    }[];
    const upbitBtc = arr.find((x) => x.market === "KRW-BTC")?.trade_price;
    const upbitUsdt = arr.find((x) => x.market === "KRW-USDT")?.trade_price;
    if (!upbitBtc || !upbitUsdt) return undefined;
    const fairKrw = binanceBtc * upbitUsdt;
    return ((upbitBtc - fairKrw) / fairKrw) * 100;
  } catch {
    return undefined;
  }
}

function CoinItem({
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

function fearGreedCls(v: number): string {
  if (v <= 25) return "down";
  if (v <= 45) return "down";
  if (v >= 75) return "up";
  if (v >= 55) return "up";
  return "text-[var(--fg-2)]";
}

function ExtraItem({
  label,
  value,
  cls,
  hint,
}: {
  label: string;
  value: string;
  cls?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5 px-5 shrink-0">
      <span className="text-[12px] font-bold text-[var(--fg-2)]">{label}</span>
      <span className={`num text-[13px] font-semibold ${cls ?? ""}`}>
        {value}
      </span>
      {hint && (
        <span className="text-[11px] text-[var(--fg-3)]">{hint}</span>
      )}
    </div>
  );
}

function renderSequence(
  stats: Record<string, Stat>,
  extras: Extras,
  keyPrefix: string,
) {
  const nodes: React.ReactNode[] = [];
  for (const c of SYMBOLS) {
    nodes.push(
      <CoinItem key={`${keyPrefix}-${c.id}`} short={c.short} stat={stats[c.id]} />,
    );
  }
  if (extras.fearGreed) {
    nodes.push(
      <ExtraItem
        key={`${keyPrefix}-fg`}
        label="공포지수"
        value={String(extras.fearGreed.value)}
        cls={fearGreedCls(extras.fearGreed.value)}
        hint={extras.fearGreed.label}
      />,
    );
  }
  if (typeof extras.btcDominance === "number") {
    nodes.push(
      <ExtraItem
        key={`${keyPrefix}-btcd`}
        label="BTC.D"
        value={`${extras.btcDominance.toFixed(2)}%`}
      />,
    );
  }
  if (typeof extras.kimchiPct === "number") {
    const k = extras.kimchiPct;
    const cls = k >= 0 ? "up" : "down";
    const sign = k >= 0 ? "+" : "";
    nodes.push(
      <ExtraItem
        key={`${keyPrefix}-kimchi`}
        label="김프"
        value={`${sign}${k.toFixed(2)}%`}
        cls={cls}
      />,
    );
  }
  return nodes;
}

export default function PriceChips() {
  const [stats, setStats] = useState<Record<string, Stat>>({});
  const [extras, setExtras] = useState<Extras>({});

  useEffect(() => {
    let cancelled = false;
    async function loadCoins() {
      const next = await fetchBinance();
      if (!cancelled) setStats(next);
    }
    async function loadExtras() {
      // 공포지수: 하루 1번 갱신이라 자주 폴링 불필요
      const [fg, btcd] = await Promise.all([
        fetchFearGreed(),
        fetchBtcDominance(),
      ]);
      if (!cancelled) {
        setExtras((prev) => ({
          ...prev,
          fearGreed: fg ?? prev.fearGreed,
          btcDominance: btcd ?? prev.btcDominance,
        }));
      }
    }
    loadCoins();
    loadExtras();
    const tCoin = setInterval(loadCoins, 10_000);
    const tExtras = setInterval(loadExtras, 60_000);
    return () => {
      cancelled = true;
      clearInterval(tCoin);
      clearInterval(tExtras);
    };
  }, []);

  // 김프는 binance BTC 가격에 의존하므로 stats 변경 시 재계산
  useEffect(() => {
    let cancelled = false;
    async function loadKimchi() {
      const btc = stats["BTCUSDT"]?.lastPrice;
      const k = await fetchKimchi(btc);
      if (!cancelled) {
        setExtras((prev) => ({ ...prev, kimchiPct: k ?? prev.kimchiPct }));
      }
    }
    loadKimchi();
    const t = setInterval(loadKimchi, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [stats]);

  // Repeat 2x for seamless wrap
  const seq1 = renderSequence(stats, extras, "a");
  const seq2 = renderSequence(stats, extras, "b");

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-2)] py-1.5">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="overflow-hidden whitespace-nowrap">
          <div className="ticker-track">
            {seq1}
            {seq2}
          </div>
        </div>
      </div>
    </div>
  );
}
