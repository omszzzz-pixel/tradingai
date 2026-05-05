import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { fmtPrice, symbolShort } from "@/lib/symbols";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sb = supabaseService();
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  let q = sb
    .from("trades")
    .select("agent_id, symbol, side, entry_price, exit_price, pnl_pct, opened_at, closed_at")
    .order("closed_at", { ascending: false })
    .limit(20);
  if (symbol) q = q.eq("symbol", symbol);

  const { data: trades, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: agents } = await sb.from("agents").select("id, display_name");
  const nameMap = new Map<string, string>(
    (agents ?? []).map((a) => [a.id as string, a.display_name as string]),
  );

  type Item = {
    time: string;
    agent: string;
    symbol: string;
    text: string;
    cls: "up" | "down" | "neutral";
  };

  const items: Item[] = [];
  for (const t of trades ?? []) {
    const name = nameMap.get(t.agent_id as string) ?? (t.agent_id as string);
    const sideKr = t.side === "long" ? "롱" : "숏";
    const sym = symbolShort(t.symbol as string);
    const pct = Number(t.pnl_pct);
    const sign = pct >= 0 ? "+" : "";
    items.push({
      time: t.closed_at as string,
      agent: name,
      symbol: sym,
      text: `${sym} ${sideKr} 청산 · ${fmtPrice(Number(t.exit_price))} (${sign}${pct.toFixed(2)}%)`,
      cls: pct >= 0 ? "up" : "down",
    });
    items.push({
      time: t.opened_at as string,
      agent: name,
      symbol: sym,
      text: `${sym} ${sideKr} 진입 · ${fmtPrice(Number(t.entry_price))}`,
      cls: t.side === "long" ? "up" : "down",
    });
  }

  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return NextResponse.json({ items: items.slice(0, 20) });
}
