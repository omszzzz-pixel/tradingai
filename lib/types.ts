export type Candle = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
};

export type Indicators = {
  rsi14: number;
  ema20: number;
  ema50: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  atr14: number;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  price: number;
};

export type Action = "open_long" | "open_short" | "close" | "hold";

export type Decision = {
  action: Action;
  reasoning: string;
};

export type Position = {
  id: string;
  agent_id: string;
  symbol: string;
  side: "long" | "short";
  entry_price: number;
  size: number;
  opened_at: string;
};

export type Trade = {
  id: string;
  agent_id: string;
  symbol: string;
  side: "long" | "short";
  entry_price: number;
  exit_price: number;
  size: number;
  opened_at: string;
  closed_at: string;
  pnl: number;
  pnl_pct: number;
};

export type Agent = {
  id: string;
  display_name: string;
  model: string;
  style: "aggressive" | "conservative";
  symbol: string;
  timeframe: string;
  starting_balance: number;
  is_active: boolean;
};
