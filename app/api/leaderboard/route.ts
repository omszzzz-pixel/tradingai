import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type AgentRow = {
  id: string;
  display_name: string;
  model: string;
  style: "scalp" | "swing";
  starting_balance: number;
  is_active: boolean;
};

type TradeRow = {
  agent_id: string;
  pnl: number | null;
  pnl_pct: number | null;
  closed_at: string;
};

function maxDrawdown(pnls: number[], starting: number): number {
  let peak = starting;
  let cur = starting;
  let maxDd = 0;
  for (const p of pnls) {
    cur += p;
    if (cur > peak) peak = cur;
    const dd = ((peak - cur) / peak) * 100;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd;
}

function sharpe(pcts: number[]): number {
  if (pcts.length < 2) return 0;
  const m = pcts.reduce((a, b) => a + b, 0) / pcts.length;
  const v = pcts.reduce((a, b) => a + (b - m) * (b - m), 0) / pcts.length;
  const sd = Math.sqrt(v);
  if (sd === 0) return 0;
  return (m / sd) * Math.sqrt(pcts.length);
}

export async function GET() {
  const sb = supabaseService();

  const { data: agents, error: aErr } = await sb
    .from("agents")
    .select("id, display_name, model, style, starting_balance, is_active");
  if (aErr) {
    return NextResponse.json({ error: aErr.message }, { status: 500 });
  }

  const { data: trades, error: tErr } = await sb
    .from("trades")
    .select("agent_id, pnl, pnl_pct, closed_at")
    .order("closed_at", { ascending: true });
  if (tErr) {
    return NextResponse.json({ error: tErr.message }, { status: 500 });
  }

  const byAgent = new Map<string, TradeRow[]>();
  for (const t of (trades ?? []) as TradeRow[]) {
    const arr = byAgent.get(t.agent_id) ?? [];
    arr.push(t);
    byAgent.set(t.agent_id, arr);
  }

  const rows = ((agents ?? []) as AgentRow[]).map((a) => {
    const ts = byAgent.get(a.id) ?? [];
    const pnls = ts.map((t) => Number(t.pnl ?? 0));
    const pcts = ts.map((t) => Number(t.pnl_pct ?? 0));
    const totalPnl = pnls.reduce((s, x) => s + x, 0);
    const wins = pnls.filter((x) => x > 0).length;
    const winRate = pnls.length > 0 ? (wins / pnls.length) * 100 : 0;
    const balance = Number(a.starting_balance) + totalPnl;
    const returnPct = (totalPnl / Number(a.starting_balance)) * 100;
    return {
      id: a.id,
      display_name: a.display_name,
      model: a.model,
      style: a.style,
      is_active: a.is_active,
      starting_balance: Number(a.starting_balance),
      balance,
      total_pnl: totalPnl,
      return_pct: returnPct,
      win_rate: winRate,
      trades: ts.length,
      mdd: maxDrawdown(pnls, Number(a.starting_balance)),
      sharpe: sharpe(pcts),
    };
  });

  rows.sort((a, b) => b.return_pct - a.return_pct);

  return NextResponse.json({ rows });
}
