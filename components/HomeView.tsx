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
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4 pb-20 lg:pb-4">
        <div className={`${tab === "chat" ? "hidden lg:block" : "block"}`}>
          <SymbolSwitcher selected={symbol} onChange={setSymbol} />
          <Ticker symbol={symbol} />
          <ActivityTicker symbol={symbol} />
        </div>

        <div className="lg:grid lg:grid-cols-[3fr_1fr] lg:gap-3">
          <div className={`${tab === "chat" ? "hidden lg:block" : "block"}`}>
            <Chart agentId={selectedId} symbol={symbol} />
          </div>
          <div
            className={`${
              tab === "chat" ? "hidden lg:block" : "block"
            } mt-3 lg:mt-0`}
          >
            <LeaderboardSidebar
              selectedId={selectedId}
              onSelect={setSelectedId}
              symbol={symbol}
            />
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[3fr_1fr] lg:gap-3 mt-3">
          <div className={`${tab === "chat" ? "hidden lg:block" : "block"}`}>
            <TradesPanel agentId={selectedId} symbol={symbol} />
          </div>
          <div
            className={`${
              tab === "chat" ? "block" : "hidden lg:block"
            } mt-3 lg:mt-0`}
          >
            <Chat />
          </div>
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
