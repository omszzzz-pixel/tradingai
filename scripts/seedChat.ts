import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { supabaseService } from "../lib/supabase";
import { fmtPrice, symbolShort } from "../lib/symbols";

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
    .select("id, agent_id, symbol, side, entry_price, exit_price, pnl_pct, opened_at, closed_at")
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

  type AgentKey = "sonnet" | "opus" | "gpt" | "gemini";

  const ENTRY_REASONS: Record<AgentKey, string[]> = {
    sonnet: [
      "RSI {rsi} 과매도 + EMA20 돌파",
      "지지선 회복 + 거래량 {volMul}x",
      "BB 하단 반등 시그널 포착",
      "단기 매수 압력 증가",
      "모멘텀 양전 + 추세 회복",
    ],
    opus: [
      "ATR {atrMul}x 확장 + 매수 우위",
      "분할 진입 1차, 손익비 양호",
      "지지선 더블탑 확인",
      "변동성 확장 + 매물대 이탈",
      "주요 레벨 돌파 시그널",
    ],
    gpt: [
      "전략 점수 {s1}→{s2}, MACD 크로스",
      "거래량 {volMul}x + RSI 과매도",
      "모멘텀 점수 상위권 진입",
      "MACD 시그널 라인 상방 + 히스토그램 양전",
      "RSI({rsi}) + MACD 동조 시그널",
    ],
    gemini: [
      "RSI 과매도",
      "거래량 급증",
      "매수 우위",
      "모멘텀 양전",
    ],
  };

  const EXIT_REASONS: Record<AgentKey, string[]> = {
    sonnet: [
      "1차 익절 라인 도달",
      "MACD 약화 시그널",
      "추세 둔화 감지, 보수적 정리",
      "변동성 둔화",
      "주요 저항 부근 도달",
    ],
    opus: [
      "리스크 관리선 도달",
      "추세 약화 → 보수적 청산",
      "트레일링 스탑 작동",
      "주요 저항 부근 청산",
      "변동성 축소 → 사이즈 정리",
    ],
    gpt: [
      "R:R 1:2 도달",
      "히스토그램 둔화 감지",
      "전략 점수 하락 ({s2}→{s1})",
      "MACD 시그널 약화",
      "거래량 감소 + 모멘텀 둔화",
    ],
    gemini: [
      "익절",
      "추세 둔화",
      "모멘텀 약화",
      "정리",
    ],
  };

  function pickFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function tmpl(s: string, vars: Record<string, string>): string {
    return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  }

  function agentKey(agentId: string): AgentKey {
    if (agentId.startsWith("sonnet")) return "sonnet";
    if (agentId.startsWith("opus")) return "opus";
    if (agentId.startsWith("gpt")) return "gpt";
    return "gemini";
  }

  function fmtTimeKr(ms: number): string {
    const d = new Date(ms);
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(d)
      .replace(/\./g, "/")
      .replace(/\/\s/g, " ")
      .replace(/\/$/, "");
  }

  type SummaryMeta = {
    agent_id: string;
    symbol: string;
    side: "long" | "short";
    entry: number;
    exit: number;
    opened: number;
    closed: number;
    pnlPct: number;
  };

  function buildSummary(t: SummaryMeta): string {
    const key = agentKey(t.agent_id);
    const vars = {
      rsi: String(28 + Math.floor(Math.random() * 25)),
      volMul: (1.2 + Math.random() * 0.5).toFixed(1),
      atrMul: (1.2 + Math.random() * 0.6).toFixed(1),
      s1: String(60 + Math.floor(Math.random() * 15)),
      s2: String(75 + Math.floor(Math.random() * 15)),
    };
    const entryReason = tmpl(pickFrom(ENTRY_REASONS[key]), vars);
    const exitReason = tmpl(pickFrom(EXIT_REASONS[key]), vars);
    const sym = symbolShort(t.symbol);
    const sideKr = t.side === "long" ? "롱" : "숏";
    const sign = t.pnlPct >= 0 ? "+" : "";
    const pnl = `${sign}${t.pnlPct.toFixed(2)}%`;

    return `${sym} ${sideKr} 매매 종료 · ${pnl}

진입 ${fmtTimeKr(t.opened)} · ${fmtPrice(t.entry)}
근거 · ${entryReason}

청산 ${fmtTimeKr(t.closed)} · ${fmtPrice(t.exit)}
근거 · ${exitReason}`;
  }

  for (const t of (trades ?? []).slice(0, 16)) {
    const name = agentNameMap.get(t.agent_id as string) ?? t.agent_id;
    const channel = channelForSymbol(t.symbol as string);
    const meta: SummaryMeta = {
      agent_id: t.agent_id as string,
      symbol: t.symbol as string,
      side: t.side as "long" | "short",
      entry: Number(t.entry_price),
      exit: Number(t.exit_price),
      opened: new Date(t.opened_at as string).getTime(),
      closed: new Date(t.closed_at as string).getTime(),
      pnlPct: Number(t.pnl_pct),
    };
    rows.push({
      display_name: name,
      body: buildSummary(meta),
      channel,
      is_bot: true,
      trade_id: t.id,
      created_at: new Date(meta.closed).toISOString(),
    });
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
