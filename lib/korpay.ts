import crypto from "crypto";

const MERCHANT_ID = process.env.KORPAY_MID || "";
const MKEY = process.env.KORPAY_MKEY || "";
const BASE_URL =
  process.env.KORPAY_BASE_URL || "https://payments.korpay.com/v1";

export const KORPAY_BASE_URL = BASE_URL;

export const PRICE_PER_AGENT = 19900;

export const BUNDLES = {
  single: { count: 1, discountPct: 0 },
  duo: { count: 2, discountPct: 12 },
  quad: { count: 4, discountPct: 25 },
  octa: { count: 8, discountPct: 37 },
} as const;
export type BundleId = keyof typeof BUNDLES;

export function bundleAmount(bundle: BundleId): number {
  const b = BUNDLES[bundle];
  const gross = PRICE_PER_AGENT * b.count;
  return Math.round((gross * (100 - b.discountPct)) / 100);
}

export function getMerchantId(): string {
  return MERCHANT_ID;
}

export function getBaseUrl(): string {
  return BASE_URL;
}

/** SHA-256(merchantId + ediDate + amount + mkey). */
export function calcHashKey(ediDate: string, amount: number): string {
  return crypto
    .createHash("sha256")
    .update(MERCHANT_ID + ediDate + String(amount) + MKEY)
    .digest("hex");
}

/** YYYYMMDDHHmmss in KST. */
export function ediDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  const h = String(kst.getUTCHours()).padStart(2, "0");
  const mi = String(kst.getUTCMinutes()).padStart(2, "0");
  const s = String(kst.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}${h}${mi}${s}`;
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `TA${ts}${rand}`.replace(/[^A-Z0-9]/g, "");
}

export async function confirmPayment(
  paymentKey: string,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const query = new URLSearchParams({ paymentKey }).toString();
  try {
    const res = await fetch(`${BASE_URL}/payments/confirm?${query}`, {
      method: "POST",
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}
