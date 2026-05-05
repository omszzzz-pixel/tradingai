import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type AgentRow = {
  id: string;
  display_name: string;
  model: string;
  style: "aggressive" | "conservative";
  is_active: boolean;
};

type OutcomeRow = {
  agent_id: string;
  correct: boolean | null;
  pct_change: number | null;
};

export async function GET() {
  const sb = supabaseService();

  const { data: agents, error: aErr } = await sb
    .from("agents")
    .select("id, display_name, model, style, is_active");
  if (aErr) {
    return NextResponse.json({ error: aErr.message }, { status: 500 });
  }

  const { data: outcomes, error: oErr } = await sb
    .from("stance_outcomes")
    .select("agent_id, correct, pct_change");
  if (oErr) {
    return NextResponse.json({ error: oErr.message }, { status: 500 });
  }

  const byAgent = new Map<string, OutcomeRow[]>();
  for (const o of (outcomes ?? []) as OutcomeRow[]) {
    const arr = byAgent.get(o.agent_id) ?? [];
    arr.push(o);
    byAgent.set(o.agent_id, arr);
  }

  const rows = ((agents ?? []) as AgentRow[]).map((a) => {
    const ts = byAgent.get(a.id) ?? [];
    const total = ts.length;
    const correct = ts.filter((t) => t.correct === true).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    return {
      id: a.id,
      display_name: a.display_name,
      model: a.model,
      style: a.style,
      is_active: a.is_active,
      // legacy fields kept for compatibility (set 0)
      starting_balance: 0,
      balance: 0,
      total_pnl: 0,
      return_pct: 0,
      // new field
      win_rate: accuracy, // reuse field name so existing UI just relabels
      accuracy,
      stance_count: total,
      correct_count: correct,
      trades: total, // reused for total stance count in UI
      mdd: 0,
      sharpe: 0,
    };
  });

  rows.sort((a, b) => b.accuracy - a.accuracy);

  return NextResponse.json({ rows });
}
