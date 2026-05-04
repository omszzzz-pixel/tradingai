"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";

type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type Marker = {
  time: number;
  action: "open_long" | "open_short" | "close";
  price: number;
};

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h"] as const;
type TF = (typeof TIMEFRAMES)[number];

const ENDPOINTS = [
  "https://data-api.binance.vision/api/v3/klines",
  "https://api.binance.com/api/v3/klines",
];

async function fetchBars(tf: TF): Promise<Bar[]> {
  let lastErr: unknown = null;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(`${url}?symbol=BTCUSDT&interval=${tf}&limit=200`, {
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

async function fetchMarkers(agentId: string): Promise<Marker[]> {
  const res = await fetch(`/api/markers?agent=${agentId}`, { cache: "no-store" });
  if (!res.ok) return [];
  const j = (await res.json()) as { markers: Marker[] };
  return j.markers ?? [];
}

const LIGHT = {
  bg: "#ffffff",
  grid: "#f0f2f5",
  border: "#d8dde3",
  text: "#6b7280",
  up: "#c84a31",
  down: "#1261c4",
};
const DARK = {
  bg: "#161b22",
  grid: "#1c2230",
  border: "#232a36",
  text: "#9aa4b2",
  up: "#ff5247",
  down: "#4a8df0",
};

export default function Chart({ agentId }: { agentId: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const [tf, setTf] = useState<TF>("5m");
  const [bars, setBars] = useState<Bar[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  const themeColors = useMemo(() => (isDark ? DARK : LIGHT), [isDark]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: themeColors.bg },
        textColor: themeColors.text,
        fontFamily:
          '"Pretendard Variable", Pretendard, -apple-system, system-ui, sans-serif',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: themeColors.grid },
        horzLines: { color: themeColors.grid },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: themeColors.border,
      },
      rightPriceScale: { borderColor: themeColors.border },
      crosshair: { mode: 1 },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: themeColors.up,
      downColor: themeColors.down,
      wickUpColor: themeColors.up,
      wickDownColor: themeColors.down,
      borderVisible: false,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, [themeColors]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [next, ms] = await Promise.all([fetchBars(tf), fetchMarkers(agentId)]);
        if (!cancelled) {
          setBars(next);
          setMarkers(ms);
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
  }, [tf, agentId]);

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

    const minBarTime = bars[0]?.time ?? 0;
    const seriesMarkers: SeriesMarker<Time>[] = markers
      .filter((m) => m.time * 1000 >= minBarTime)
      .map((m) => {
        if (m.action === "open_long") {
          return {
            time: m.time as Time,
            position: "belowBar",
            color: themeColors.up,
            shape: "arrowUp",
            text: `매수 ${m.price.toFixed(0)}`,
          };
        }
        if (m.action === "open_short") {
          return {
            time: m.time as Time,
            position: "aboveBar",
            color: themeColors.down,
            shape: "arrowDown",
            text: `매도 ${m.price.toFixed(0)}`,
          };
        }
        return {
          time: m.time as Time,
          position: "inBar",
          color: themeColors.text,
          shape: "circle",
          text: `청산 ${m.price.toFixed(0)}`,
        };
      });
    markersRef.current?.setMarkers(seriesMarkers);

    chartRef.current?.timeScale().fitContent();
  }, [bars, markers, themeColors]);

  return (
    <div className="panel">
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-1">
        {TIMEFRAMES.map((t) => (
          <button
            key={t}
            onClick={() => setTf(t)}
            className={`btn-tab ${tf === t ? "active" : ""}`}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto text-[12px] text-[var(--fg-3)] pr-2">
          진입 ▲▼ · 청산 ●
        </div>
      </div>
      <div className="relative">
        <div ref={containerRef} className="h-[440px] lg:h-[480px] w-full" />
        {bars.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--fg-3)] text-[13px]">
            {err ? `차트 로드 실패: ${err}` : "차트 로딩…"}
          </div>
        )}
      </div>
    </div>
  );
}
