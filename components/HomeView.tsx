"use client";

import { useState } from "react";
import Chart from "./Chart";
import TradesPanel from "./TradesPanel";
import Chat from "./Chat";

type Tab = "main" | "chat";

export default function HomeView({ agentId }: { agentId: string }) {
  const [tab, setTab] = useState<Tab>("main");

  return (
    <>
      <div className="max-w-[1400px] mx-auto px-4 py-4 pb-20 lg:pb-4">
        <section
          className={`${
            tab === "chat" ? "hidden lg:block" : "block"
          } bg-[var(--bg-2)] border border-[var(--border)] rounded`}
        >
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <div className="text-[14px] font-medium">BTC/USDT</div>
              <div className="text-[11px] text-[var(--fg-3)]">
                Binance · 진입(↑↓) / 청산(○) 마커 표시
              </div>
            </div>
          </div>
          <Chart agentId={agentId} />
        </section>

        <div className="lg:grid lg:grid-cols-[3fr_1fr] lg:gap-4 lg:mt-4">
          <div
            className={`${
              tab === "chat" ? "hidden lg:block" : "block"
            } mt-4 lg:mt-0`}
          >
            <TradesPanel agentId={agentId} />
          </div>
          <div
            className={`${
              tab === "chat" ? "block" : "hidden lg:block"
            } mt-4 lg:mt-0`}
          >
            <Chat />
          </div>
        </div>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--bg-2)] border-t border-[var(--border)] flex">
        <button
          onClick={() => setTab("main")}
          className={`flex-1 py-3 text-[13px] ${
            tab === "main"
              ? "text-[var(--fg)] border-t-2 border-[var(--accent)]"
              : "text-[var(--fg-3)]"
          }`}
        >
          홈
        </button>
        <button
          onClick={() => setTab("chat")}
          className={`flex-1 py-3 text-[13px] ${
            tab === "chat"
              ? "text-[var(--fg)] border-t-2 border-[var(--accent)]"
              : "text-[var(--fg-3)]"
          }`}
        >
          채팅
        </button>
      </nav>
    </>
  );
}
