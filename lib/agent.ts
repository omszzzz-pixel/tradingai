import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Candle, Indicators, Decision, Position } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DecisionSchema = z.object({
  action: z.enum(["open_long", "open_short", "close", "hold"]),
  reasoning: z.string().min(10).max(800),
});

const SYSTEM_PROMPT = `당신은 BTC/USDT 5분봉 단타 매매를 관찰·기록하는 AI 트레이더입니다.

규칙:
- 한 번에 한 포지션만 보유합니다.
- 포지션이 이미 열려 있으면 가능한 액션은 close 또는 hold만 입니다.
- 포지션이 비어 있으면 가능한 액션은 open_long, open_short, hold 입니다.
- 추세 명확성, 변동성, RSI 과열/과매도, 밴드 위치를 균형 있게 고려하세요.
- 손절은 ATR의 1.5배, 익절은 ATR의 2.5배가 적정선이라고 가정하세요(엔진이 자동 처리).
- 의심스러우면 hold. 무리하지 마세요.
- 출력은 반드시 다음 JSON 한 개만, 다른 텍스트 없이:
{"action":"open_long|open_short|close|hold","reasoning":"한국어 2~4문장으로 지표 수치 인용"}`;

function buildUserMessage(
  candles: Candle[],
  ind: Indicators,
  pos: Position | null,
): string {
  const last10 = candles.slice(-10).map((c) => ({
    t: new Date(c.openTime).toISOString().slice(11, 16),
    o: c.open,
    h: c.high,
    l: c.low,
    c: c.close,
    v: Number(c.volume.toFixed(2)),
  }));
  const positionLine = pos
    ? `현재 포지션: ${pos.side.toUpperCase()} @ ${pos.entry_price} (size ${pos.size}). 미실현손익(추정) = ${(
        ((ind.price - pos.entry_price) / pos.entry_price) *
        (pos.side === "long" ? 1 : -1) *
        100
      ).toFixed(2)}%`
    : "현재 포지션: 없음";

  return `심볼: BTCUSDT  타임프레임: 5m
현재가: ${ind.price}
${positionLine}

지표:
- RSI(14): ${ind.rsi14.toFixed(2)}
- EMA20: ${ind.ema20.toFixed(2)}  EMA50: ${ind.ema50.toFixed(2)}
- MACD: ${ind.macd.toFixed(2)}  Signal: ${ind.macdSignal.toFixed(2)}  Hist: ${ind.macdHist.toFixed(2)}
- ATR(14): ${ind.atr14.toFixed(2)}
- BB Upper/Mid/Lower: ${ind.bbUpper.toFixed(2)} / ${ind.bbMiddle.toFixed(2)} / ${ind.bbLower.toFixed(2)}

최근 10봉(5m): ${JSON.stringify(last10)}

위 데이터를 보고 단 하나의 JSON만 출력하세요.`;
}

export async function decide(
  model: string,
  candles: Candle[],
  ind: Indicators,
  pos: Position | null,
): Promise<{ decision: Decision; raw: string }> {
  const msg = await client.messages.create({
    model,
    max_tokens: 600,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildUserMessage(candles, ind, pos) }],
  });

  const raw = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const json = extractJson(raw);
  const parsed = DecisionSchema.parse(json);

  if (pos && (parsed.action === "open_long" || parsed.action === "open_short")) {
    return {
      decision: { action: "hold", reasoning: parsed.reasoning + " (포지션 보유 중이라 hold로 강제)" },
      raw,
    };
  }
  if (!pos && parsed.action === "close") {
    return {
      decision: { action: "hold", reasoning: parsed.reasoning + " (포지션 없음, hold로 강제)" },
      raw,
    };
  }

  return { decision: parsed, raw };
}

function extractJson(s: string): unknown {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("no JSON in response");
  return JSON.parse(m[0]);
}
