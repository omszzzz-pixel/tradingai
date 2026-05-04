import Chart from "@/components/Chart";
import TradesPanel from "@/components/TradesPanel";
import Chat from "@/components/Chat";

const AGENT_ID = "sonnet-scalp";

export default function Home() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px_320px] gap-4">
      <section className="bg-[var(--bg-2)] border border-[var(--border)] rounded">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="text-[14px] font-medium">BTC/USDT</div>
            <div className="text-[11px] text-[var(--fg-3)]">Binance · 진입(↑↓) / 청산(○) 마커 표시</div>
          </div>
        </div>
        <Chart agentId={AGENT_ID} />
      </section>

      <aside>
        <TradesPanel agentId={AGENT_ID} />
      </aside>

      <aside>
        <Chat />
      </aside>
    </div>
  );
}
