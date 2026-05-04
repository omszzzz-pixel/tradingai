"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";

type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

const ENDPOINTS = [
  "https://data-api.binance.vision/api/v3/klines",
  "https://api.binance.com/api/v3/klines",
];

async function fetchBars(): Promise<Bar[]> {
  let lastErr: unknown = null;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(`${url}?symbol=BTCUSDT&interval=5m&limit=200`, {
        cache: "no-store",
      });
      if (!res.ok) {
        lastErr = new Error(`status ${res.status}`);
        continue;
      }
      const rows = (await res.json()) as unknown[][];
      return rows.map((r) => ({
        time: Number(r[0]),
        open: Number(r[1]),
        high: Number(r[2]),
        low: Number(r[3]),
        close: Number(r[4]),
      }));
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("fetch failed");
}

export default function Chart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [bars, setBars] = useState<Bar[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "#0e1217" },
        textColor: "#9aa4b2",
        fontFamily: "var(--font-mono), ui-monospace, monospace",
      },
      grid: {
        vertLines: { color: "#1c2230" },
        horzLines: { color: "#1c2230" },
      },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: "#232a36" },
      rightPriceScale: { borderColor: "#232a36" },
      crosshair: { mode: 1 },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#ff4d4f",
      downColor: "#2f80ed",
      wickUpColor: "#ff4d4f",
      wickDownColor: "#2f80ed",
      borderVisible: false,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await fetchBars();
        if (!cancelled) {
          setBars(next);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "error");
      }
    }
    load();
    const t = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || bars.length === 0) return;
    seriesRef.current.setData(
      bars.map((b) => ({
        time: (b.time / 1000) as Time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [bars]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[420px] w-full" />
      {bars.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--fg-3)]">
          {err ? `차트 로드 실패: ${err}` : "차트 로딩…"}
        </div>
      )}
    </div>
  );
}
