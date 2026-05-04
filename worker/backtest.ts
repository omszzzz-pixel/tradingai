import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { fetchKlinesRange } from "../lib/binance";
import { compute } from "../lib/indicators";
import { decide } from "../lib/agent";
import { applyDecision, getOpenPosition } from "../lib/paperTrade";
import { supabaseService } from "../lib/supabase";
import type { Agent } from "../lib/types";

const AGENT_ID = process.env.BACKTEST_AGENT ?? "sonnet-scalp";
const DAYS = Number(process.env.BACKTEST_DAYS ?? 1);
const STRIDE = Number(process.env.BACKTEST_STRIDE ?? 6);
const WARMUP = 60;
const WINDOW = 200;

async function main() {
  const sb = supabaseService();
  const { data: agentRow, error: aErr } = await sb
    .from("agents")
    .select("*")
    .eq("id", AGENT_ID)
    .single();
  if (aErr || !agentRow) throw new Error(`agent ${AGENT_ID} not found`);
  const agent = agentRow as Agent;

  console.log(`backtest: agent=${agent.id} model=${agent.model} ${DAYS}d ${agent.timeframe} stride=${STRIDE}`);

  const endTime = Date.now();
  const startTime = endTime - DAYS * 86400_000;
  console.log(`fetching candles ${new Date(startTime).toISOString()} → ${new Date(endTime).toISOString()}`);
  const candles = await fetchKlinesRange(agent.symbol, agent.timeframe, startTime, endTime);
  console.log(`got ${candles.length} candles`);
  if (candles.length < WARMUP + STRIDE) {
    throw new Error(`not enough candles (${candles.length})`);
  }

  console.log("clearing existing data for this agent...");
  await sb.from("trades").delete().eq("agent_id", agent.id);
  await sb.from("positions").delete().eq("agent_id", agent.id);
  await sb.from("decisions").delete().eq("agent_id", agent.id);

  const decisionPoints: number[] = [];
  for (let i = WARMUP; i < candles.length; i += STRIDE) decisionPoints.push(i);
  if (decisionPoints[decisionPoints.length - 1] !== candles.length - 1) {
    decisionPoints.push(candles.length - 1);
  }

  console.log(`decision points: ${decisionPoints.length}`);

  let opens = 0;
  let closes = 0;
  let holds = 0;

  for (let k = 0; k < decisionPoints.length; k++) {
    const i = decisionPoints[k];
    const window = candles.slice(Math.max(0, i - WINDOW + 1), i + 1);
    const ind = compute(window);
    const at = new Date(candles[i].closeTime);
    const pos = await getOpenPosition(sb, agent.id);

    const isLast = k === decisionPoints.length - 1;
    let { decision, raw } = await decide(agent.model, window, ind, pos);

    if (isLast && pos && decision.action !== "close") {
      decision = {
        action: "close",
        reasoning: decision.reasoning + " (백테스트 종료, 강제 청산)",
      };
    }

    await applyDecision(
      sb,
      agent.id,
      agent.symbol,
      decision,
      ind,
      pos,
      Number(agent.starting_balance),
      raw,
      at,
    );

    if (decision.action === "open_long" || decision.action === "open_short") opens++;
    else if (decision.action === "close") closes++;
    else holds++;

    const tag = pos ? `${pos.side}@${pos.entry_price.toFixed(2)}` : "flat";
    console.log(
      `[${k + 1}/${decisionPoints.length}] ${at.toISOString()} ${ind.price.toFixed(2)} ${tag} -> ${decision.action}`,
    );
  }

  console.log(`done. opens=${opens} closes=${closes} holds=${holds}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
