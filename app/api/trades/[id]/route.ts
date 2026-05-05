import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type TfRow = { tf: string; rsi: number; macd: "up" | "down" | "flat"; ema: "up" | "down" | "flat"; trend: "buy" | "sell" | "neutral" };

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildMockSnapshot(tradeId: string, entryPrice: number, side: "long" | "short") {
  let h = 0;
  for (let i = 0; i < tradeId.length; i++) h = (h * 31 + tradeId.charCodeAt(i)) >>> 0;
  const r = rng(h);

  const orderbook = {
    asks: [4, 3, 2, 1, 0].map((i) => ({
      price: entryPrice * (1 + (i + 1) * 0.0008),
      qty: Number((0.1 + r() * 0.6).toFixed(3)),
    })),
    bids: [0, 1, 2, 3, 4].map((i) => ({
      price: entryPrice * (1 - (i + 1) * 0.0008),
      qty: Number((0.1 + r() * 0.6).toFixed(3)),
    })),
  };
  const supportIdx = Math.floor(r() * 5);
  orderbook.bids[supportIdx].qty = Number((0.6 + r() * 0.4).toFixed(3));

  const fundingRate = -0.005 - r() * 0.02;
  const funding24h = Array.from({ length: 8 }, () => Number((-0.01 - r() * 0.02).toFixed(4)));

  const oiChange = Number((-0.5 + r() * 1.5).toFixed(2));

  const volBuy = Number((1.0 + r() * 0.5).toFixed(2));
  const volSell = Number((0.7 + r() * 0.4).toFixed(2));

  const matrix: TfRow[] = [
    {
      tf: "5m",
      rsi: Math.round(28 + r() * 25),
      macd: r() > 0.4 ? "up" : "flat",
      ema: r() > 0.3 ? "up" : "flat",
      trend: side === "long" ? "buy" : "sell",
    },
    {
      tf: "15m",
      rsi: Math.round(35 + r() * 25),
      macd: r() > 0.5 ? "up" : "flat",
      ema: r() > 0.4 ? "up" : "flat",
      trend: side === "long" ? "buy" : "neutral",
    },
    {
      tf: "1h",
      rsi: Math.round(45 + r() * 20),
      macd: r() > 0.5 ? "up" : "flat",
      ema: r() > 0.4 ? "up" : "flat",
      trend: r() > 0.5 ? "buy" : "neutral",
    },
    {
      tf: "4h",
      rsi: Math.round(50 + r() * 15),
      macd: r() > 0.5 ? "up" : "flat",
      ema: r() > 0.5 ? "up" : "flat",
      trend: side === "long" ? "buy" : "neutral",
    },
  ];

  return { orderbook, fundingRate, funding24h, oiChange, volBuy, volSell, matrix };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const sb = supabaseService();

  const { data: trade, error: tErr } = await sb
    .from("trades")
    .select(
      "id, agent_id, symbol, side, entry_price, exit_price, size, opened_at, closed_at, pnl, pnl_pct, open_decision_id, close_decision_id",
    )
    .eq("id", id)
    .single();
  if (tErr || !trade) {
    return NextResponse.json({ error: "trade not found" }, { status: 404 });
  }

  const { data: agent } = await sb
    .from("agents")
    .select("id, display_name, model, style, starting_balance")
    .eq("id", trade.agent_id)
    .single();

  const decisionIds = [
    trade.open_decision_id,
    trade.close_decision_id,
  ].filter(Boolean) as string[];
  const { data: decisions } = await sb
    .from("decisions")
    .select("id, action, reasoning, decided_at")
    .in("id", decisionIds);

  const openDec = decisions?.find((d) => d.id === trade.open_decision_id);
  const closeDec = decisions?.find((d) => d.id === trade.close_decision_id);

  const otherAgents: { agent_id: string; choice: string; reason: string }[] = [];
  if (agent) {
    const { data: nearby } = await sb
      .from("decisions")
      .select("agent_id, action, reasoning, decided_at, agents:agent_id(display_name)")
      .neq("agent_id", trade.agent_id)
      .gte(
        "decided_at",
        new Date(
          new Date(trade.opened_at as string).getTime() - 30 * 60_000,
        ).toISOString(),
      )
      .lte(
        "decided_at",
        new Date(
          new Date(trade.opened_at as string).getTime() + 30 * 60_000,
        ).toISOString(),
      )
      .limit(20);
    const seen = new Set<string>();
    for (const d of nearby ?? []) {
      if (seen.has(d.agent_id as string)) continue;
      seen.add(d.agent_id as string);
      otherAgents.push({
        agent_id: d.agent_id as string,
        choice:
          d.action === "open_long"
            ? "매수 진입"
            : d.action === "open_short"
              ? "매도 진입"
              : d.action === "close"
                ? "포지션 청산"
                : "관망",
        reason: ((d.reasoning as string) ?? "").slice(0, 80),
      });
      if (otherAgents.length >= 4) break;
    }
  }

  const snapshot = buildMockSnapshot(
    String(trade.id),
    Number(trade.entry_price),
    trade.side as "long" | "short",
  );

  return NextResponse.json({
    trade: {
      id: trade.id,
      agent_id: trade.agent_id,
      symbol: trade.symbol,
      side: trade.side,
      entry_price: Number(trade.entry_price),
      exit_price: Number(trade.exit_price),
      size: Number(trade.size),
      opened_at: trade.opened_at,
      closed_at: trade.closed_at,
      pnl: Number(trade.pnl),
      pnl_pct: Number(trade.pnl_pct),
    },
    agent,
    open_reasoning: openDec?.reasoning ?? null,
    close_reasoning: closeDec?.reasoning ?? null,
    snapshot,
    other_agents: otherAgents,
  });
}
