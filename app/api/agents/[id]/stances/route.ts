import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type StanceRow = {
  id: string;
  stance: "long" | "short" | "neutral";
  symbol: string | null;
  correct: boolean | null;
  pct_change: number | null;
  evaluated_at: string;
  message_id: string;
};

type MsgRow = {
  id: string;
  body: string;
  created_at: string;
  parent_message_id: string | null;
};

type ParentRow = {
  id: string;
  body: string;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const sb = supabaseService();

  const { data: outcomes, error: oErr } = await sb
    .from("stance_outcomes")
    .select("id, stance, symbol, correct, pct_change, evaluated_at, message_id")
    .eq("agent_id", id)
    .order("evaluated_at", { ascending: false })
    .limit(40);

  if (oErr) {
    return NextResponse.json({ error: oErr.message }, { status: 500 });
  }

  const list = (outcomes ?? []) as StanceRow[];
  const msgIds = list.map((o) => o.message_id);

  const msgsById = new Map<string, MsgRow>();
  const parentsById = new Map<string, ParentRow>();

  if (msgIds.length > 0) {
    const { data: msgs } = await sb
      .from("messages")
      .select("id, body, created_at, parent_message_id")
      .in("id", msgIds);
    for (const m of (msgs ?? []) as MsgRow[]) msgsById.set(m.id, m);

    const parentIds = Array.from(
      new Set(
        ((msgs ?? []) as MsgRow[])
          .map((m) => m.parent_message_id)
          .filter((x): x is string => !!x),
      ),
    );
    if (parentIds.length > 0) {
      const { data: parents } = await sb
        .from("messages")
        .select("id, body")
        .in("id", parentIds);
      for (const p of (parents ?? []) as ParentRow[])
        parentsById.set(p.id, p);
    }
  }

  const rows = list.map((o) => {
    const m = msgsById.get(o.message_id);
    const parent = m?.parent_message_id
      ? parentsById.get(m.parent_message_id)
      : null;
    return {
      id: o.id,
      stance: o.stance,
      symbol: o.symbol,
      correct: o.correct,
      pct_change: o.pct_change,
      evaluated_at: o.evaluated_at,
      body: m?.body ?? "",
      created_at: m?.created_at ?? o.evaluated_at,
      intel_headline: parent?.body?.split("\n")[0] ?? null,
    };
  });

  return NextResponse.json({ rows });
}
