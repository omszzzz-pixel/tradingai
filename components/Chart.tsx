"use client";

import { useEffect, useRef } from "react";
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

export default function Chart({ bars }: { bars: Bar[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

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
    if (!seriesRef.current) return;
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

  return <div ref={containerRef} className="h-[420px] w-full" />;
}
