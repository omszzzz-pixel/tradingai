import type { SupabaseClient } from "@supabase/supabase-js";
import type { Indicators, Position, Decision } from "./types";

const POSITION_FRACTION = 0.2;

export async function getOpenPosition(
  sb: SupabaseClient,
  agentId: string,
): Promise<Position | null> {
  const { data, error } = await sb
    .from("positions")
    .select("*")
    .eq("agent_id", agentId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Position | null;
}

export async function getCurrentBalance(
  sb: SupabaseClient,
  agentId: string,
  startingBalance: number,
): Promise<number> {
  const { data, error } = await sb
    .from("trades")
    .select("pnl")
    .eq("agent_id", agentId);
  if (error) throw error;
  const pnl = (data ?? []).reduce(
    (s, r: { pnl: number }) => s + Number(r.pnl),
    0,
  );
  return startingBalance + pnl;
}

export async function applyDecision(
  sb: SupabaseClient,
  agentId: string,
  symbol: string,
  decision: Decision,
  ind: Indicators,
  pos: Position | null,
  startingBalance: number,
  raw: string,
): Promise<{ decisionId: string; tradeId?: string; positionId?: string }> {
  const { data: dec, error: dErr } = await sb
    .from("decisions")
    .insert({
      agent_id: agentId,
      symbol,
      action: decision.action,
      price: ind.price,
      indicators: ind as unknown as Record<string, number>,
      reasoning: decision.reasoning,
      raw_response: raw,
    })
    .select("id")
    .single();
  if (dErr) throw dErr;
  const decisionId = (dec as { id: string }).id;

  if (decision.action === "hold") return { decisionId };

  if (decision.action === "close" && pos) {
    const exitPrice = ind.price;
    const dir = pos.side === "long" ? 1 : -1;
    const pnl = (exitPrice - pos.entry_price) * pos.size * dir;
    const pnlPct = ((exitPrice - pos.entry_price) / pos.entry_price) * 100 * dir;

    const { data: tr, error: tErr } = await sb
      .from("trades")
      .insert({
        agent_id: agentId,
        symbol,
        side: pos.side,
        entry_price: pos.entry_price,
        exit_price: exitPrice,
        size: pos.size,
        opened_at: pos.opened_at,
        pnl,
        pnl_pct: pnlPct,
        close_decision_id: decisionId,
      })
      .select("id")
      .single();
    if (tErr) throw tErr;

    const { error: delErr } = await sb
      .from("positions")
      .delete()
      .eq("id", pos.id);
    if (delErr) throw delErr;

    return { decisionId, tradeId: (tr as { id: string }).id };
  }

  if (decision.action === "open_long" || decision.action === "open_short") {
    const balance = await getCurrentBalance(sb, agentId, startingBalance);
    const notional = balance * POSITION_FRACTION;
    const size = notional / ind.price;
    const side = decision.action === "open_long" ? "long" : "short";

    const { data: p, error: pErr } = await sb
      .from("positions")
      .insert({
        agent_id: agentId,
        symbol,
        side,
        entry_price: ind.price,
        size,
        decision_id: decisionId,
      })
      .select("id")
      .single();
    if (pErr) throw pErr;

    return { decisionId, positionId: (p as { id: string }).id };
  }

  return { decisionId };
}
