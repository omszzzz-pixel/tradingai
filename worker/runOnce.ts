import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { fetchKlines } from "../lib/binance";
import { compute } from "../lib/indicators";
import { decide } from "../lib/agent";
import { applyDecision, getOpenPosition } from "../lib/paperTrade";
import { supabaseService } from "../lib/supabase";
import type { Agent } from "../lib/types";

async function main() {
  const sb = supabaseService();
  const { data: agents, error } = await sb
    .from("agents")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;

  for (const a of (agents ?? []) as Agent[]) {
    const candles = await fetchKlines(a.symbol, a.timeframe, 200);
    const ind = compute(candles);
    const pos = await getOpenPosition(sb, a.id);
    const { decision, raw } = await decide(a.model, candles, ind, pos);
    await applyDecision(
      sb,
      a.id,
      a.symbol,
      decision,
      ind,
      pos,
      Number(a.starting_balance),
      raw,
    );
    console.log(
      `[${a.id}] price=${ind.price} pos=${pos ? pos.side : "flat"} -> ${decision.action}`,
    );
    console.log(`  reasoning: ${decision.reasoning}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
