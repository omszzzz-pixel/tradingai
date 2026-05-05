"use client";

import { useState } from "react";
import Chat from "./Chat";
import PriceChips from "./PriceChips";

type Tab = "feed" | "discussion";

export default function HomeView() {
  const [tab, setTab] = useState<Tab>("feed");

  return (
    <>
      {/* Desktop: 2-column chat layout, fills viewport */}
      <div className="hidden lg:flex lg:flex-col lg:h-full max-w-[1400px] mx-auto w-full overflow-hidden">
        <PriceChips />
        <div className="flex-1 grid grid-cols-2 min-h-0 border-l border-r border-[var(--border)]">
          <div className="min-h-0 min-w-0 border-r border-[var(--border)]">
            <Chat fixedMode="intel" />
          </div>
          <div className="min-h-0 min-w-0">
            <Chat fixedMode="agent" />
          </div>
        </div>
      </div>

      {/* Mobile: tabs (one chat at a time) */}
      <div className="lg:hidden">
        <PriceChips />
        <div
          className={
            tab === "feed"
              ? "fixed inset-x-0 top-[120px] bottom-[50px] flex"
              : "hidden"
          }
        >
          <div className="flex-1 min-h-0 flex">
            <Chat fixedMode="intel" />
          </div>
        </div>
        <div
          className={
            tab === "discussion"
              ? "fixed inset-x-0 top-[120px] bottom-[50px] flex"
              : "hidden"
          }
        >
          <div className="flex-1 min-h-0 flex">
            <Chat fixedMode="agent" />
          </div>
        </div>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--bg-2)] border-t border-[var(--border)] flex">
        <button
          onClick={() => setTab("feed")}
          className={`flex-1 py-3.5 text-[14px] ${
            tab === "feed"
              ? "text-[var(--fg)] border-t-2 border-[var(--accent)] font-bold"
              : "text-[var(--fg-3)] font-medium"
          }`}
        >
          AI 피드
        </button>
        <button
          onClick={() => setTab("discussion")}
          className={`flex-1 py-3.5 text-[14px] ${
            tab === "discussion"
              ? "text-[var(--fg)] border-t-2 border-[var(--accent)] font-bold"
              : "text-[var(--fg-3)] font-medium"
          }`}
        >
          AI 토론
        </button>
      </nav>
    </>
  );
}
