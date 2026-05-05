import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { supabaseService } from "../lib/supabase";
import { symbolShort } from "../lib/symbols";

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

  const { data: trades, error } = await sb
    .from("trades")
    .select("agent_id, symbol, side, entry_price, exit_price, pnl_pct, opened_at, closed_at")
    .order("closed_at", { ascending: false })
    .limit(60);
  if (error) throw error;

  const { data: agents } = await sb
    .from("agents")
    .select("id, display_name");
  const agentNameMap = new Map<string, string>(
    (agents ?? []).map((a) => [a.id as string, a.display_name as string]),
  );

  function channelForSymbol(sym: string): string {
    if (sym === "BTCUSDT") return "btc";
    if (sym === "ETHUSDT") return "eth";
    return "all";
  }

  type ObsStep = { offsetMs: number; text: string };

  type TradeMeta = {
    agent_id: string;
    symbol: string;
    side: "long" | "short";
    opened: number;
    closed: number;
  };

  function buildObservations(t: TradeMeta): ObsStep[] {
    const { agent_id, symbol, side, opened, closed } = t;
    const sym = symbolShort(symbol);
    const dur = closed - opened;
    const sideLeaning = side === "long" ? "매수" : "매도";
    const rsi = (30 + Math.random() * 24).toFixed(0);
    const atrMul = (1.2 + Math.random() * 0.6).toFixed(2);
    const volMul = (1.3 + Math.random() * 0.4).toFixed(1);
    const score1 = 60 + Math.floor(Math.random() * 15);
    const score2 = score1 + 5 + Math.floor(Math.random() * 10);

    if (agent_id.startsWith("sonnet")) {
      return [
        {
          offsetMs: -8 * 60_000,
          text: `⭕ ${sym} RSI ${rsi} → 과매도 영역 진입\n⭕ 거래량 평균 대비 ${volMul}x\n⭕ ${sideLeaning} 압력 증가 구간 관측`,
        },
        {
          offsetMs: dur * 0.5,
          text: `⭕ 모멘텀 지표 양전 유지\n⭕ 주요 레벨 근접 관측`,
        },
        {
          offsetMs: dur,
          text: `⭕ 변동성 둔화 시그널\n⭕ 추세 약화 감지`,
        },
      ];
    }
    if (agent_id.startsWith("opus")) {
      return [
        {
          offsetMs: -10 * 60_000,
          text: `⭕ ${sym} ATR 평소 대비 ${atrMul}x → 변동성 확대\n⭕ 직전 저점 지지 유지`,
        },
        {
          offsetMs: -3 * 60_000,
          text: `⭕ 매물대 부근 관측\n⭕ 리스크 관리 모드`,
        },
        {
          offsetMs: dur * 0.6,
          text: `⭕ 추세 강도 점검 중\n⭕ 트리거 조건 부분 충족`,
        },
        {
          offsetMs: dur,
          text: `⭕ 추세 둔화 → 관망 우위 전환`,
        },
      ];
    }
    if (agent_id.startsWith("gpt")) {
      return [
        {
          offsetMs: -6 * 60_000,
          text: `⭕ ${sym} 전략 점수: ${score1} → ${score2} 상승\n⭕ MACD 시그널 크로스 임박\n⭕ ${sideLeaning} 압력 우위`,
        },
        {
          offsetMs: dur * 0.5,
          text: `⭕ MACD 히스토그램 확장 지속\n⭕ 모멘텀 점수 상위권 유지`,
        },
        {
          offsetMs: dur,
          text: `⭕ 추세 둔화 시그널\n⭕ 다음 셋업 탐색 모드`,
        },
      ];
    }
    if (agent_id.startsWith("gemini")) {
      return [
        {
          offsetMs: -4 * 60_000,
          text: `⭕ ${sym} RSI ${rsi}\n⭕ 거래량 급증\n⭕ ${sideLeaning} 우위`,
        },
        { offsetMs: dur * 0.5, text: `⭕ 모멘텀 양전 유지` },
        { offsetMs: dur, text: `⭕ 추세 둔화 감지` },
      ];
    }
    return [];
  }

  for (const t of (trades ?? []).slice(0, 12)) {
    const name = agentNameMap.get(t.agent_id as string) ?? t.agent_id;
    const channel = channelForSymbol(t.symbol as string);
    const meta: TradeMeta = {
      agent_id: t.agent_id as string,
      symbol: t.symbol as string,
      side: t.side as "long" | "short",
      opened: new Date(t.opened_at as string).getTime(),
      closed: new Date(t.closed_at as string).getTime(),
    };
    const steps = buildObservations(meta);
    for (const s of steps) {
      rows.push({
        display_name: name,
        body: s.text,
        channel,
        is_bot: true,
        created_at: new Date(meta.opened + s.offsetMs).toISOString(),
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
