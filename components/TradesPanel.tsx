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

export default function TradesPanel({ agentId }: { agentId: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  if (err) return <div className="p-4 text-[var(--down)]">에러: {err}</div>;
  if (!data) return <div className="p-4 text-[var(--fg-3)]">로딩…</div>;

  return (
    <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <div className="text-[15px] font-medium">{data.agent.display_name}</div>
          <div className="text-[12px] text-[var(--fg-3)]">
            잔고 <span className="num">{fmtKrw(data.agent.balance)}</span> KRW
          </div>
        </div>
        {!data.paywall.unlocked && (
          <div className="text-[11px] text-[var(--accent)] num">
            무료: {data.paywall.delayMin}분 지연 · 근거 숨김
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="num text-[12px]">
          <thead>
            <tr>
              <th>시간</th>
              <th>종목</th>
              <th>방향</th>
              <th>진입가</th>
              <th>청산가</th>
              <th>수량</th>
              <th>손익</th>
              <th>%</th>
              {data.paywall.unlocked && <th className="!text-left">판단 근거</th>}
            </tr>
          </thead>
          <tbody>
            {data.trades.length === 0 && (
              <tr>
                <td
                  colSpan={data.paywall.unlocked ? 9 : 8}
                  className="text-center py-8 text-[var(--fg-3)]"
                >
                  아직 매매내역이 없습니다.
                </td>
              </tr>
            )}
            {data.trades.map((t) => {
              const pnl = t.pnl ?? 0;
              const pct = t.pnl_pct ?? 0;
              const cls = pnl >= 0 ? "up" : "down";
              return (
                <tr key={t.id}>
                  <td>
                    {t.closed_at
                      ? new Date(t.closed_at).toLocaleString("ko-KR", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td>{t.symbol}</td>
                  <td className={t.side === "long" ? "up" : "down"}>
                    {t.side === "long" ? "롱" : "숏"}
                  </td>
                  <td>{t.entry_price.toFixed(2)}</td>
                  <td>{t.exit_price?.toFixed(2) ?? "-"}</td>
                  <td>{t.size.toFixed(4)}</td>
                  <td className={cls}>{fmtKrw(pnl)}</td>
                  <td className={cls}>{fmtPct(pct)}</td>
                  {data.paywall.unlocked && (
                    <td className="!text-left max-w-[420px] truncate font-sans">
                      {t.reasoning ?? "-"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
