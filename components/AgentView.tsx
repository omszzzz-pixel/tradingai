"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AgentLogo from "./AgentLogo";

type Stats = {
  accuracy: number;
  stance_count: number;
  correct_count: number;
};

type StanceRow = {
  id: string;
  stance: "long" | "short" | "neutral";
  symbol: string | null;
  correct: boolean | null;
  pct_change: number | null;
  evaluated_at: string;
  body: string;
  created_at: string;
  intel_headline: string | null;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${hh}:${mm}`;
}

function stanceLabel(s: StanceRow["stance"]): { text: string; cls: string } {
  if (s === "long") return { text: "▲ 롱", cls: "up" };
  if (s === "short") return { text: "▼ 숏", cls: "down" };
  return { text: "● 관망", cls: "" };
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [stances, setStances] = useState<StanceRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((j: { rows: ({ id: string } & Stats)[] }) => {
        const row = j.rows.find((r) => r.id === agentId);
        if (!cancelled && row) setStats(row);
      })
      .catch(() => {});
    fetch(`/api/agents/${agentId}/stances`)
      .then((r) => r.json())
      .then((j: { rows: StanceRow[] }) => {
        if (!cancelled) setStances(j.rows);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const accCls = stats
    ? stats.accuracy >= 60
      ? "up"
      : stats.accuracy >= 50
        ? ""
        : "down"
    : "";

  return (
    <div className="lg:h-full lg:overflow-y-auto">
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 py-4 pb-16 lg:pb-4">
        <div className="flex items-center gap-2 mb-3 text-[13px]">
          <Link href="/" className="text-[var(--fg-3)] hover:text-[var(--fg)]">
            ← 피드
          </Link>
          <span className="text-[var(--fg-3)]">/</span>
          <span className="font-semibold">AI 분석 이력</span>
        </div>

        <div className="panel p-5 mb-4">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="rounded-full overflow-hidden shrink-0">
              <AgentLogo agentId={agentId} size={56} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-[20px] font-bold">{displayName}</h1>
                <span className="chip">{model}</span>
                <span className="chip">
                  {style === "scalp" ? "단타" : "스윙"}
                </span>
              </div>
              <div className="text-[13px] text-[var(--fg-3)]">
                각 이슈에 대한 스탠스 정확도 (실제 가격 변동 기준)
              </div>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 mt-5 pt-4 border-t border-[var(--border)]">
              <Stat
                label="정확도"
                value={`${stats.accuracy.toFixed(1)}%`}
                colorCls={accCls}
              />
              <Stat label="총 분석" value={`${stats.stance_count}건`} />
              <Stat label="적중" value={`${stats.correct_count}건`} />
            </div>
          )}
        </div>

        <div className="panel">
          <div className="px-4 py-3 border-b border-[var(--border)] text-[15px] font-bold">
            최근 스탠스
          </div>
          {stances === null && (
            <div className="p-5 text-[var(--fg-3)] text-[13px]">로딩…</div>
          )}
          {stances && stances.length === 0 && (
            <div className="p-8 text-center text-[var(--fg-3)] text-[13px]">
              데이터 없음
            </div>
          )}
          {stances && stances.length > 0 && (
            <div className="divide-y divide-[var(--border)]">
              {stances.map((s) => {
                const { text, cls } = stanceLabel(s.stance);
                const correctText =
                  s.correct === true
                    ? "적중"
                    : s.correct === false
                      ? "실패"
                      : "—";
                const correctCls =
                  s.correct === true
                    ? "up"
                    : s.correct === false
                      ? "down"
                      : "text-[var(--fg-3)]";
                const pct = s.pct_change ?? null;
                return (
                  <div key={s.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[12px] text-[var(--fg-3)] mb-1">
                      {s.symbol && <span className="chip">{s.symbol}</span>}
                      <span className="num">{fmtDate(s.created_at)}</span>
                      <span className={`ml-auto font-bold ${correctCls}`}>
                        {correctText}
                        {pct !== null && (
                          <span className="ml-1 num text-[11px] font-medium">
                            ({pct >= 0 ? "+" : ""}
                            {pct.toFixed(2)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    {s.intel_headline && (
                      <div className="text-[12px] text-[var(--fg-3)] mb-1 truncate">
                        {s.intel_headline}
                      </div>
                    )}
                    <div className="text-[14px] leading-snug whitespace-pre-line">
                      <span className={`font-bold ${cls} mr-1.5`}>{text}</span>
                      {s.body.replace(/^[▲▼●]\s*(롱 우위|숏 우위|관망)\s*\/?\s*/, "")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-[11px] text-[var(--fg-3)] mt-4 leading-relaxed">
          ※ AI의 스탠스는 분석 의견이며, 투자 추천이 아닙니다. 본 사이트는
          관찰·교육 목적입니다.
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
