"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  display_name: string;
  model: string;
  style: "scalp" | "swing";
  is_active: boolean;
  balance: number;
  total_pnl: number;
  return_pct: number;
  win_rate: number;
  trades: number;
  mdd: number;
  sharpe: number;
};

type Filter = "all" | "scalp" | "swing";

function fmtKrw(n: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(n);
}
function fmtPct(n: number): string {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(2)}%`;
}

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

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

  if (err) return <div className="panel p-5 text-[var(--down)]">{err}</div>;
  if (!rows) return <div className="panel p-5 text-[var(--fg-3)]">로딩…</div>;

  const filtered = rows.filter((r) =>
    filter === "all" ? true : r.style === filter,
  );

  return (
    <div className="panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="text-[15px] font-bold">AI 리더보드</div>
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

      <div className="overflow-x-auto">
        <table className="tbl num">
          <thead>
            <tr>
              <th className="!text-left">#</th>
              <th className="!text-left">에이전트</th>
              <th>수익률</th>
              <th>잔고(KRW)</th>
              <th>승률</th>
              <th>매매</th>
              <th>MDD</th>
              <th>샤프</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-12 text-[var(--fg-3)] text-[13px]"
                >
                  데이터 없음
                </td>
              </tr>
            )}
            {filtered.map((r, i) => {
              const cls = r.return_pct >= 0 ? "up" : "down";
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
                        <span className={r.style === "scalp" ? "" : ""}>
                          {r.style === "scalp" ? "단타" : "스윙"}
                        </span>
                        {!r.is_active && " · 시드 데이터"}
                      </div>
                    </Link>
                  </td>
                  <td className={`font-bold ${cls}`}>{fmtPct(r.return_pct)}</td>
                  <td>{fmtKrw(r.balance)}</td>
                  <td>{r.win_rate.toFixed(1)}%</td>
                  <td>{r.trades}건</td>
                  <td className="text-[var(--fg-2)]">−{r.mdd.toFixed(2)}%</td>
                  <td className="text-[var(--fg-2)]">
                    {r.sharpe.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
