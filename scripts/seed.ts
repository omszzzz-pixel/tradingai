import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { fetchKlinesRange } from "../lib/binance";
import { supabaseService } from "../lib/supabase";

type Personality = {
  id: string;
  winRate: number;
  tradeCount: number;
  avgHoldMin: number;
};

const PERSONALITIES: Personality[] = [
  { id: "sonnet-scalp", winRate: 0.62, tradeCount: 28, avgHoldMin: 22 },
  { id: "sonnet-swing", winRate: 0.58, tradeCount: 12, avgHoldMin: 240 },
  { id: "opus-scalp", winRate: 0.55, tradeCount: 22, avgHoldMin: 28 },
  { id: "opus-swing", winRate: 0.6, tradeCount: 10, avgHoldMin: 320 },
  { id: "gpt-scalp", winRate: 0.52, tradeCount: 30, avgHoldMin: 18 },
  { id: "gpt-swing", winRate: 0.56, tradeCount: 11, avgHoldMin: 280 },
  { id: "gemini-scalp", winRate: 0.48, tradeCount: 26, avgHoldMin: 25 },
  { id: "gemini-swing", winRate: 0.5, tradeCount: 9, avgHoldMin: 300 },
];

const ENTRY_TEMPLATES = [
  "RSI {rsi} 과매도권 이탈 후 EMA20 돌파, 단기 반등 시그널 포착.",
  "MACD 시그널 크로스 + 볼륨 평균 대비 1.4배 증가, 추세 추종 진입.",
  "BB 하단 {bbl} 이탈 후 회복 시그널, 손익비 양호 판단해 진입.",
  "RSI {rsi} 강세 유지 + EMA50({ema50}) 상방 안착, 추세 매수.",
  "전저점 지지 확인 후 거래량 동반 양봉, 단기 모멘텀 진입.",
  "RSI {rsi} 다이버전스 + MACD 히스토그램 양전, 반전 진입.",
  "ATR {atr} 변동성 확장 구간, 추세 방향 추종.",
];

const EXIT_TEMPLATES = [
  "ATR 기반 익절선 도달, 손익비 만족하여 청산.",
  "MACD 다이버전스 발생, 추세 전환 가능성으로 청산.",
  "RSI {rsi} 과열 구간 진입, 모멘텀 약화 신호로 청산.",
  "BB 상단 {bbu} 터치 후 거부 캔들, 보수적으로 물러남.",
  "EMA20 하방 이탈, 추세 약화로 손절선 발동.",
  "전고점 저항 거부 + 거래량 급감, 익절.",
  "ATR 기반 손절선 터치, 규칙대로 청산.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function tmpl(s: string, vars: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "—");
}

type Bar = { open: number; high: number; low: number; close: number; openTime: number; closeTime: number };

async function seedAgent(p: Personality, candles: Bar[], startingBalance: number) {
  const sb = supabaseService();

  console.log(`[${p.id}] clearing...`);
  await sb.from("trades").delete().eq("agent_id", p.id);
  await sb.from("positions").delete().eq("agent_id", p.id);
  await sb.from("decisions").delete().eq("agent_id", p.id);

  const candlesPerHold = Math.max(1, Math.round(p.avgHoldMin / 5));
  const minOpenIdx = 60;
  const maxOpenIdx = candles.length - candlesPerHold * 2 - 5;

  type GenTrade = {
    side: "long" | "short";
    openIdx: number;
    closeIdx: number;
    entry: number;
    exit: number;
  };
  const generated: GenTrade[] = [];

  let attempts = 0;
  while (generated.length < p.tradeCount && attempts < p.tradeCount * 10) {
    attempts++;
    const openIdx = minOpenIdx + Math.floor(Math.random() * (maxOpenIdx - minOpenIdx));
    const holdNoise = 0.6 + Math.random() * 0.8;
    const closeIdx = Math.min(
      candles.length - 1,
      openIdx + Math.max(1, Math.round(candlesPerHold * holdNoise)),
    );

    if (generated.some((g) => Math.abs(g.openIdx - openIdx) < candlesPerHold)) continue;

    const wantWin = Math.random() < p.winRate;
    const openP = candles[openIdx].close;
    const closeP = candles[closeIdx].close;
    const priceUp = closeP > openP;

    let side: "long" | "short";
    if (wantWin) side = priceUp ? "long" : "short";
    else side = priceUp ? "short" : "long";

    const noise = (n: number) => n * (1 + (Math.random() - 0.5) * 0.0008);
    const entry = noise(openP);
    const exit = noise(closeP);

    generated.push({ side, openIdx, closeIdx, entry, exit });
  }

  generated.sort((a, b) => a.openIdx - b.openIdx);

  for (const g of generated) {
    const openCandle = candles[g.openIdx];
    const closeCandle = candles[g.closeIdx];
    const openTime = new Date(openCandle.openTime);
    const closeTime = new Date(closeCandle.closeTime);

    const indForVars = {
      rsi: (40 + Math.random() * 30).toFixed(1),
      ema50: (g.entry * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2),
      atr: (g.entry * 0.003).toFixed(2),
      bbl: (g.entry * 0.995).toFixed(2),
      bbu: (g.entry * 1.005).toFixed(2),
    };

    const fakeIndOpen = {
      rsi14: 40 + Math.random() * 30,
      ema20: g.entry,
      ema50: g.entry,
      macd: (Math.random() - 0.5) * 50,
      macdSignal: (Math.random() - 0.5) * 50,
      macdHist: (Math.random() - 0.5) * 30,
      atr14: g.entry * 0.003,
      bbUpper: g.entry * 1.005,
      bbMiddle: g.entry,
      bbLower: g.entry * 0.995,
      price: g.entry,
    };
    const fakeIndClose = { ...fakeIndOpen, price: g.exit };

    const { data: openDec, error: e1 } = await sb
      .from("decisions")
      .insert({
        agent_id: p.id,
        symbol: "BTCUSDT",
        action: g.side === "long" ? "open_long" : "open_short",
        price: g.entry,
        indicators: fakeIndOpen as unknown as Record<string, number>,
        reasoning: tmpl(pick(ENTRY_TEMPLATES), indForVars),
        decided_at: openTime.toISOString(),
      })
      .select("id")
      .single();
    if (e1) throw e1;

    const { data: closeDec, error: e2 } = await sb
      .from("decisions")
      .insert({
        agent_id: p.id,
        symbol: "BTCUSDT",
        action: "close",
        price: g.exit,
        indicators: fakeIndClose as unknown as Record<string, number>,
        reasoning: tmpl(pick(EXIT_TEMPLATES), indForVars),
        decided_at: closeTime.toISOString(),
      })
      .select("id")
      .single();
    if (e2) throw e2;

    const size = (startingBalance * 0.2) / g.entry;
    const dir = g.side === "long" ? 1 : -1;
    const pnl = (g.exit - g.entry) * size * dir;
    const pnlPct = ((g.exit - g.entry) / g.entry) * 100 * dir;

    const { error: e3 } = await sb.from("trades").insert({
      agent_id: p.id,
      symbol: "BTCUSDT",
      side: g.side,
      entry_price: g.entry,
      exit_price: g.exit,
      size,
      opened_at: openTime.toISOString(),
      closed_at: closeTime.toISOString(),
      pnl,
      pnl_pct: pnlPct,
      open_decision_id: (openDec as { id: string }).id,
      close_decision_id: (closeDec as { id: string }).id,
    });
    if (e3) throw e3;
  }

  console.log(`[${p.id}] inserted ${generated.length} trades`);
}

async function main() {
  const sb = supabaseService();
  const days = Number(process.env.SEED_DAYS ?? 7);
  const endTime = Date.now();
  const startTime = endTime - days * 86400_000;

  console.log(`fetching ${days}d of BTCUSDT 5m candles...`);
  const candles = await fetchKlinesRange("BTCUSDT", "5m", startTime, endTime);
  console.log(`got ${candles.length} candles`);

  const { data: agents, error } = await sb.from("agents").select("id, starting_balance");
  if (error) throw error;
  const balanceMap = new Map<string, number>(
    (agents ?? []).map((a) => [a.id as string, Number(a.starting_balance)]),
  );

  for (const p of PERSONALITIES) {
    const bal = balanceMap.get(p.id);
    if (bal === undefined) {
      console.warn(`agent ${p.id} not in DB, skipping`);
      continue;
    }
    await seedAgent(p, candles, bal);
  }

  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
