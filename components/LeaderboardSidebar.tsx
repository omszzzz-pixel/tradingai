"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AgentLogo from "./AgentLogo";

type Row = {
  id: string;
  display_name: string;
  model: string;
  style: "scalp" | "swing";
  is_active: boolean;
  return_pct: number;
  win_rate: number;
  trades: number;
};

function fmtPct(n: number): string {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(2)}%`;
}

export default function LeaderboardSidebar({
  selectedId,
  onSelect,
  symbol,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  symbol: string;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    async function load() {
      try {
        const res = await fetch(`/api/leaderboard?symbol=${symbol}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const j = (await res.json()) as { rows: Row[] };
        if (!cancelled) setRows(j.rows);
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

  return (
    <div className="panel flex flex-col h-full min-h-0">
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="text-[13px] font-bold">AI 리더보드</div>
        <Link
          href="/leaderboard"
          className="text-[11px] text-[var(--fg-3)] hover:text-[var(--accent)]"
        >
          전체 →
        </Link>
      </div>

      {err ? (
        <div className="p-3 text-[var(--down)] text-[12px]">{err}</div>
      ) : !rows ? (
        <div className="p-3 text-[var(--fg-3)] text-[12px]">로딩…</div>
      ) : (
        <ul className="flex-1 flex flex-col min-h-0">
          {rows.map((r, i) => {
            const isSel = r.id === selectedId;
            const cls = r.return_pct >= 0 ? "up" : "down";
            return (
              <li key={r.id} className="flex-1 min-h-0 flex">
                <button
                  onClick={() => onSelect(r.id)}
                  className={`w-full px-2.5 flex items-center gap-2 border-b border-[var(--border)] last:border-b-0 text-left transition-colors ${
                    isSel
                      ? "bg-[var(--row-hover)] border-l-2 border-l-[var(--accent)]"
                      : "hover:bg-[var(--row-hover)] border-l-2 border-l-transparent"
                  }`}
                >
                  <div
                    className={`num text-[12px] font-bold w-4 shrink-0 ${
                      i < 3 ? "text-[var(--fg)]" : "text-[var(--fg-3)]"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="shrink-0">
                    <AgentLogo agentId={r.id} size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate leading-tight">
                      {r.display_name}
                    </div>
                    <div className="text-[10px] text-[var(--fg-3)] truncate leading-tight">
                      {r.style === "scalp" ? "단타" : "스윙"} · {r.trades}건
                    </div>
                  </div>
                  <div className={`num text-[12px] font-bold ${cls}`}>
                    {fmtPct(r.return_pct)}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
