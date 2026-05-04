"use client";

import { useEffect, useState, Fragment } from "react";

type TradeRow = {
  id: string;
  symbol: string;
  side: "long" | "short";
  entry_price: number;
  exit_price: number | null;
  size: number;
  opened_at: string;
  closed_at: string | null;
  pnl: number | null;
  pnl_pct: number | null;
  reasoning: string | null;
};

type ApiResponse = {
  agent: { id: string; display_name: string; balance: number };
  trades: TradeRow[];
  paywall: { unlocked: boolean; delayMin: number };
};

function fmtKrw(n: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number): string {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(2)}%`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(/\./g, "/")
    .replace(/\/\s/g, "/")
    .replace(/\/$/, "");
}

function relTime(iso: string): string {
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return `${Math.floor(diff / (86400 * 7))}주 전`;
}

export default function TradesPanel({ agentId }: { agentId: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/trades?agent=${agentId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const j = (await res.json()) as ApiResponse;
        if (!cancelled) setData(j);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "error");
      }
    }
    load();
    const t = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [agentId]);

  if (err)
    return (
      <div className="panel p-5 text-[var(--down)] text-[14px]">
        에러: {err}
      </div>
    );
  if (!data)
    return (
      <div className="panel p-5 text-[var(--fg-3)] text-[14px]">로딩…</div>
    );

  const totalPnl = data.trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const winCount = data.trades.filter((t) => (t.pnl ?? 0) > 0).length;
  const winRate =
    data.trades.length > 0
      ? ((winCount / data.trades.length) * 100).toFixed(1)
      : "—";

  return (
    <div className="panel">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-[15px] font-bold">{data.agent.display_name}</div>
          {!data.paywall.unlocked && (
            <div className="chip whitespace-nowrap">
              무료 · {data.paywall.delayMin}분 지연 · 근거 숨김
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2.5">
          <Kpi label="잔고" value={`${fmtKrw(data.agent.balance)} KRW`} />
          <Kpi
            label="누적 손익"
            value={`${totalPnl >= 0 ? "+" : ""}${fmtKrw(totalPnl)}`}
            cls={totalPnl >= 0 ? "up" : "down"}
          />
          <Kpi label="승률" value={winRate !== "—" ? `${winRate}%` : "—"} />
          <Kpi label="매매" value={`${data.trades.length}건`} />
        </div>
      </div>

      <div className="overflow-x-auto max-h-[520px]">
        <table className="tbl num">
          <thead>
            <tr>
              <th>시간</th>
              <th>방향</th>
              <th>진입가</th>
              <th>청산가</th>
              <th>수량</th>
              <th>손익(KRW)</th>
              <th>수익률</th>
              {data.paywall.unlocked && <th className="!text-left">근거</th>}
            </tr>
          </thead>
          <tbody>
            {data.trades.length === 0 && (
              <tr>
                <td
                  colSpan={data.paywall.unlocked ? 8 : 7}
                  className="text-center py-12 text-[var(--fg-3)] text-[13px]"
                >
                  아직 매매내역이 없습니다.
                </td>
              </tr>
            )}
            {data.trades.map((t) => {
              const pnl = t.pnl ?? 0;
              const pct = t.pnl_pct ?? 0;
              const cls = pnl >= 0 ? "up" : "down";
              const isOpen = openRow === t.id;
              const clickable = data.paywall.unlocked && !!t.reasoning;
              return (
                <Fragment key={t.id}>
                  <tr
                    className={clickable ? "cursor-pointer" : ""}
                    onClick={() =>
                      clickable ? setOpenRow(isOpen ? null : t.id) : null
                    }
                  >
                    <td className="text-[var(--fg-2)]">
                      {t.closed_at ? (
                        <>
                          <div className="text-[12px] font-medium text-[var(--fg)]">
                            {relTime(t.closed_at)}
                          </div>
                          <div className="text-[10px] text-[var(--fg-3)]">
                            {fmtTime(t.closed_at)}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`font-semibold ${t.side === "long" ? "up" : "down"}`}>
                      {t.side === "long" ? "매수" : "매도"}
                    </td>
                    <td>{t.entry_price.toFixed(2)}</td>
                    <td>{t.exit_price?.toFixed(2) ?? "—"}</td>
                    <td className="text-[var(--fg-2)]">{t.size.toFixed(4)}</td>
                    <td className={`font-medium ${cls}`}>
                      {pnl >= 0 ? "+" : ""}
                      {fmtKrw(pnl)}
                    </td>
                    <td className={`font-semibold ${cls}`}>{fmtPct(pct)}</td>
                    {data.paywall.unlocked && (
                      <td className="!text-left max-w-[260px] truncate text-[12px] text-[var(--fg-2)]">
                        {t.reasoning ? (
                          <>
                            {isOpen ? "▼" : "▶"} {t.reasoning.slice(0, 36)}…
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                  </tr>
                  {isOpen && t.reasoning && (
                    <tr>
                      <td
                        colSpan={8}
                        className="!text-left bg-[var(--bg-soft)] text-[13px] text-[var(--fg-2)] leading-relaxed py-3 px-5"
                      >
                        {t.reasoning}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  cls,
}: {
  label: string;
  value: string;
  cls?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[12px] text-[var(--fg-3)]">{label}</span>
      <span className={`num text-[14px] font-semibold ${cls ?? ""}`}>
        {value}
      </span>
    </div>
  );
}
