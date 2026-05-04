"use client";

import { useEffect, useState } from "react";
import Chart from "./Chart";
import TradesPanel from "./TradesPanel";
import Chat from "./Chat";
import Ticker from "./Ticker";
import LeaderboardSidebar from "./LeaderboardSidebar";
import ActivityTicker from "./ActivityTicker";
import SymbolSwitcher from "./SymbolSwitcher";
import { DEFAULT_SYMBOL, type SymbolId } from "@/lib/symbols";

type Tab = "main" | "chat";

export default function HomeView() {
  const [tab, setTab] = useState<Tab>("main");
  const [selectedId, setSelectedId] = useState<string>("sonnet-scalp");
  const [symbol, setSymbol] = useState<SymbolId>(DEFAULT_SYMBOL);

  useEffect(() => {
    let cancelled = false;
    async function loadDefault() {
      try {
        const res = await fetch(`/api/leaderboard?symbol=${symbol}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const j = (await res.json()) as { rows: { id: string }[] };
        if (!cancelled && j.rows && j.rows.length > 0) {
          setSelectedId(j.rows[0].id);
        }
      } catch {}
    }
    loadDefault();
  }, [symbol]);

  return (
    <>
      {/* Desktop: 100vh fixed layout, no page scroll */}
      <div className="hidden lg:flex lg:flex-col lg:h-full max-w-[1400px] mx-auto w-full px-4 py-3 gap-3 overflow-hidden">
        <div className="shrink-0">
          <SymbolSwitcher selected={symbol} onChange={setSymbol} />
        </div>
        <div className="shrink-0 -mt-3">
          <Ticker symbol={symbol} />
          <ActivityTicker symbol={symbol} />
        </div>
        <div className="flex-1 grid grid-cols-[1fr_340px] grid-rows-[2fr_3fr] gap-3 min-h-0">
          <div className="min-h-0 min-w-0">
            <Chart agentId={selectedId} symbol={symbol} />
          </div>
          <div className="min-h-0 min-w-0">
            <LeaderboardSidebar
              selectedId={selectedId}
              onSelect={setSelectedId}
              symbol={symbol}
            />
          </div>
          <div className="min-h-0 min-w-0">
            <TradesPanel agentId={selectedId} symbol={symbol} />
          </div>
          <div className="min-h-0 min-w-0">
            <Chat />
          </div>
        </div>
      </div>

      {/* Mobile: page scroll, tab nav */}
      <div className="lg:hidden max-w-[1400px] mx-auto px-3 sm:px-4 py-4 pb-20">
        <div className={`${tab === "chat" ? "hidden" : "block"}`}>
          <SymbolSwitcher selected={symbol} onChange={setSymbol} />
          <Ticker symbol={symbol} />
          <ActivityTicker symbol={symbol} />
          <Chart agentId={selectedId} symbol={symbol} />
          <div className="mt-3">
            <LeaderboardSidebar
              selectedId={selectedId}
              onSelect={setSelectedId}
              symbol={symbol}
            />
          </div>
          <div className="mt-3">
            <TradesPanel agentId={selectedId} symbol={symbol} />
          </div>
        </div>
        <div className={`${tab === "chat" ? "block" : "hidden"}`}>
          <Chat />
        </div>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--bg-2)] border-t border-[var(--border)] flex">
        <button
          onClick={() => setTab("main")}
          className={`flex-1 py-3.5 text-[14px] ${
            tab === "main"
              ? "text-[var(--fg)] border-t-2 border-[var(--accent)] font-bold"
              : "text-[var(--fg-3)] font-medium"
          }`}
        >
          홈
        </button>
        <button
          onClick={() => setTab("chat")}
          className={`flex-1 py-3.5 text-[14px] ${
            tab === "chat"
              ? "text-[var(--fg)] border-t-2 border-[var(--accent)] font-bold"
              : "text-[var(--fg-3)] font-medium"
          }`}
        >
          채팅
        </button>
      </nav>
    </>
  );
}
