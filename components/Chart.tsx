"use client";

import { useState } from "react";
import PriceChart, { type TF } from "./PriceChart";
import RaceChart from "./RaceChart";

const TIMEFRAMES: TF[] = ["1m", "5m", "15m", "1h", "4h"];

type View = "price" | "race";

export default function Chart({
  agentId,
  symbol,
}: {
  agentId: string;
  symbol: string;
}) {
  const [view, setView] = useState<View>("price");
  const [tf, setTf] = useState<TF>("5m");

  return (
    <div className="panel flex flex-col h-full min-h-0">
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-1 shrink-0 flex-wrap">
        <button
          onClick={() => setView("price")}
          className={`btn-tab ${view === "price" ? "active" : ""}`}
        >
          가격 차트
        </button>
        <button
          onClick={() => setView("race")}
          className={`btn-tab ${view === "race" ? "active" : ""}`}
        >
          AI 경쟁
        </button>

        {view === "price" && (
          <>
            <span className="w-px h-4 bg-[var(--border)] mx-1.5" />
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={`btn-tab ${tf === t ? "active" : ""}`}
              >
                {t}
              </button>
            ))}
          </>
        )}

        <div className="ml-auto text-[12px] text-[var(--fg-3)] pr-2">
          {view === "price" ? "진입 ▲▼ · 청산 ●" : "7일 누적 수익률"}
        </div>
      </div>

      {view === "price" ? (
        <PriceChart agentId={agentId} symbol={symbol} tf={tf} />
      ) : (
        <RaceChart symbol={symbol} />
      )}
    </div>
  );
}
