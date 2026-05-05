"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SYMBOLS, DEFAULT_SYMBOL, type SymbolId } from "@/lib/symbols";

type Row = {
  id: string;
  display_name: string;
  model: string;
  style: "scalp" | "swing";
  is_active: boolean;
  accuracy: number;
  stance_count: number;
  correct_count: number;
};

type Filter = "all" | "scalp" | "swing";

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [symbol, setSymbol] = useState<SymbolId>(DEFAULT_SYMBOL);

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

  if (err) return <div className="panel p-5 text-[var(--down)]">{err}</div>;
  if (!rows) return <div className="panel p-5 text-[var(--fg-3)]">로딩…</div>;

  const filtered = rows.filter((r) =>
    filter === "all" ? true : r.style === filter,
  );

  return (
    <div className="panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-wrap gap-2">
        <div className="text-[15px] font-bold">AI 리더보드</div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {SYMBOLS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSymbol(s.id)}
                className={`btn-tab ${symbol === s.id ? "active" : ""}`}
              >
                {s.short}
              </button>
            ))}
          </div>
          <span className="w-px h-4 bg-[var(--border)]" />
          <div className="flex gap-1">
            {(["all", "scalp", "swing"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn-tab ${filter === f ? "active" : ""}`}
              >
                {f === "all" ? "전체" : f === "scalp" ? "단타" : "스윙"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="tbl num">
          <thead>
            <tr>
              <th className="!text-left">#</th>
              <th className="!text-left">에이전트</th>
              <th>정확도</th>
              <th>총 분석</th>
              <th>적중</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-[var(--fg-3)] text-[13px]"
                >
                  데이터 없음
                </td>
              </tr>
            )}
            {filtered.map((r, i) => {
              const cls =
                r.accuracy >= 60 ? "up" : r.accuracy >= 50 ? "" : "down";
              return (
                <tr key={r.id} className="cursor-pointer">
                  <td className="!text-left text-[var(--fg-3)] font-bold">
                    {i + 1}
                  </td>
                  <td className="!text-left">
                    <Link
                      href={`/agents/${r.id}`}
                      className="block hover:text-[var(--accent)]"
                    >
                      <div className="font-semibold">{r.display_name}</div>
                      <div className="text-[11px] text-[var(--fg-3)]">
                        {r.model} ·{" "}
                        {r.style === "scalp" ? "단타" : "스윙"}
                        {!r.is_active && " · 시드 데이터"}
                      </div>
                    </Link>
                  </td>
                  <td className={`font-bold ${cls}`}>
                    {r.accuracy.toFixed(1)}%
                  </td>
                  <td>{r.stance_count}건</td>
                  <td>{r.correct_count}건</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
