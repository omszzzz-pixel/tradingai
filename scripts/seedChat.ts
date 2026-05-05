import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { supabaseService } from "../lib/supabase";

const USER_NAMES = [
  "코인러",
  "비트맥스",
  "트레이더김",
  "모멘텀",
  "시그널헌터",
  "차트러",
  "단타천재",
  "스윙왕",
  "익절봇",
  "손절왕",
  "알트러버",
  "AI관찰자",
  "김제이슨",
  "박트레이더",
  "최단타",
  "정스윙",
  "신규유저",
  "비트홀더",
  "온체인러",
  "롱숏대마왕",
];

const ALL_MSGS = [
  "지금 BTC 추세 어떻게 보세요?",
  "Sonnet 단타 진짜 잘하네요 ㅋㅋ",
  "리더보드 1등 누구임?",
  "유료 결제하면 근거도 다 보임?",
  "AI들이 진짜 단타 잘하는듯",
  "오늘 변동성 좀 있는 날이네요",
  "파월 발언 시간이 언제죠?",
  "지금 들어가도 됨?",
  "관망이 답이다",
  "각 모델별로 성향이 다른게 재밌네요",
  "Opus는 좀 보수적인듯",
  "Gemini는 왜 마이너스만",
  "다들 어디서 매매 정보 얻으세요",
  "이 사이트 어떻게 알게됨?",
  "차트만 봐도 시간 잘감 ㅋ",
  "리더보드 매일 바뀌나요",
  "GPT-5.4 단타 ㄴㅇㅅ",
];

const BTC_MSGS = [
  "BTC 78k 또 깨지나요",
  "RSI 30 근접인데 매수 타이밍?",
  "Sonnet이 방금 매수 들어갔네 따라가야하나",
  "MACD 골든크로스 찍힐지",
  "이번주 FOMC 영향 어떻게 보세요",
  "고점 대비 -3% 빠짐",
  "장기 추세선은 아직 살아있긴 함",
  "BTC 도미넌스 또 상승중",
  "거래량 좀 살아나는듯",
  "미국장 시작전이라 그런가",
  "지지선 한 번 더 테스트할듯",
  "Opus 단타가 방금 숏 들어간거 봤음? 용기있다",
  "역헤드앤숄더 만들어지는 중?",
  "ATR 평소 대비 1.5배네",
];

const ETH_MSGS = [
  "ETH는 BTC 따라가는 모양새",
  "도미넌스 변화 있나요",
  "L2 토큰들 분위기 어떰?",
  "BTC 따라 빠지네",
  "이더 강세장은 언제 오나",
  "스테이킹 수익률 줄었던데",
  "머지 이후로 변동성 줄긴함",
  "이더 4k 다시 보고싶다",
];

const FREE_MSGS = [
  "오늘 다들 수익 어떠셨어요",
  "주말에는 변동성 좀 줄어야하는데",
  "신규입니다 잘부탁드려요",
  "퇴근하고 차트보다가 망함 ㅠ",
  "라떼 한잔 하고 매매 ㄱㄱ",
  "월급날 d-3",
  "Sonnet 진짜 똑똑하긴 함",
  "다른 코인도 추가될까요?",
  "ETH도 매매하나요?",
  "추천인 코드는 언제 나옴",
  "관리자분 수고하십니다",
  "사이트 디자인 깔끔하네요 잘쓸게요",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTimeWithin(daysAgo: number): Date {
  const ms = Math.random() * daysAgo * 86_400_000;
  return new Date(Date.now() - ms);
}

async function main() {
  const sb = supabaseService();

  console.log("clearing existing messages...");
  await sb.from("messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const rows: Record<string, unknown>[] = [];

  function addUser(channel: string, body: string, ageDays: number) {
    rows.push({
      display_name: pick(USER_NAMES),
      body,
      channel,
      is_bot: false,
      created_at: randomTimeWithin(ageDays).toISOString(),
    });
  }

  for (const m of ALL_MSGS) addUser("all", m, 5);
  for (const m of BTC_MSGS) addUser("btc", m, 5);
  for (const m of ETH_MSGS) addUser("eth", m, 5);
  for (const m of FREE_MSGS) addUser("free", m, 5);

  for (let i = 0; i < 12; i++) addUser("all", pick(ALL_MSGS), 1);
  for (let i = 0; i < 8; i++) addUser("btc", pick(BTC_MSGS), 1);
  for (let i = 0; i < 4; i++) addUser("free", pick(FREE_MSGS), 1);

  // ─── Market Intel Bots ────────────────────────────────────────
  const MARKET_BOTS: { name: string; messages: string[] }[] = [
    {
      name: "🐳 고래봇",
      messages: [
        "0x4f5e... 지갑 → Binance: 1,200 BTC (~$96M) 입금. 평소 대비 4.5x 규모",
        "Bitfinex → Coinbase: 2,400 BTC ($192M) 이동 감지. 매도 압력 가능성",
        "Tether Treasury 활동: 100M USDT 신규 발행 → Binance 전송",
        "휴면 7년 지갑 활성화: 3,500 BTC 이동",
        "한국 거래소 입금 급증: 업비트 +840 BTC (1h)",
        "BlackRock 추정 지갑 → Coinbase Custody: 8,200 BTC 이동",
        "0x9a3f... 신규 지갑 1,500 ETH 출금 (Lido 언스테이킹 추정)",
        "Binance Hot Wallet → Cold Storage: 25,000 BTC 이동",
        "Tron Foundation: 200M USDT 추가 mint",
        "FTX Estate 지갑 활동: 12,000 SOL → Coinbase",
      ],
    },
    {
      name: "📊 펀딩비봇",
      messages: [
        "BTC 펀딩비 -0.018% (직전 -0.005%) · 롱 진영 우세 가속",
        "ETH 펀딩비 +0.025%로 급등 · 숏 우위 → 청산 압력",
        "SOL 펀딩비 -0.05% (1h -100% 변화) · 롱 압력 극단",
        "BTC 8h 누적 펀딩비 -0.12% (24h 최저)",
        "XRP 펀딩비 양전 전환 · 롱 자금 유입 가속",
        "ETH 4h 펀딩비 평균 -0.012% · 롱 우세 지속",
        "BTC 펀딩비 0% 근접 · 양 진영 균형",
      ],
    },
    {
      name: "💥 청산봇",
      messages: [
        "BTC 78,500 부근 $4.2M 롱 청산 클러스터 트리거",
        "ETH 24h 청산 총액 $128M (롱 76% / 숏 24%)",
        "1h 내 BTC 청산 $50M+ · 78,420 / 78,180 부근 집중",
        "BTCUSDT $1.5M 단일 롱 강제청산 - 78,234",
        "SOL 21만 SOL 숏 청산 (~$30M 규모)",
        "ETH 3,500 부근 $8M 롱 청산 발생",
        "전체 시장 1h 청산 $87M (롱 우세)",
      ],
    },
    {
      name: "🇰🇷 김프봇",
      messages: [
        "BTC 김프 +2.4% (한 달 최고). 출금 막힘 신호 주의",
        "업비트 KRW vs 바이낸스 USDT: BTC +3.1%, ETH +2.8%",
        "역김프 -0.5% 진입 · 한국 시장 약세 신호",
        "김프 1.8% → 2.4% (1h +0.6%p) · 한국 매수세 가속",
        "USDT 김프 1.2% → 1.6% · 차익 거래 활성",
        "ETH 김프 +1.9% (BTC 김프 +2.4% 따라감)",
        "SOL 김프 +3.2% · 알트 김프 확대",
      ],
    },
    {
      name: "🏦 상장봇",
      messages: [
        "업비트 KRW 마켓: APE 신규 상장. 14:00 거래 시작",
        "Binance Futures 신규 페어: ZRO/USDT 무기한",
        "코인원 BNB 거래 일시 중단 공지 (지갑 점검)",
        "Coinbase HYPE 상장 검토 발표",
        "업비트 BTC 일시 입출금 중단 (지갑 업그레이드)",
        "빗썸 KRW 마켓: NEW 토큰 신규 상장 예정",
        "Bybit USDT 무기한 신규 페어 5종 상장",
      ],
    },
    {
      name: "📰 뉴스봇",
      messages: [
        "BlackRock IBIT (BTC ETF) 24h 자금 유입 +$420M",
        "SEC, 이더리움 ETF 신청서 추가 코멘트 요청",
        "마이크로스트래티지, BTC 5,400개 추가 매입 발표",
        "Tether: 신규 USDT 1B mint (지난 1주 누적 4.5B)",
        "Galaxy Digital, 채굴 자회사 매각 발표",
        "Fidelity FBTC 24h 자금 유입 +$180M",
        "Grayscale GBTC 24h 자금 유출 -$92M (12일 연속)",
        "Solana Foundation: 검증인 보상 정책 변경 발표",
      ],
    },
    {
      name: "⚡ OI봇",
      messages: [
        "BTC 미결제약정 1h 변화: +2.4% (포지션 증가 · 추세 강화)",
        "ETH OI 24h: -3.8% (포지션 감소 · 청산 영향)",
        "SOL 무기한 OI $850M 도달 (역대 2위)",
        "BTCUSDT 선물 OI 신고가 갱신",
        "1h 내 BTC OI 급감 -5% · 대규모 청산 신호",
        "ETH OI 1h +1.8% · 신규 진입 우세",
      ],
    },
    {
      name: "⏰ 거시봇",
      messages: [
        "오늘 22:30 (KST) 美 CPI 발표 예정 · 변동성 주의",
        "FOMC 12월 회의 14일 새벽 4시 (KST)",
        "中 PBoC 금리 동결 발표",
        "DXY 105.6 (1주일 최고) · 위험자산 압박",
        "美 10년물 4.42% (전일 4.38%) · 채권 수익률 상승",
        "나스닥 -1.2% 마감 · 위험자산 약세 분위기",
        "美 비농업 고용 +180K (예상 +210K) · 약세",
        "ECB 금리 동결 결정 · 유로존 인플레 안정화 멘트",
      ],
    },
  ];

  // Spread market intel messages over the last 48 hours.
  // Each bot posts ~6-10 messages, randomly distributed.
  for (const bot of MARKET_BOTS) {
    const count = 6 + Math.floor(Math.random() * 4);
    const used = new Set<number>();
    for (let i = 0; i < count; i++) {
      let idx: number;
      let attempts = 0;
      do {
        idx = Math.floor(Math.random() * bot.messages.length);
        attempts++;
      } while (used.has(idx) && attempts < bot.messages.length);
      used.add(idx);
      const ageMs = Math.random() * 48 * 3600_000;
      rows.push({
        display_name: bot.name,
        body: bot.messages[idx],
        channel: "intel",
        is_bot: true,
        created_at: new Date(Date.now() - ageMs).toISOString(),
      });
    }
  }

  rows.sort(
    (a, b) =>
      new Date(a.created_at as string).getTime() -
      new Date(b.created_at as string).getTime(),
  );

  console.log(`inserting ${rows.length} messages...`);
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error: ie } = await sb.from("messages").insert(batch);
    if (ie) throw ie;
  }
  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
