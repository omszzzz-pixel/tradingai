"use client";

import { useState } from "react";
import Link from "next/link";
import Chart from "./Chart";
import TradesPanel from "./TradesPanel";
import Chat from "./Chat";
import Ticker from "./Ticker";
import ActivityTicker from "./ActivityTicker";
import SymbolSwitcher from "./SymbolSwitcher";
import { DEFAULT_SYMBOL, type SymbolId } from "@/lib/symbols";

type Tab = "main" | "chat";

export default function AgentView({
  agentId,
  displayName,
  model,
  style,
}: {
  agentId: string;
  displayName: string;
  model: string;
  style: "scalp" | "swing";
}) {
  const [tab, setTab] = useState<Tab>("main");
  const [symbol, setSymbol] = useState<SymbolId>(DEFAULT_SYMBOL);

  const breadcrumb = (
    <div className="flex items-center gap-2 text-[13px] shrink-0">
      <Link href="/" className="text-[var(--fg-3)] hover:text-[var(--fg)]">
        ← 리더보드
      </Link>
      <span className="text-[var(--fg-3)]">/</span>
      <span className="font-semibold">{displayName}</span>
      <span className="chip">
        {model} · {style === "scalp" ? "단타" : "스윙"}
      </span>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex lg:flex-col lg:h-full max-w-[1400px] mx-auto w-full px-4 py-3 gap-3 overflow-hidden">
        {breadcrumb}
        <div className="shrink-0">
          <SymbolSwitcher selected={symbol} onChange={setSymbol} />
        </div>
        <div className="shrink-0 -mt-3">
          <Ticker symbol={symbol} />
          <ActivityTicker symbol={symbol} />
        </div>
        <div className="flex-1 grid grid-cols-[3fr_1fr] grid-rows-[3fr_2fr] gap-3 min-h-0">
          <div className="min-h-0 min-w-0">
            <Chart agentId={agentId} symbol={symbol} />
          </div>
          <div className="min-h-0 min-w-0 row-span-2">
            <Chat />
          </div>
          <div className="min-h-0 min-w-0">
            <TradesPanel agentId={agentId} symbol={symbol} />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden max-w-[1400px] mx-auto px-3 sm:px-4 py-4 pb-20">
        <div className={`${tab === "chat" ? "hidden" : "block"}`}>
          {breadcrumb}
          <div className="mt-3">
            <SymbolSwitcher selected={symbol} onChange={setSymbol} />
          </div>
          <Ticker symbol={symbol} />
          <ActivityTicker symbol={symbol} />
          <Chart agentId={agentId} symbol={symbol} />
          <div className="mt-3">
            <TradesPanel agentId={agentId} symbol={symbol} />
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
