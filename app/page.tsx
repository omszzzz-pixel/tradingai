import Chart from "@/components/Chart";
import TradesPanel from "@/components/TradesPanel";
import { fetchKlines } from "@/lib/binance";

export const revalidate = 30;

const AGENT_ID = "sonnet-scalp";

export default async function Home() {
  let bars: { time: number; open: number; high: number; low: number; close: number }[] = [];
  try {
    const candles = await fetchKlines("BTCUSDT", "5m", 200);
    bars = candles.map((c) => ({
      time: c.openTime,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
  } catch {
    bars = [];
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
      <section className="bg-[var(--bg-2)] border border-[var(--border)] rounded">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="text-[14px] font-medium">BTC/USDT · 5m</div>
            <div className="text-[11px] text-[var(--fg-3)]">Binance</div>
          </div>
        </div>
        {bars.length > 0 ? (
          <Chart bars={bars} />
        ) : (
          <div className="h-[420px] flex items-center justify-center text-[var(--fg-3)]">
            차트 데이터 없음
          </div>
        )}
      </section>

      <aside>
        <TradesPanel agentId={AGENT_ID} />
      </aside>
    </div>
  );
}
