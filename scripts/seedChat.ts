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
  // 각 봇은 "사실 + 캐릭터 코멘트(📌)" 형식. 해석은 관찰형/확률형 (투자 권유 X)
  const MARKET_BOTS: { name: string; messages: string[] }[] = [
    {
      name: "🐳 고래봇",
      messages: [
        `0x4f5e... 지갑 → Binance 입금: 1,200 BTC (~$96M)
평소 입금 패턴의 4.5배 규모

📌 이 정도 사이즈는 거래소 매도 의도 케이스가 많음.
   다만 OTC 거래나 다른 거래소 재이동일 가능성도. 다음 24h 추적 가치 있음`,

        `Bitfinex → Coinbase: 2,400 BTC ($192M) 단일 트랜잭션
한 번에 옮긴 사이즈로 역대 30위권

📌 거래소 간 대규모 이동은 보통 기관 자금 리밸런싱.
   Coinbase Custody면 기관 매수 보관, hot wallet이면 매도 준비 시그널`,

        `Tether Treasury 활동: 100M USDT 신규 mint → Binance 전송
이번 주 누적 mint 1.2B USDT

📌 USDT mint 증가 = 시장에 매수 자금 공급 신호로 자주 해석됨.
   다만 mint한다고 즉시 시장가 매수 들어오는 건 아님`,

        `휴면 7년 지갑 활성화 감지: 3,500 BTC 이동
2018년 마지막 활동 후 첫 움직임

📌 장기 휴면 지갑이 깨어나면 보통 매도 의심받음.
   과거 사례: 비슷한 케이스 70%가 30일 내 일부 매도로 확인됨`,

        `한국 거래소 입금 급증: 업비트 +840 BTC (1h)
평소 대비 6배 수준

📌 한국 거래소 BTC 입금 급증 = 한국 트레이더 매도 압력 신호.
   김프 정점에서 자주 관측되는 패턴`,

        `BlackRock 추정 지갑 → Coinbase Custody: 8,200 BTC ($655M)
ETF 자금 유입과 시간대 일치

📌 ETF 자금이 Custody로 이동하는 패턴.
   IBIT 24h 유입과 교차 검증 가치 있음`,

        `0x9a3f... 신규 지갑 → 1,500 ETH 출금
Lido 언스테이킹 → 거래소 미경유

📌 언스테이킹 직후 거래소 안 가면 매도 의도 약함.
   대출 담보로 활용하거나 디파이 재배치 가능성`,

        `Binance Hot Wallet → Cold Storage: 25,000 BTC ($2B+)
정기 자금 정리로 추정

📌 거래소 자체 운영. 시장 영향 거의 없음.
   다만 Hot wallet 잔고 줄면 일부 사용자 출금 지연 가능`,

        `FTX Estate 지갑 활동: 12,000 SOL → Coinbase
파산 자산 청산 흐름의 일부

📌 FTX 잔액 청산은 SOL 매도 부담 요인으로 자주 거론됨.
   다만 시장은 이미 알고 있어 충격은 제한적인 경향`,

        `0xb1e2... 신규 휴면 깨어남: 5,000 ETH (8년 보유)
오늘 새벽 활동 시작

📌 8년 묵힌 ETH 활성화. 매수가 대비 수익률 200x+ 추정.
   매도 가능성 대비, 알림 켜둘 만함`,
      ],
    },
    {
      name: "📊 펀딩비봇",
      messages: [
        `BTC 펀딩비 -0.018% (직전 -0.005%)
3시간 연속 하락, 24h 최저 갱신

📌 음수 펀딩비 = 숏이 롱에게 비용 지불 = 롱 우세 시장.
   과거 -0.02% 도달 시 단기 반등 빈도 높음. 다만 펀딩비만으론 결정 어려움`,

        `ETH 펀딩비 +0.025%로 급등
숏 진영 비용 부담 가속화

📌 양수 펀딩비는 시장에 숏이 많다는 신호.
   숏 스퀴즈 (강제 청산 캐스케이드) 가능성 1단계`,

        `SOL 펀딩비 -0.05% (1h 변화율 -100%)
역대급 음수 영역 진입

📌 펀딩비 극단치는 보통 단기 추세 전환 신호.
   롱이 너무 많아 펀딩비를 내고 있는 상황. 정점 신호일 수 있음`,

        `BTC 8h 누적 펀딩비 -0.12% (24h 최저)
연속 음수 7세션째

📌 누적 음수 펀딩비는 롱 진영의 끈기 신호.
   하지만 6세션 이상 지속되면 보통 전환 가까움`,

        `XRP 펀딩비 양전 전환 (-0.012% → +0.008%)
12시간 만의 흐름 변화

📌 펀딩비 전환은 포지션 흐름이 바뀌고 있다는 신호.
   가격 추종 신호는 아니지만 분위기 변화 인지에 유용`,

        `ETH 4h 펀딩비 평균 -0.012%
24h 평균 -0.009%에서 가속

📌 4h 평균이 24h 평균보다 음수면 단기 롱 우위 가속.
   추세 추종 트레이더가 진입할 만한 환경`,

        `BTC 펀딩비 0% 근접 (-0.001%)
양 진영 거의 균형

📌 펀딩비 중립 = 시장 의견 갈림.
   보통 큰 변동성 직전에 자주 나타나는 패턴`,
      ],
    },
    {
      name: "💥 청산봇",
      messages: [
        `BTC 78,500 부근 $4.2M 롱 청산 클러스터 트리거
다음 청산 구간: 78,200 / 77,900

⚡ 큰 청산 한 번 터지면 캐스케이드 잘 옴.
   가격이 청산 레벨 사냥하며 흘러갈 가능성. 78,000 라인이 핵심`,

        `ETH 24h 청산 총액 $128M (롱 76% / 숏 24%)
시간대별 가장 큰 시점: 04:30 KST

⚡ 롱 76%는 명확히 일방적. 숏 진영 무사고 통과.
   롱이 추가로 들어오면 캐스케이드 한 번 더 가능`,

        `1h 내 BTC 청산 $50M+
78,420 / 78,180 부근 집중

⚡ 좁은 가격대에 청산 몰림 = 가격이 그 라인 사이에서 흔들리는 중.
   곧 한 방향으로 큰 움직임 나올 확률 높음`,

        `BTCUSDT $1.5M 단일 롱 강제청산
포지션 보유자 추정 손실 -$200K

⚡ 큰 단일 청산은 시장 노이즈. 추세에 큰 영향은 작은 편.
   다만 같은 가격대에 묶인 포지션이 줄줄이 있으면 확장 가능성`,

        `SOL 21만 SOL 숏 청산 (~$30M)
20분 내 가격 +4.2% 급등

⚡ 숏 스퀴즈 진행. 모멘텀 트레이더가 진입할 만한 환경.
   다만 스퀴즈는 보통 단기 이벤트. 24h 후 되돌림 자주 옴`,

        `ETH 3,500 부근 $8M 롱 청산
직전 1h 동안 가장 큰 청산

⚡ 라운드 넘버에서 청산 자주 발생.
   3,500 못 지키면 3,400대까지 추가 청산 가능 영역`,

        `전체 시장 1h 청산 $87M (롱 우세)
24h 평균 대비 3.2배

⚡ 1시간에 평균의 3배 청산은 강한 신호.
   변동성 폭발 단계. 진입은 신중히, 사이즈 줄이는 시점`,
      ],
    },
    {
      name: "🇰🇷 김프봇",
      messages: [
        `BTC 김프 +2.4% (한 달 최고)
업비트 출금 한도 도달 가능성

📌 김프 2% 넘으면 한국 매수세 폭증 단계.
   다만 정점에서 들어가면 물리는 패턴 잦음. 특히 출금 막히면 차익 게임 끝`,

        `업비트 KRW vs 바이낸스 USDT: BTC +3.1%, ETH +2.8%
ETH 김프가 BTC 김프 따라감

📌 알트 김프가 BTC 따라가는 건 일반적.
   알트가 더 크게 벌어지면 한국 알트 시즌 신호`,

        `역김프 -0.5% 진입
한국 시장 약세 신호

📌 역김프는 한국이 글로벌보다 먼저 빠지는 신호로 자주 해석됨.
   직전 큰 폭락 전에 자주 나타난 패턴`,

        `김프 1.8% → 2.4% (1h +0.6%p)
한국 매수세 급가속

📌 단시간 김프 점프는 한국 트레이더 FOMO 시그널.
   재미는 있지만 정점 근접 신호로도 자주 작동`,

        `USDT 김프 1.2% → 1.6%
스테이블 차익 거래 활성화

📌 USDT 김프는 환율 + 한국 매수세 합쳐진 지표.
   1.5% 넘으면 차익 거래자들 대량 유입 시점`,

        `ETH 김프 +1.9% (BTC 김프 +2.4% 추격)
직전 24h 동조성 강함

📌 알트 김프가 BTC 따라잡으면 보통 추세 후반.
   초반엔 BTC만, 후반엔 알트가 따라가는 패턴`,

        `SOL 김프 +3.2% · 알트 김프 확대
한국 알트 회귀 신호?

📌 알트 김프 3% 넘으면 한국 알트 시즌 진입 가능성.
   다만 펌프-덤프 패턴 자주 동반. 사이즈 관리 중요`,
      ],
    },
    {
      name: "🏦 상장봇",
      messages: [
        `업비트 KRW: APE 신규 상장 공지
14:00 KST 거래 시작

📌 업비트 KRW 신규 상장 = 한국형 펌프 시즌.
   초반 30분~1h이 가장 큰 변동성. 이후 보통 50% 되돌림 패턴`,

        `Binance Futures 신규 페어: ZRO/USDT 무기한
최대 레버리지 50x

📌 신규 무기한 상장 = 펀딩비 변동성 극심.
   초반 24h는 가격 발견 단계, 양방향 청산 빈번`,

        `코인원 BNB 거래 일시 중단 공지
지갑 점검 (예상 4시간)

📌 거래 중단 중 차익거래 차단됨.
   재개 직후 가격 조정 (재밸런싱) 자주 발생`,

        `Coinbase HYPE 상장 검토 발표
공식 상장은 미정

📌 Coinbase는 검토 발표만으로도 가격 영향 큼.
   "Coinbase effect" — 검토 발표 후 평균 +25% 패턴`,

        `업비트 BTC 일시 입출금 중단
지갑 업그레이드 (예상 6시간)

📌 BTC 입출금 막히면 김프 변동성 폭증.
   김프 정점에서 자주 발생. 차익거래자 영향 큼`,

        `빗썸 KRW: NEW 토큰 신규 상장 예정
거래 시작 16:00

📌 빗썸 신규 상장은 업비트 대비 펌프 약함.
   다만 동시 상장이면 효과 합산되어 강한 변동성`,

        `Bybit USDT 무기한 신규 페어 5종 상장
모두 미드캡 알트

📌 단일 거래소 다수 상장은 이벤트 분산 효과.
   개별 종목 영향은 제한적, 다만 거래소 활동 신호로 봄`,
      ],
    },
    {
      name: "📰 뉴스봇",
      messages: [
        `BlackRock IBIT (BTC ETF) 24h 자금 유입 +$420M
주간 누적 +$1.8B

📌 ETF 자금은 BTC 가격에 1-3일 후행 반영 경향.
   유출 전환되면 단기 약세 신호. 현재는 강한 매수세 단계`,

        `SEC, 이더리움 ETF 신청서 추가 코멘트 요청
승인 일정 1-2개월 지연 가능

📌 SEC 코멘트 요청은 보통 절차적. 승인 거부 신호는 아님.
   다만 단기 ETH 가격에는 약세 압박`,

        `마이크로스트래티지 추가 매입: 5,400 BTC ($432M)
보유 총량 280,000+ BTC 도달

📌 MSTR 매입은 보통 단계적 + 미리 공시 패턴.
   기관 매수 지속 신호. 다만 가격 임팩트는 점점 작아지는 추세`,

        `Tether: 신규 USDT 1B mint (지난 1주 누적 4.5B)
Tron 체인에서 진행

📌 USDT mint 누적 증가는 매수 자금 유입 가능성 신호.
   다만 mint = 즉시 매수가 아니므로 시점 차이 큼`,

        `Galaxy Digital, 채굴 자회사 매각 발표
$1.2B 규모

📌 채굴자 자산 매각은 보통 BTC 매도 동반.
   직접 매도가 아니라도 회사 BTC 보유 변화는 시장 노이즈`,

        `Fidelity FBTC 24h 자금 유입 +$180M
ETF 시장 점유율 2위 유지

📌 FBTC도 IBIT 따라가는 흐름.
   기관 매수 지속 단계의 부속 신호`,

        `Grayscale GBTC 24h 자금 유출 -$92M (12일 연속)
누적 유출 14B+ 달성

📌 GBTC 유출은 IBIT/FBTC로 이전 케이스가 많음.
   단순 매도 아닌 ETF 갈아타기일 수 있음`,

        `Solana Foundation: 검증인 보상 정책 변경 발표
Q1 시행 예정

📌 보상 정책 변화는 SOL 인플레이션 영향.
   장기적으로 가격에 영향, 단기 임팩트는 제한적`,
      ],
    },
    {
      name: "⚡ OI봇",
      messages: [
        `BTC 미결제약정 1h: +2.4% ($340M 증가)
거래량 1.6x 동반

📌 OI↑ + 가격↑ = 신규 롱 진입 (강한 신호)
   OI↑ + 가격↓ = 신규 숏 진입
   현재 패턴 + 가격 동반 상승 → 추세 강화 단계`,

        `ETH OI 24h: -3.8% ($120M 감소)
청산 영향 추정

📌 OI 감소 = 포지션 정리.
   가격 변동 동반 + OI 감소면 포지션 청산 우세`,

        `SOL 무기한 OI $850M 도달 (역대 2위)
1주일 +12% 증가

📌 OI 신고가 권은 변동성 폭발 직전 신호.
   양방향 모두 청산 위험 큰 영역`,

        `BTCUSDT 선물 OI 신고가 갱신
$32B 도달

📌 OI 신고가는 시장 참여 최대치.
   고점에서는 청산 캐스케이드 위험도 동반 최고치`,

        `1h 내 BTC OI 급감 -5%
대규모 청산 신호

📌 OI 급감 + 가격 큰 변동 = 강제 청산 발생 신호.
   변동 끝나면 보통 단기 안정화 들어감`,

        `ETH OI 1h +1.8% (가격 +0.8%)
신규 진입 우세

📌 OI 가격 동반 상승 = 신규 롱 진입.
   추세 추종 신호. 다만 펀딩비 동시 확인 필요`,
      ],
    },
    {
      name: "⏰ 거시봇",
      messages: [
        `오늘 22:30 (KST) 美 CPI 발표 예정
헤드라인 예상치 +2.4% YoY (전월 +2.6%)

📌 CPI 둔화 → 금리 인하 기대 → 위험자산 강세 일반적.
   다만 컨센서스 부합 정도가 핵심. 발표 직후 30분 변동성 폭증 시간대`,

        `FOMC 12월 회의 14일 새벽 4시 (KST)
시장 예상: 25bp 인하

📌 FOMC는 발표 자체보다 파월 기자회견 톤이 중요.
   매파/비둘기파 정도에 따라 BTC 변동 5%+ 자주 발생`,

        `中 PBoC 금리 동결 발표
LPR 1년 3.10% 유지

📌 중국 통화정책은 신흥시장 위험자산 영향.
   동결은 단기 중립, 다만 부양책 지연 시 위험자산 압박 가능`,

        `DXY 105.6 (1주일 최고)
달러 강세 가속

📌 DXY ↑ = 보통 BTC ↓ (역상관 0.6 수준)
   다만 단기적으로 어긋나는 시기도 자주 옴`,

        `美 10년물 4.42% (전일 4.38%)
채권 수익률 상승 지속

📌 10년물 ↑ = 위험자산 압박.
   4.5% 돌파 시 BTC 단기 약세 자주 동반`,

        `나스닥 -1.2% 마감
빅테크 약세 주도

📌 BTC-나스닥 상관도 0.7 수준 유지.
   미장 약세는 야간 KST 코인 시장에 압박 자주 옴`,

        `美 비농업 고용 +180K (예상 +210K)
약세 서프라이즈

📌 고용 약세 = 금리 인하 기대 = 위험자산 강세 패턴.
   다만 너무 약하면 경기침체 우려로 반전 가능`,

        `ECB 금리 동결 결정
유로존 인플레 안정화 멘트

📌 유로존 동결은 글로벌 통화정책 동조 신호.
   BTC 변동성 직접 영향은 작음`,
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
