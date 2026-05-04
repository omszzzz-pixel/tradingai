"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  LineSeries,
  createSeriesMarkers,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";

type SeriesData = {
  agent_id: string;
  display_name: string;
  model: string;
  style: "scalp" | "swing";
  final_return: number;
  points: { time: number; value: number }[];
};

function colorAndStyle(agentId: string): { color: string; lineStyle: number } {
  const isSwing = agentId.endsWith("-swing");
  let color = "#6b7280";
  if (agentId.startsWith("sonnet")) color = "#c84a31";
  else if (agentId.startsWith("opus")) color = "#9333ea";
  else if (agentId.startsWith("gpt")) color = "#059669";
  else if (agentId.startsWith("gemini")) color = "#0ea5e9";
  return {
    color,
    lineStyle: isSwing ? LineStyle.Dashed : LineStyle.Solid,
  };
}

const LIGHT = {
  bg: "#ffffff",
  grid: "#f0f2f5",
  border: "#d8dde3",
  text: "#6b7280",
};
const DARK = {
  bg: "#161b22",
  grid: "#1c2230",
  border: "#232a36",
  text: "#9aa4b2",
};

export default function RaceChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const [data, setData] = useState<SeriesData[]>([]);
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

  const theme = useMemo(() => (isDark ? DARK : LIGHT), [isDark]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: theme.bg },
        textColor: theme.text,
        fontFamily:
          '"Pretendard Variable", Pretendard, -apple-system, system-ui, sans-serif',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: theme.border,
      },
      rightPriceScale: { borderColor: theme.border },
      crosshair: { mode: 1 },
    });
    chartRef.current = chart;
    seriesRef.current = [];
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = [];
    };
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/race?symbol=${symbol}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const j = (await res.json()) as { series: SeriesData[] };
        if (!cancelled) {
          setData(j.series ?? []);
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
  }, [symbol]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || data.length === 0) return;

    for (const s of seriesRef.current) {
      try {
        chart.removeSeries(s);
      } catch {}
    }
    seriesRef.current = [];

    for (const s of data) {
      const { color, lineStyle } = colorAndStyle(s.agent_id);
      const series = chart.addSeries(LineSeries, {
        color,
        lineStyle,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
      });
      series.setData(
        s.points.map((p) => ({ time: p.time as Time, value: p.value })),
      );

      const last = s.points[s.points.length - 1];
      if (last) {
        createSeriesMarkers(series, [
          {
            time: last.time as Time,
            position: "inBar",
            color,
            shape: "circle",
            text: s.display_name,
          },
        ]);
      }

      seriesRef.current.push(series);
    }

    chart.timeScale().fitContent();
  }, [data, theme]);

  return (
    <div className="relative flex-1 min-h-[280px]">
      <div ref={containerRef} className="absolute inset-0" />
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--fg-3)] text-[13px]">
          {err ? `차트 로드 실패: ${err}` : "차트 로딩…"}
        </div>
      )}
    </div>
  );
}
