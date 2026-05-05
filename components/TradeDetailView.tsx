"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AgentLogo, { agentIdFromName } from "./AgentLogo";
import { fmtPrice, symbolShort } from "@/lib/symbols";

type Trade = {
  id: string;
  agent_id: string;
  symbol: string;
  side: "long" | "short";
  entry_price: number;
  exit_price: number;
  size: number;
  opened_at: string;
  closed_at: string;
  pnl: number;
  pnl_pct: number;
};

type Agent = {
  id: string;
  display_name: string;
  model: string;
  style: "scalp" | "swing";
};

type TfRow = {
  tf: string;
  rsi: number;
  macd: "up" | "down" | "flat";
  ema: "up" | "down" | "flat";
  trend: "buy" | "sell" | "neutral";
};

type Snapshot = {
  orderbook: {
    asks: { price: number; qty: number }[];
    bids: { price: number; qty: number }[];
  };
  fundingRate: number;
  funding24h: number[];
  oiChange: number;
  volBuy: number;
  volSell: number;
  matrix: TfRow[];
};

type RelatedTrade = {
  id: string;
  agent_id: string;
  symbol: string;
  side: "long" | "short";
  entry_price: number;
  exit_price: number;
  pnl_pct: number;
  closed_at: string;
};

type DetailResponse = {
  trade: Trade;
  agent: Agent;
  open_reasoning: string | null;
  close_reasoning: string | null;
  snapshot: Snapshot;
  other_agents: { agent_id: string; choice: string; reason: string }[];
  prev: RelatedTrade | null;
  next: RelatedTrade | null;
  related: {
    sameAgent: RelatedTrade[];
    sameSymbol: RelatedTrade[];
    all: RelatedTrade[];
  };
};

function fmtKrw(n: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(n);
}

function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(iso))
    .replace(/\./g, "/")
    .replace(/\/\s/g, " ")
    .replace(/\/$/, "");
}

function diffMin(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 60_000,
  );
}

function relTime(iso: string): string {
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return `${Math.floor(diff / (86400 * 7))}주 전`;
}

export default function TradeDetailView({ id }: { id: string }) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [relatedTab, setRelatedTab] = useState<"sameAgent" | "sameSymbol" | "all">(
    "sameAgent",
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/trades/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const j = (await res.json()) as DetailResponse;
        if (!cancelled) setData(j);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "error");
      }
    }
    load();
    window.scrollTo(0, 0);
  }, [id]);

  if (err)
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-6">
        <div className="panel p-6 text-[var(--down)]">{err}</div>
      </div>
    );
  if (!data)
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-6">
        <div className="panel p-6 text-[var(--fg-3)]">로딩…</div>
      </div>
    );

  const { trade, agent, open_reasoning, close_reasoning, snapshot, other_agents } =
    data;
  const sym = symbolShort(trade.symbol);
  const sideKr = trade.side === "long" ? "롱" : "숏";
  const cls = trade.pnl >= 0 ? "up" : "down";
  const sign = trade.pnl_pct >= 0 ? "+" : "";
  const holdMin = diffMin(trade.opened_at, trade.closed_at);

  const orderbookMaxQty = Math.max(
    ...snapshot.orderbook.asks.map((a) => a.qty),
    ...snapshot.orderbook.bids.map((b) => b.qty),
  );

  return (
    <div className="lg:h-full lg:overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-3 sm:px-4 py-4 pb-12">
      {/* Breadcrumb + prev/next */}
      <div className="flex items-center justify-between gap-3 mb-3 text-[13px] flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-[var(--fg-3)] hover:text-[var(--fg)]">
            ← 리더보드
          </Link>
          <span className="text-[var(--fg-3)]">/</span>
          <span className="font-semibold">매매 상세</span>
        </div>
        <div className="flex items-center gap-1.5">
          {data.prev ? (
            <Link
              href={`/trades/${data.prev.id}`}
              className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded border border-[var(--border)] hover:bg-[var(--bg-3)] text-[var(--fg-2)]"
            >
              ← 이전
              <span
                className={`num text-[11px] ${data.prev.pnl_pct >= 0 ? "up" : "down"}`}
              >
                {data.prev.pnl_pct >= 0 ? "+" : ""}
                {data.prev.pnl_pct.toFixed(2)}%
              </span>
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded border border-[var(--border)] text-[var(--fg-3)] opacity-50">
              ← 이전
            </span>
          )}
          {data.next ? (
            <Link
              href={`/trades/${data.next.id}`}
              className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded border border-[var(--border)] hover:bg-[var(--bg-3)] text-[var(--fg-2)]"
            >
              <span
                className={`num text-[11px] ${data.next.pnl_pct >= 0 ? "up" : "down"}`}
              >
                {data.next.pnl_pct >= 0 ? "+" : ""}
                {data.next.pnl_pct.toFixed(2)}%
              </span>
              다음 →
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded border border-[var(--border)] text-[var(--fg-3)] opacity-50">
              다음 →
            </span>
          )}
        </div>
      </div>

      {/* Header card */}
      <div className="panel p-5 mb-3">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="rounded-full overflow-hidden shrink-0">
            <AgentLogo agentId={trade.agent_id} size={48} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/agents/${trade.agent_id}`}
                className="text-[18px] font-bold hover:text-[var(--accent)]"
              >
                {agent.display_name}
              </Link>
              <span className="chip">{sym}/USDT</span>
              <span className={`chip ${trade.side === "long" ? "up" : "down"} font-bold`}>
                {sideKr}
              </span>
            </div>
            <div className="text-[12px] text-[var(--fg-3)]">
              {agent.model} · {agent.style === "scalp" ? "단타" : "스윙"} · 보유 {holdMin}분
            </div>
          </div>
          <div className="text-right">
            <div className={`num text-[28px] font-bold leading-none ${cls}`}>
              {sign}{trade.pnl_pct.toFixed(2)}%
            </div>
            <div className={`num text-[13px] mt-1 ${cls}`}>
              {trade.pnl >= 0 ? "+" : ""}{fmtKrw(trade.pnl)} KRW
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-5 pt-4 border-t border-[var(--border)]">
          <Stat label="진입 시각" value={fmtTime(trade.opened_at)} />
          <Stat
            label="진입가"
            value={fmtPrice(trade.entry_price)}
            sub="USDT"
            colorCls="text-emerald-500"
          />
          <Stat label="청산 시각" value={fmtTime(trade.closed_at)} />
          <Stat
            label="청산가"
            value={fmtPrice(trade.exit_price)}
            sub="USDT"
            colorCls="text-amber-500"
          />
        </div>
      </div>

      {/* Reasoning side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="panel p-4">
          <div className="text-[11px] font-bold text-emerald-500 mb-2">
            ◆ 진입 근거
          </div>
          <div className="text-[13px] leading-relaxed">
            {open_reasoning ?? "—"}
          </div>
        </div>
        <div className="panel p-4">
          <div className="text-[11px] font-bold text-amber-500 mb-2">
            ◆ 청산 근거
          </div>
          <div className="text-[13px] leading-relaxed">
            {close_reasoning ?? "—"}
          </div>
        </div>
      </div>

      {/* Snapshot — entry context */}
      <div className="text-[14px] font-bold mb-2 mt-5 flex items-center gap-2">
        <span className="text-emerald-500">◆</span>
        진입 시점 시장 상황
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Order book */}
        <div className="panel p-4">
          <div className="text-[12px] font-semibold text-[var(--fg-2)] mb-2">
            호가창 스냅샷
          </div>
          <div className="space-y-0.5 num text-[12px]">
            {snapshot.orderbook.asks.map((a, i) => (
              <OrderBookRow
                key={`a${i}`}
                price={a.price}
                qty={a.qty}
                max={orderbookMaxQty}
                side="ask"
              />
            ))}
            <div className="flex items-center gap-2 py-1.5 my-1 border-y border-[var(--border)]">
              <span className="text-[10px] text-[var(--fg-3)] uppercase">
                현재가
              </span>
              <span className="num font-bold text-[14px]">
                {fmtPrice(trade.entry_price)}
              </span>
            </div>
            {snapshot.orderbook.bids.map((b, i) => (
              <OrderBookRow
                key={`b${i}`}
                price={b.price}
                qty={b.qty}
                max={orderbookMaxQty}
                side="bid"
              />
            ))}
          </div>
        </div>

        {/* Funding + OI */}
        <div className="grid gap-3">
          <div className="panel p-4">
            <div className="text-[12px] font-semibold text-[var(--fg-2)] mb-2">
              펀딩비 (8h 기준)
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`num text-[24px] font-bold ${snapshot.fundingRate < 0 ? "down" : "up"}`}
              >
                {(snapshot.fundingRate * 100).toFixed(4)}%
              </span>
              <span className="text-[11px] text-[var(--fg-3)]">
                {snapshot.fundingRate < 0 ? "롱 우호" : "숏 우호"}
              </span>
            </div>
            <div className="flex items-end gap-0.5 h-10 mt-3">
              {snapshot.funding24h.map((v, i) => {
                const min = Math.min(...snapshot.funding24h);
                const max = Math.max(...snapshot.funding24h);
                const range = Math.max(0.0001, max - min);
                const h = ((v - min) / range) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${Math.max(8, h)}%`,
                      background: v < 0 ? "var(--down)" : "var(--up)",
                      opacity: 0.5 + (i / snapshot.funding24h.length) * 0.5,
                    }}
                  />
                );
              })}
            </div>
            <div className="text-[10px] text-[var(--fg-3)] mt-1">
              직전 24h 추이 (8h 단위)
            </div>
          </div>

          <div className="panel p-4">
            <div className="text-[12px] font-semibold text-[var(--fg-2)] mb-2">
              미결제약정 (1h 변화)
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`num text-[24px] font-bold ${snapshot.oiChange >= 0 ? "up" : "down"}`}
              >
                {snapshot.oiChange >= 0 ? "+" : ""}
                {snapshot.oiChange.toFixed(2)}%
              </span>
              <span className="text-[11px] text-[var(--fg-3)]">
                {snapshot.oiChange >= 0
                  ? "포지션 증가 (추세 강화)"
                  : "포지션 감소 (청산 증가)"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-TF matrix + volume */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 mb-3">
        <div className="panel p-4">
          <div className="text-[12px] font-semibold text-[var(--fg-2)] mb-2">
            다중 타임프레임 동조성
          </div>
          <table className="tbl num">
            <thead>
              <tr>
                <th className="!text-left">TF</th>
                <th>RSI</th>
                <th>MACD</th>
                <th>EMA20</th>
                <th>추세</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.matrix.map((m) => (
                <tr key={m.tf}>
                  <td className="!text-left font-bold">{m.tf}</td>
                  <td>
                    <span
                      className={
                        m.rsi < 35 ? "down" : m.rsi > 65 ? "up" : ""
                      }
                    >
                      {m.rsi}
                    </span>
                  </td>
                  <td>
                    {m.macd === "up" ? "↑" : m.macd === "down" ? "↓" : "—"}
                  </td>
                  <td>
                    {m.ema === "up" ? "↑" : m.ema === "down" ? "↓" : "—"}
                  </td>
                  <td
                    className={
                      m.trend === "buy"
                        ? "up font-semibold"
                        : m.trend === "sell"
                          ? "down font-semibold"
                          : "text-[var(--fg-3)]"
                    }
                  >
                    {m.trend === "buy"
                      ? "매수"
                      : m.trend === "sell"
                        ? "매도"
                        : "중립"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel p-4">
          <div className="text-[12px] font-semibold text-[var(--fg-2)] mb-3">
            거래량 비율 (직전 5봉)
          </div>
          <div className="space-y-2.5">
            <VolBar label="매수세" value={snapshot.volBuy} max={Math.max(snapshot.volBuy, snapshot.volSell)} cls="up" />
            <VolBar label="매도세" value={snapshot.volSell} max={Math.max(snapshot.volBuy, snapshot.volSell)} cls="down" />
          </div>
          <div className="text-[10px] text-[var(--fg-3)] mt-3">
            평균 대비 배수 (1.0 = 평균)
          </div>
        </div>
      </div>

      {/* AI comparison */}
      {other_agents.length > 0 && (
        <div className="panel p-4 mb-3">
          <div className="text-[14px] font-bold mb-3 flex items-center gap-2">
            <span className="text-[var(--accent)]">◆</span>
            같은 시점 다른 AI 결정
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {other_agents.map((a) => (
              <div
                key={a.agent_id}
                className="flex items-start gap-2 py-1.5 border-l-2 border-[var(--border)] pl-3"
              >
                <div className="rounded-full overflow-hidden shrink-0 mt-0.5">
                  <AgentLogo agentId={a.agent_id} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold">
                    {a.agent_id}
                  </div>
                  <div
                    className={`text-[11px] ${a.choice.includes("롱") ? "up" : a.choice.includes("숏") ? "down" : "text-[var(--fg-3)]"} font-medium`}
                  >
                    {a.choice}
                  </div>
                  <div className="text-[11px] text-[var(--fg-2)] mt-0.5 line-clamp-2">
                    {a.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other trades */}
      <div className="text-[14px] font-bold mb-2 mt-6 flex items-center gap-2">
        <span className="text-[var(--accent)]">◆</span>
        다른 매매 둘러보기
      </div>
      <div className="panel">
        <div className="flex items-center px-2 py-1 border-b border-[var(--border)]">
          {(
            [
              { id: "sameAgent", label: `${agent.display_name}` },
              { id: "sameSymbol", label: `${sym}/USDT` },
              { id: "all", label: "전체 최근" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setRelatedTab(t.id)}
              className={`btn-tab ${relatedTab === t.id ? "active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-3">
          {data.related[relatedTab].length === 0 ? (
            <div className="text-center py-8 text-[var(--fg-3)] text-[12px]">
              매매 없음
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {data.related[relatedTab].map((r) => (
                <RelatedCard key={r.id} t={r} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer note */}
      <div className="text-[11px] text-[var(--fg-3)] mt-4 leading-relaxed">
        ※ 본 페이지는 청산 완료된 페이퍼 트레이딩의 사후 분석입니다. 시장 데이터(호가창,
        펀딩비, OI 등)는 진입 시점 스냅샷으로, 현재 시장과 무관합니다. 투자 추천이
        아니며 학습/관찰 목적입니다.
      </div>
      </div>
    </div>
  );
}

function RelatedCard({ t }: { t: RelatedTrade }) {
  const sym = symbolShort(t.symbol);
  const sideKr = t.side === "long" ? "롱" : "숏";
  const sign = t.pnl_pct >= 0 ? "+" : "";
  const cls = t.pnl_pct >= 0 ? "up" : "down";
  return (
    <Link
      href={`/trades/${t.id}`}
      className="block p-2.5 rounded border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--row-hover)] transition-colors"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="rounded-full overflow-hidden shrink-0">
          <AgentLogo agentId={t.agent_id} size={16} />
        </div>
        <span className="text-[11px] font-semibold truncate">
          {t.agent_id.replace(/-/, " · ").replace(/scalp/, "단타").replace(/swing/, "스윙")}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="chip text-[10px] !py-0.5">{sym}</span>
          <span
            className={`text-[11px] font-semibold ${t.side === "long" ? "up" : "down"}`}
          >
            {sideKr}
          </span>
        </div>
        <span className={`num text-[13px] font-bold ${cls}`}>
          {sign}
          {t.pnl_pct.toFixed(2)}%
        </span>
      </div>
      <div className="text-[10px] text-[var(--fg-3)] num mt-1.5">
        {relTime(t.closed_at)}
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  sub,
  colorCls,
}: {
  label: string;
  value: string;
  sub?: string;
  colorCls?: string;
}) {
  return (
    <div>
      <div className="text-[11px] text-[var(--fg-3)] mb-0.5">{label}</div>
      <div className={`num text-[14px] font-semibold ${colorCls ?? ""}`}>
        {value}
        {sub && (
          <span className="text-[11px] font-normal text-[var(--fg-3)] ml-1">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function OrderBookRow({
  price,
  qty,
  max,
  side,
}: {
  price: number;
  qty: number;
  max: number;
  side: "ask" | "bid";
}) {
  const w = (qty / max) * 100;
  const color = side === "ask" ? "var(--down)" : "var(--up)";
  return (
    <div className="relative flex items-center justify-between py-0.5 px-1.5">
      <div
        className="absolute inset-y-0 right-0 opacity-15 rounded-sm"
        style={{ width: `${w}%`, background: color }}
      />
      <span
        className={`relative ${side === "ask" ? "down" : "up"} font-medium`}
      >
        {fmtPrice(price)}
      </span>
      <span className="relative text-[var(--fg-2)]">{qty.toFixed(3)}</span>
    </div>
  );
}

function VolBar({
  label,
  value,
  max,
  cls,
}: {
  label: string;
  value: number;
  max: number;
  cls: "up" | "down";
}) {
  const w = (value / max) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-0.5">
        <span className="text-[11px] text-[var(--fg-2)]">{label}</span>
        <span className={`num text-[12px] font-semibold ${cls}`}>
          {value.toFixed(2)}x
        </span>
      </div>
      <div className="h-2.5 bg-[var(--bg-3)] rounded overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${w}%`,
            background: cls === "up" ? "var(--up)" : "var(--down)",
          }}
        />
      </div>
    </div>
  );
}
