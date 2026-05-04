import Link from "next/link";
import { BUNDLES, PRICE_PER_AGENT, bundleAmount } from "@/lib/korpay";

const cards: { id: keyof typeof BUNDLES; title: string; sub: string }[] = [
  { id: "single", title: "AI 1개", sub: "원하는 에이전트 1개" },
  { id: "duo", title: "AI 2개", sub: "12% 할인" },
  { id: "quad", title: "AI 4개", sub: "25% 할인" },
  { id: "octa", title: "AI 8개 전체", sub: "37% 할인" },
];

export default function PayPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      <h1 className="text-[18px] font-bold mb-1">구독 상품</h1>
      <p className="text-[12px] text-[var(--fg-3)] mb-5 leading-relaxed">
        AI당 월 {PRICE_PER_AGENT.toLocaleString("ko-KR")}원. 단건 결제 (자동결제 없음)
        · 구독 기간 30일 · 만료 시 무료 회원으로 전환됩니다.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {cards.map((c) => {
          const amount = bundleAmount(c.id);
          const gross = PRICE_PER_AGENT * BUNDLES[c.id].count;
          const saved = gross - amount;
          return (
            <div key={c.id} className="panel p-3 flex flex-col gap-1">
              <div className="text-[12px] font-semibold">{c.title}</div>
              <div className="text-[11px] text-[var(--fg-3)]">{c.sub}</div>
              <div className="num text-[18px] font-bold mt-2 leading-none">
                {amount.toLocaleString("ko-KR")}
                <span className="text-[11px] font-normal text-[var(--fg-3)] ml-0.5">
                  원
                </span>
              </div>
              {saved > 0 && (
                <div className="num text-[11px] text-[var(--up)]">
                  −{saved.toLocaleString("ko-KR")}원 할인
                </div>
              )}
              <Link
                href={`/pay/checkout?bundle=${c.id}`}
                className="mt-2.5 text-center text-[12px] py-1.5 rounded-[2px] bg-[var(--accent)] text-white font-medium hover:opacity-90"
              >
                결제하기
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-[11px] text-[var(--fg-3)] leading-relaxed">
        ※ 결제는 KorPay를 통해 처리되며, 환불 정책은 결제 전 안내됩니다.
        본 서비스는 투자 추천이 아닌 AI 매매 관찰 교육 플랫폼입니다.
      </div>
    </div>
  );
}
