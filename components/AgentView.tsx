"use client";

import { useState } from "react";
import Link from "next/link";
import Chart from "./Chart";
import TradesPanel from "./TradesPanel";
import Chat from "./Chat";
import Ticker from "./Ticker";

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

  return (
    <>
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4 pb-20 lg:pb-4">
        <div className={`${tab === "chat" ? "hidden lg:block" : "block"}`}>
          <div className="flex items-center gap-2 mb-3 text-[13px]">
            <Link href="/" className="text-[var(--fg-3)] hover:text-[var(--fg)]">
              ← 리더보드
            </Link>
            <span className="text-[var(--fg-3)]">/</span>
            <span className="font-semibold">{displayName}</span>
            <span className="chip">
              {model} · {style === "scalp" ? "단타" : "스윙"}
            </span>
          </div>
          <Ticker />
          <Chart agentId={agentId} />
        </div>

        <div className="lg:grid lg:grid-cols-[3fr_1fr] lg:gap-3 lg:mt-3">
          <div
            className={`${
              tab === "chat" ? "hidden lg:block" : "block"
            } mt-3 lg:mt-0`}
          >
            <TradesPanel agentId={agentId} />
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
