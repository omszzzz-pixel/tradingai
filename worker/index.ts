import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { fetchKlines } from "../lib/binance";
import { compute } from "../lib/indicators";
import { decide } from "../lib/agent";
import { applyDecision, getOpenPosition } from "../lib/paperTrade";
import { supabaseService } from "../lib/supabase";
import type { Agent } from "../lib/types";

const TICK_MS = Number(process.env.WORKER_TICK_MS ?? 5 * 60 * 1000);

async function tick() {
  const sb = supabaseService();
  const { data: agents, error } = await sb
    .from("agents")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;

  for (const a of (agents ?? []) as Agent[]) {
    try {
      await runAgent(sb, a);
    } catch (err) {
      console.error(`[${a.id}] tick failed:`, err);
    }
  }
}

async function runAgent(
  sb: ReturnType<typeof supabaseService>,
  a: Agent,
) {
  const candles = await fetchKlines(a.symbol, a.timeframe, 200);
  const ind = compute(candles);
  const pos = await getOpenPosition(sb, a.id);

  await sb.from("candles").upsert(
    candles.map((c) => ({
      symbol: a.symbol,
      timeframe: a.timeframe,
      open_time: c.openTime,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      close_time: c.closeTime,
    })),
    { onConflict: "symbol,timeframe,open_time" },
  );

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

  const tag = pos ? `${pos.side}@${pos.entry_price}` : "flat";
  console.log(
    `[${a.id}] ${new Date().toISOString()} price=${ind.price} pos=${tag} -> ${decision.action}`,
  );
}

async function main() {
  console.log(`worker starting, tick=${TICK_MS}ms`);
  await tick();
  setInterval(() => {
    tick().catch((e) => console.error("tick error:", e));
  }, TICK_MS);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
