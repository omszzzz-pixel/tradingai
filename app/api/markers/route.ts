import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agent");
  if (!agentId) {
    return NextResponse.json({ error: "agent required" }, { status: 400 });
  }

  const sb = supabaseService();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const { data, error } = await sb
    .from("trades")
    .select("opened_at, closed_at, side, entry_price, exit_price, pnl_pct")
    .eq("agent_id", agentId)
    .gte("opened_at", since)
    .order("opened_at", { ascending: true })
    .limit(60);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type M = {
    time: number;
    action: "open_long" | "open_short" | "close";
    price: number;
    pnl_pct?: number;
  };
  const markers: M[] = [];

  for (const t of data ?? []) {
    const openTime = Math.floor(
      new Date(t.opened_at as string).getTime() / 1000,
    );
    const closeTime = Math.floor(
      new Date(t.closed_at as string).getTime() / 1000,
    );
    markers.push({
      time: openTime,
      action: (t.side as string) === "long" ? "open_long" : "open_short",
      price: Number(t.entry_price),
    });
    markers.push({
      time: closeTime,
      action: "close",
      price: Number(t.exit_price),
      pnl_pct: Number(t.pnl_pct),
    });
  }

  return NextResponse.json({ markers });
}
