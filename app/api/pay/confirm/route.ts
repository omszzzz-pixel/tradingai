import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmPayment } from "@/lib/korpay";
import { supabaseService } from "@/lib/supabase";
import { getServerUser } from "@/lib/authServer";

const Body = z.object({
  paymentKey: z.string().min(1),
  orderNumber: z.string().min(1),
});

const SUBSCRIPTION_DAYS = 30;

export async function POST(req: Request) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const { paymentKey, orderNumber } = parsed.data;

  const result = await confirmPayment(paymentKey);
  const sb = supabaseService();

  await sb.from("payments").insert({
    user_id: user.id,
    order_number: orderNumber,
    payment_key: paymentKey,
    amount: Number((result.data?.amount as number) ?? 0),
    status: result.ok ? "confirmed" : "failed",
    raw: result.data,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, status: result.status, data: result.data },
      { status: 400 },
    );
  }

  const { data: req0 } = await sb
    .from("payments")
    .select("raw, amount")
    .eq("order_number", orderNumber)
    .eq("status", "requested")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const agentIds = ((req0?.raw as { agentIds?: string[] } | null)?.agentIds ?? []) as string[];
  const expiresAt = new Date(Date.now() + SUBSCRIPTION_DAYS * 86_400_000).toISOString();
  const perAgent = agentIds.length > 0 ? Number(req0?.amount ?? 0) / agentIds.length : 0;

  if (agentIds.length > 0) {
    await sb.from("subscriptions").insert(
      agentIds.map((a) => ({
        user_id: user.id,
        agent_id: a,
        expires_at: expiresAt,
        payment_key: paymentKey,
        order_number: orderNumber,
        amount: perAgent,
        status: "active",
      })),
    );
  }

  return NextResponse.json({ ok: true });
}
