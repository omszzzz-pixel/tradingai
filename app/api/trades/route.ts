import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agent");
  if (!agentId) {
    return NextResponse.json({ error: "agent required" }, { status: 400 });
  }

  const sb = supabaseService();
  const { data: agent, error: aErr } = await sb
    .from("agents")
    .select("id, display_name, starting_balance")
    .eq("id", agentId)
    .single();
  if (aErr || !agent) {
    return NextResponse.json({ error: "agent not found" }, { status: 404 });
  }

  const { data: trades, error: tErr } = await sb
    .from("trades")
    .select(
      "id, symbol, side, entry_price, exit_price, size, opened_at, closed_at, pnl, pnl_pct, close_decision_id",
    )
    .eq("agent_id", agentId)
    .order("closed_at", { ascending: false })
    .limit(50);
  if (tErr) {
    return NextResponse.json({ error: tErr.message }, { status: 500 });
  }

  let reasoningById = new Map<string, string>();
  if (trades && trades.length > 0) {
    const ids = trades
      .map((t) => t.close_decision_id)
      .filter(Boolean) as string[];
    if (ids.length > 0) {
      const { data: decs } = await sb
        .from("decisions")
        .select("id, reasoning")
        .in("id", ids);
      reasoningById = new Map(
        (decs ?? []).map((d) => [d.id as string, (d.reasoning as string) ?? ""]),
      );
    }
  }

  const totalPnl = (trades ?? []).reduce((s, t) => s + Number(t.pnl ?? 0), 0);
  const balance = Number(agent.starting_balance) + totalPnl;

  return NextResponse.json({
    agent: {
      id: agent.id,
      display_name: agent.display_name,
      balance,
    },
    trades: (trades ?? []).map((t) => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      entry_price: Number(t.entry_price),
      exit_price: t.exit_price !== null ? Number(t.exit_price) : null,
      size: Number(t.size),
      opened_at: t.opened_at,
      closed_at: t.closed_at,
      pnl: t.pnl !== null ? Number(t.pnl) : null,
      pnl_pct: t.pnl_pct !== null ? Number(t.pnl_pct) : null,
      reasoning: reasoningById.get(t.close_decision_id as string) ?? null,
    })),
    paywall: {
      unlocked: true,
      delayMin: 0,
    },
  });
}
