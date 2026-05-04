import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type AgentRow = {
  id: string;
  display_name: string;
  model: string;
  style: "scalp" | "swing";
  starting_balance: number;
};

type TradeRow = {
  agent_id: string;
  pnl: number | null;
  pnl_pct: number | null;
  closed_at: string;
};

export async function GET(req: Request) {
  const sb = supabaseService();
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  const days = Number(searchParams.get("days") ?? 7);
  const sinceMs = Date.now() - days * 86_400_000;
  const sinceIso = new Date(sinceMs).toISOString();

  const { data: agents, error: aErr } = await sb
    .from("agents")
    .select("id, display_name, model, style, starting_balance");
  if (aErr) {
    return NextResponse.json({ error: aErr.message }, { status: 500 });
  }

  let q = sb
    .from("trades")
    .select("agent_id, pnl, pnl_pct, closed_at")
    .gte("closed_at", sinceIso)
    .order("closed_at", { ascending: true });
  if (symbol) q = q.eq("symbol", symbol);

  const { data: trades, error: tErr } = await q;
  if (tErr) {
    return NextResponse.json({ error: tErr.message }, { status: 500 });
  }

  const tradesByAgent = new Map<string, TradeRow[]>();
  for (const t of (trades ?? []) as TradeRow[]) {
    const arr = tradesByAgent.get(t.agent_id) ?? [];
    arr.push(t);
    tradesByAgent.set(t.agent_id, arr);
  }

  const startTime = Math.floor(sinceMs / 1000);
  const nowTime = Math.floor(Date.now() / 1000);

  const series = ((agents ?? []) as AgentRow[]).map((a) => {
    const ts = tradesByAgent.get(a.id) ?? [];
    const starting = Number(a.starting_balance);
    const points: { time: number; value: number }[] = [
      { time: startTime, value: 0 },
    ];
    let cumPnl = 0;
    for (const t of ts) {
      cumPnl += Number(t.pnl ?? 0);
      const v = (cumPnl / starting) * 100;
      points.push({
        time: Math.floor(new Date(t.closed_at).getTime() / 1000),
        value: v,
      });
    }
    const lastValue = points[points.length - 1]?.value ?? 0;
    if (points[points.length - 1]?.time !== nowTime) {
      points.push({ time: nowTime, value: lastValue });
    }
    return {
      agent_id: a.id,
      display_name: a.display_name,
      model: a.model,
      style: a.style,
      final_return: lastValue,
      points,
    };
  });

  series.sort((a, b) => b.final_return - a.final_return);

  return NextResponse.json({ series });
}
