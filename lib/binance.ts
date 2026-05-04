import type { Candle } from "./types";

const REST = "https://api.binance.com/api/v3";

export async function fetchKlines(
  symbol: string,
  interval: string,
  limit = 200,
): Promise<Candle[]> {
  const url = `${REST}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`binance klines ${res.status}`);
  const rows = (await res.json()) as unknown[][];
  return rows.map((r) => ({
    openTime: Number(r[0]),
    open: Number(r[1]),
    high: Number(r[2]),
    low: Number(r[3]),
    close: Number(r[4]),
    volume: Number(r[5]),
    closeTime: Number(r[6]),
  }));
}

export async function fetchKlinesRange(
  symbol: string,
  interval: string,
  startTime: number,
  endTime: number,
): Promise<Candle[]> {
  const out: Candle[] = [];
  let cursor = startTime;
  const limit = 1000;
  while (cursor < endTime) {
    const url = `${REST}/klines?symbol=${symbol}&interval=${interval}&startTime=${cursor}&endTime=${endTime}&limit=${limit}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`binance klines range ${res.status}`);
    const rows = (await res.json()) as unknown[][];
    if (rows.length === 0) break;
    for (const r of rows) {
      out.push({
        openTime: Number(r[0]),
        open: Number(r[1]),
        high: Number(r[2]),
        low: Number(r[3]),
        close: Number(r[4]),
        volume: Number(r[5]),
        closeTime: Number(r[6]),
      });
    }
    const last = out[out.length - 1];
    cursor = last.closeTime + 1;
    if (rows.length < limit) break;
  }
  return out;
}

export async function fetchPrice(symbol: string): Promise<number> {
  const res = await fetch(`${REST}/ticker/price?symbol=${symbol}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`binance price ${res.status}`);
  const j = (await res.json()) as { price: string };
  return Number(j.price);
}
