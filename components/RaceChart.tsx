"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  LineSeries,
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

function modelInfo(agentId: string): {
  color: string;
  lineStyle: number;
  initial: string;
} {
  const isSwing = agentId.endsWith("-swing");
  const lineStyle = isSwing ? LineStyle.Dashed : LineStyle.Solid;
  let color = "#6b7280";
  let initial = "?";
  if (agentId.startsWith("sonnet")) {
    color = "#c84a31";
    initial = "S";
  } else if (agentId.startsWith("opus")) {
    color = "#9333ea";
    initial = "O";
  } else if (agentId.startsWith("gpt")) {
    color = "#059669";
    initial = "5";
  } else if (agentId.startsWith("gemini")) {
    color = "#0ea5e9";
    initial = "G";
  }
  return { color, lineStyle, initial };
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

type Label = {
  agent_id: string;
  name: string;
  color: string;
  initial: string;
  x: number;
  y: number;
  origY: number;
};

export default function RaceChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<{ id: string; series: ISeriesApi<"Line"> }[]>([]);
  const [data, setData] = useState<SeriesData[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
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

  // Create chart (recreate on theme change)
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
        rightOffset: 18,
      },
      rightPriceScale: {
        borderColor: theme.border,
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
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

  // Load data
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

  // Render series + label tracking
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || data.length === 0) return;

    for (const { series } of seriesRef.current) {
      try {
        chart.removeSeries(series);
      } catch {}
    }
    seriesRef.current = [];

    for (const s of data) {
      const m = modelInfo(s.agent_id);
      const series = chart.addSeries(LineSeries, {
        color: m.color,
        lineStyle: m.lineStyle,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
      });
      series.setData(
        s.points.map((p) => ({ time: p.time as Time, value: p.value })),
      );
      seriesRef.current.push({ id: s.agent_id, series });
    }

    chart.timeScale().fitContent();

    const computeLabels = () => {
      const c = chartRef.current;
      const ct = containerRef.current;
      if (!c || !ct) return;
      const containerHeight = ct.clientHeight;
      const items: Label[] = [];
      for (const { id, series } of seriesRef.current) {
        const sd = data.find((d) => d.agent_id === id);
        if (!sd) continue;
        const last = sd.points[sd.points.length - 1];
        if (!last) continue;
        const x = c.timeScale().timeToCoordinate(last.time as Time);
        const y = series.priceToCoordinate(last.value);
        if (x === null || y === null) continue;
        const m = modelInfo(id);
        items.push({
          agent_id: id,
          name: sd.display_name,
          color: m.color,
          initial: m.initial,
          x: Number(x),
          y: Number(y),
          origY: Number(y),
        });
      }
      items.sort((a, b) => a.origY - b.origY);
      const minGap = 18;
      const top = 10;
      const bottom = containerHeight - 10;
      for (let i = 0; i < items.length; i++) {
        if (i === 0) {
          items[i].y = Math.max(top, items[i].y);
        } else {
          items[i].y = Math.max(items[i].y, items[i - 1].y + minGap);
        }
      }
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].y > bottom) items[i].y = bottom;
        if (i < items.length - 1 && items[i].y + minGap > items[i + 1].y) {
          items[i].y = items[i + 1].y - minGap;
        }
      }
      setLabels(items);
    };

    let raf = requestAnimationFrame(computeLabels);

    const ts = chart.timeScale();
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(computeLabels);
    };
    ts.subscribeVisibleTimeRangeChange(onChange);

    let ro: ResizeObserver | null = null;
    if (containerRef.current) {
      ro = new ResizeObserver(onChange);
      ro.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(raf);
      try {
        ts.unsubscribeVisibleTimeRangeChange(onChange);
      } catch {}
      ro?.disconnect();
    };
  }, [data, theme]);

  return (
    <div className="relative flex-1 min-h-[280px]">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {labels.map((l) => (
          <div
            key={l.agent_id}
            className="absolute flex items-center gap-1.5 -translate-y-1/2"
            style={{ left: l.x + 4, top: l.y }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{
                background: l.color,
                boxShadow: `0 0 0 2px ${theme.bg}`,
              }}
            >
              {l.initial}
            </div>
            <span
              className="text-[10px] font-bold whitespace-nowrap px-1 py-px rounded leading-tight"
              style={{
                color: l.color,
                background: isDark
                  ? "rgba(22, 27, 34, 0.85)"
                  : "rgba(255, 255, 255, 0.85)",
              }}
            >
              {l.name}
            </span>
          </div>
        ))}
      </div>
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--fg-3)] text-[13px]">
          {err ? `차트 로드 실패: ${err}` : "차트 로딩…"}
        </div>
      )}
    </div>
  );
}
