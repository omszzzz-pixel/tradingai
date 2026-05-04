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
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await sb
    .from("decisions")
    .select("decided_at, action, price")
    .eq("agent_id", agentId)
    .in("action", ["open_long", "open_short", "close"])
    .gte("decided_at", since)
    .order("decided_at", { ascending: false })
    .limit(100);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const markers = (data ?? [])
    .map((d) => ({
      time: Math.floor(new Date(d.decided_at as string).getTime() / 1000),
      action: d.action as "open_long" | "open_short" | "close",
      price: Number(d.price),
    }))
    .reverse();

  return NextResponse.json({ markers });
}
