import type { Candle, Indicators } from "./types";

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0];
  out.push(prev);
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

function sma(values: number[], period: number): number {
  if (values.length < period) return NaN;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function stddev(values: number[], period: number): number {
  if (values.length < period) return NaN;
  const slice = values.slice(-period);
  const m = slice.reduce((a, b) => a + b, 0) / period;
  const v = slice.reduce((acc, x) => acc + (x - m) * (x - m), 0) / period;
  return Math.sqrt(v);
}

function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return NaN;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += -diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function atr(candles: Candle[], period = 14): number {
  if (candles.length < period + 1) return NaN;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const p = candles[i - 1];
    const tr = Math.max(
      c.high - c.low,
      Math.abs(c.high - p.close),
      Math.abs(c.low - p.close),
    );
    trs.push(tr);
  }
  let avg = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    avg = (avg * (period - 1) + trs[i]) / period;
  }
  return avg;
}

export function compute(candles: Candle[]): Indicators {
  const closes = candles.map((c) => c.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);
  const last = closes.length - 1;
  const ema20arr = ema(closes, 20);
  const ema50arr = ema(closes, 50);
  const bbMiddle = sma(closes, 20);
  const sd = stddev(closes, 20);
  return {
    rsi14: rsi(closes, 14),
    ema20: ema20arr[last],
    ema50: ema50arr[last],
    macd: macdLine[last],
    macdSignal: signalLine[last],
    macdHist: macdLine[last] - signalLine[last],
    atr14: atr(candles, 14),
    bbUpper: bbMiddle + 2 * sd,
    bbMiddle,
    bbLower: bbMiddle - 2 * sd,
    price: closes[last],
  };
}
