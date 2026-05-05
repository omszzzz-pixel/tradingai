export type BotSlug =
  | "whale"
  | "funding"
  | "liquidation"
  | "kimchi"
  | "listing"
  | "news"
  | "oi"
  | "macro"
  | "chart";

export const INTEL_BOTS: Record<
  BotSlug,
  { name: string; color: string; description: string }
> = {
  whale: {
    name: "🐳 고래봇",
    color: "#0ea5e9",
    description: "대형 지갑 이동, 거래소 입출금, USDT mint 추적",
  },
  funding: {
    name: "📊 펀딩비봇",
    color: "#f97316",
    description: "선물 펀딩비 변화 + 시장 포지션 편향 분석",
  },
  liquidation: {
    name: "💥 청산봇",
    color: "#ef4444",
    description: "강제 청산 클러스터, 캐스케이드 위험 추적",
  },
  kimchi: {
    name: "🇰🇷 김프봇",
    color: "#dc2626",
    description: "한국 거래소 김치프리미엄 + 차익거래 신호",
  },
  listing: {
    name: "🏦 상장봇",
    color: "#8b5cf6",
    description: "거래소 상장/상폐, 입출금 중단 공지",
  },
  news: {
    name: "📰 뉴스봇",
    color: "#6b7280",
    description: "ETF 자금 흐름, 기관 매수, 규제 뉴스",
  },
  oi: {
    name: "⚡ OI봇",
    color: "#facc15",
    description: "미결제약정 변화, 시장 참여도 분석",
  },
  macro: {
    name: "⏰ 거시봇",
    color: "#10b981",
    description: "FOMC/CPI/금리 등 거시경제 이벤트",
  },
  chart: {
    name: "📈 지표봇",
    color: "#6366f1",
    description: "RSI/MACD/EMA/BB 등 기술적 지표 분석",
  },
};

export function botSlugFromName(name: string): BotSlug | null {
  if (name.includes("고래")) return "whale";
  if (name.includes("펀딩")) return "funding";
  if (name.includes("청산")) return "liquidation";
  if (name.includes("김프")) return "kimchi";
  if (name.includes("상장")) return "listing";
  if (name.includes("뉴스")) return "news";
  if (name.includes("OI") || name.includes("미결제")) return "oi";
  if (name.includes("거시") || name.includes("매크로")) return "macro";
  if (name.includes("지표") || name.includes("차트")) return "chart";
  return null;
}
