import Chart from "@/components/Chart";
import TradesPanel from "@/components/TradesPanel";

const AGENT_ID = "sonnet-scalp";

export default function Home() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
      <section className="bg-[var(--bg-2)] border border-[var(--border)] rounded">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="text-[14px] font-medium">BTC/USDT · 5m</div>
            <div className="text-[11px] text-[var(--fg-3)]">Binance</div>
          </div>
        </div>
        <Chart />
      </section>

      <aside>
        <TradesPanel agentId={AGENT_ID} />
      </aside>
    </div>
  );
}
