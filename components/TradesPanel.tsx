"use client";

import { useEffect, useState } from "react";

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

export default function TradesPanel({ agentId }: { agentId: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);

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
      <div className="panel p-4 text-[var(--down)] text-[12px]">에러: {err}</div>
    );
  if (!data)
    return (
      <div className="panel p-4 text-[var(--fg-3)] text-[12px]">로딩…</div>
    );

  const totalPnl = data.trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const winCount = data.trades.filter((t) => (t.pnl ?? 0) > 0).length;
  const winRate =
    data.trades.length > 0
      ? ((winCount / data.trades.length) * 100).toFixed(1)
      : "—";

  return (
    <div className="panel">
      <div className="px-3 py-2.5 border-b border-[var(--border)] flex items-center flex-wrap gap-x-5 gap-y-1">
        <div className="text-[13px] font-semibold">{data.agent.display_name}</div>

        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--fg-3)]">잔고</span>
          <span className="num text-[12px] font-medium">
            {fmtKrw(data.agent.balance)} KRW
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--fg-3)]">누적 손익</span>
          <span
            className={`num text-[12px] font-medium ${totalPnl >= 0 ? "up" : "down"}`}
          >
            {totalPnl >= 0 ? "+" : ""}
            {fmtKrw(totalPnl)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--fg-3)]">승률</span>
          <span className="num text-[12px] font-medium">
            {winRate}{winRate !== "—" ? "%" : ""}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--fg-3)]">매매</span>
          <span className="num text-[12px] font-medium">
            {data.trades.length}건
          </span>
        </div>

        {!data.paywall.unlocked && (
          <div className="ml-auto chip">
            무료 · {data.paywall.delayMin}분 지연 · 근거 숨김
          </div>
        )}
      </div>

      <div className="overflow-x-auto max-h-[460px]">
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
                  className="text-center py-10 text-[var(--fg-3)]"
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
              return (
                <>
                  <tr
                    key={t.id}
                    className={
                      data.paywall.unlocked && t.reasoning
                        ? "cursor-pointer"
                        : ""
                    }
                    onClick={() =>
                      data.paywall.unlocked && t.reasoning
                        ? setOpenRow(isOpen ? null : t.id)
                        : null
                    }
                  >
                    <td className="text-[var(--fg-2)]">
                      {t.closed_at ? fmtTime(t.closed_at) : "—"}
                    </td>
                    <td className={t.side === "long" ? "up" : "down"}>
                      {t.side === "long" ? "매수" : "매도"}
                    </td>
                    <td>{t.entry_price.toFixed(2)}</td>
                    <td>{t.exit_price?.toFixed(2) ?? "—"}</td>
                    <td className="text-[var(--fg-2)]">{t.size.toFixed(4)}</td>
                    <td className={cls}>
                      {pnl >= 0 ? "+" : ""}
                      {fmtKrw(pnl)}
                    </td>
                    <td className={cls}>{fmtPct(pct)}</td>
                    {data.paywall.unlocked && (
                      <td className="!text-left max-w-[280px] truncate text-[11px] text-[var(--fg-2)]">
                        {t.reasoning ? (
                          <>
                            {isOpen ? "▼" : "▶"} {t.reasoning.slice(0, 40)}…
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                  </tr>
                  {isOpen && t.reasoning && (
                    <tr key={t.id + "-r"}>
                      <td
                        colSpan={8}
                        className="!text-left bg-[var(--bg-soft)] text-[11px] text-[var(--fg-2)] leading-relaxed py-2 px-4"
                      >
                        {t.reasoning}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
