import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase";
import { getServerUser } from "@/lib/authServer";

export const dynamic = "force-dynamic";

const Body = z.object({
  body: z.string().min(1).max(500),
  channel: z.enum(["all", "btc", "eth", "free"]).default("all"),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel") ?? "all";
  const sb = supabaseService();
  const { data, error } = await sb
    .from("messages")
    .select("id, display_name, body, channel, is_bot, created_at")
    .eq("channel", channel)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ messages: (data ?? []).reverse() });
}

export async function POST(req: Request) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const sb = supabaseService();
  const display = (user.email ?? "").split("@")[0] || "익명";
  const { error } = await sb.from("messages").insert({
    user_id: user.id,
    display_name: display,
    body: parsed.data.body,
    channel: parsed.data.channel,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
