import { NextResponse } from "next/server";
import { z } from "zod";
import {
  bundleAmount,
  calcHashKey,
  ediDate,
  generateOrderNumber,
  getMerchantId,
  type BundleId,
} from "@/lib/korpay";
import { getServerUser } from "@/lib/authServer";
import { supabaseService } from "@/lib/supabase";

const Body = z.object({
  bundle: z.enum(["single", "duo", "quad", "octa"]),
  agentIds: z.array(z.string()).min(1).max(8),
});

export async function POST(req: Request) {
  const { user } = await getServerUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await req.json();
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const bundle = parsed.data.bundle as BundleId;
  const amount = bundleAmount(bundle);
  const orderNumber = generateOrderNumber();
  const ed = ediDate();
  const hashKey = calcHashKey(ed, amount);

  const sb = supabaseService();
  const { error } = await sb.from("payments").insert({
    user_id: user.id,
    order_number: orderNumber,
    amount,
    status: "requested",
    raw: { bundle, agentIds: parsed.data.agentIds },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    merchantId: getMerchantId(),
    orderNumber,
    amount,
    ediDate: ed,
    hashKey,
  });
}
