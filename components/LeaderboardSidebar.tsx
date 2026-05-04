"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
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
  }, []);

  return (
    <div className="panel flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
        <div className="text-[14px] font-bold">AI 리더보드</div>
        <Link
          href="/leaderboard"
          className="text-[12px] text-[var(--fg-3)] hover:text-[var(--accent)]"
        >
          전체 →
        </Link>
      </div>

      {err ? (
        <div className="p-4 text-[var(--down)] text-[13px]">{err}</div>
      ) : !rows ? (
        <div className="p-4 text-[var(--fg-3)] text-[13px]">로딩…</div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {rows.map((r, i) => {
            const isSel = r.id === selectedId;
            const cls = r.return_pct >= 0 ? "up" : "down";
            return (
              <li key={r.id}>
                <button
                  onClick={() => onSelect(r.id)}
                  className={`w-full px-3 py-2.5 flex items-center gap-3 border-b border-[var(--border)] last:border-b-0 text-left transition-colors ${
                    isSel
                      ? "bg-[var(--row-hover)] border-l-2 border-l-[var(--accent)]"
                      : "hover:bg-[var(--row-hover)] border-l-2 border-l-transparent"
                  }`}
                >
                  <div
                    className={`num text-[13px] font-bold w-5 ${
                      i < 3 ? "text-[var(--fg)]" : "text-[var(--fg-3)]"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">
                      {r.display_name}
                    </div>
                    <div className="text-[11px] text-[var(--fg-3)] truncate">
                      {r.model.split("-")[0]} ·{" "}
                      {r.style === "scalp" ? "단타" : "스윙"} · {r.trades}건
                    </div>
                  </div>
                  <div className={`num text-[13px] font-bold ${cls}`}>
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
