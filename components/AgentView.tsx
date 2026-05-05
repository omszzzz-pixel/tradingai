"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TradesPanel from "./TradesPanel";
import SymbolSwitcher from "./SymbolSwitcher";
import AgentLogo from "./AgentLogo";
import { DEFAULT_SYMBOL, type SymbolId } from "@/lib/symbols";

type Stats = {
  return_pct: number;
  win_rate: number;
  trades: number;
  balance: number;
};

function fmtKrw(n: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(n);
}

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
  const [symbol, setSymbol] = useState<SymbolId>(DEFAULT_SYMBOL);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((j: { rows: { id: string } & Stats[] }) => {
        const row = (j.rows as unknown as ({ id: string } & Stats)[]).find(
          (r) => r.id === agentId,
        );
        if (!cancelled && row) setStats(row);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const cls = (stats?.return_pct ?? 0) >= 0 ? "up" : "down";
  const sign = (stats?.return_pct ?? 0) >= 0 ? "+" : "";

  return (
    <div className="lg:h-full lg:overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-3 sm:px-4 py-4 pb-16 lg:pb-4">
      <div className="flex items-center gap-2 mb-3 text-[13px]">
        <Link href="/" className="text-[var(--fg-3)] hover:text-[var(--fg)]">
          ← 피드
        </Link>
        <span className="text-[var(--fg-3)]">/</span>
        <span className="font-semibold">AI 매매내역</span>
      </div>

      {/* Agent header card */}
      <div className="panel p-5 mb-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="rounded-full overflow-hidden shrink-0">
            <AgentLogo agentId={agentId} size={56} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-[20px] font-bold">{displayName}</h1>
              <span className="chip">{model}</span>
              <span className="chip">{style === "scalp" ? "단타" : "스윙"}</span>
            </div>
            <div className="text-[13px] text-[var(--fg-3)]">
              AI 트레이더 매매 기록 (페이퍼 트레이딩)
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-5 pt-4 border-t border-[var(--border)]">
            <Stat
              label="누적 수익률"
              value={`${sign}${stats.return_pct.toFixed(2)}%`}
              colorCls={cls}
            />
            <Stat label="잔고" value={`${fmtKrw(stats.balance)} KRW`} />
            <Stat label="승률" value={`${stats.win_rate.toFixed(1)}%`} />
            <Stat label="누적 매매" value={`${stats.trades}건`} />
          </div>
        )}
      </div>

      {/* Symbol filter */}
      <div className="mb-3">
        <SymbolSwitcher selected={symbol} onChange={setSymbol} />
      </div>

      {/* Trades panel — primary content */}
      <TradesPanel agentId={agentId} symbol={symbol} />

      <div className="text-[11px] text-[var(--fg-3)] mt-4 leading-relaxed">
        ※ 페이퍼 트레이딩 결과입니다. 매매 결정의 책임은 본인에게 있으며,
        본 사이트는 투자 추천이 아닌 관찰·교육 목적입니다.
      </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  colorCls,
}: {
  label: string;
  value: string;
  colorCls?: string;
}) {
  return (
    <div>
      <div className="text-[11px] text-[var(--fg-3)] mb-0.5">{label}</div>
      <div className={`num text-[15px] font-bold ${colorCls ?? ""}`}>
        {value}
      </div>
    </div>
  );
}
