export const SYMBOLS = [
  { id: "BTCUSDT", short: "BTC", name: "비트코인" },
  { id: "ETHUSDT", short: "ETH", name: "이더리움" },
  { id: "XRPUSDT", short: "XRP", name: "리플" },
  { id: "SOLUSDT", short: "SOL", name: "솔라나" },
] as const;

export type SymbolId = (typeof SYMBOLS)[number]["id"];
export const DEFAULT_SYMBOL: SymbolId = "BTCUSDT";

export function symbolShort(id: string): string {
  const s = SYMBOLS.find((x) => x.id === id);
  return s?.short ?? id;
}

export function fmtPrice(n: number): string {
  if (!isFinite(n)) return "—";
  if (n >= 1000)
    return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 100) return n.toFixed(1);
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}
