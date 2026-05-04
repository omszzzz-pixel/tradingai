# tradingai2

AI 에이전트(Claude Sonnet 단타)가 BTC/USDT 5분봉을 페이퍼 트레이딩하는 모습을 관찰하는 교육 플랫폼.

> **면책**: 본 서비스는 AI 알고리즘 관찰 교육 플랫폼이며 투자 추천이 아닙니다. 표시되는 매매내역은 페이퍼 트레이딩(가상 잔고) 결과입니다.

## 구성

- **Frontend (Next.js 16)**: `/`(차트 + 매매내역), `/pay`(구독 결제)
- **Worker**: 5분마다 Binance에서 BTCUSDT 5분봉 200봉을 받아 지표 계산 → Claude Sonnet에 판단 요청 → 페이퍼 매매 기록
- **Supabase**: 인증(이메일 매직링크), DB(매매·결정·구독)
- **KorPay**: 단건 결제. 자동결제 없음, 구독 30일.

## MVP 범위

✅ Claude Sonnet 단타 1개 에이전트  
✅ Binance 5m 캔들 + RSI/EMA/MACD/ATR/BBands 지표  
✅ 페이퍼 트레이딩 (가상잔고 1,000만원, 잔고 20%씩 진입)  
✅ 무료(15분 지연 + 근거 숨김) / 유료(실시간 + 근거 공개)  
✅ KorPay 단건 결제

⏳ 다음(Phase 2): 나머지 7개 에이전트 / 채팅 / 리더보드 / 추천인 / 카카오·구글 OAuth / 모바일

## 셋업

1. `.env.local.example`을 `.env.local`로 복사 후 값 채우기
2. Supabase 프로젝트 생성 → SQL editor에서 `supabase-schema.sql` 실행
3. Supabase Auth → Providers → Email Magic Link 활성화, redirect URL에 `http://localhost:3000/auth/callback` 추가
4. 의존성 설치 + 실행:

```bash
npm install
npm run dev          # 프론트 (port 3000)
npm run worker       # AI 워커 (5분 간격 루프)
npm run worker:once  # 워커 1회 실행 (디버깅용)
```

## Railway 배포 (워커)

1. Railway 프로젝트 생성 → 이 repo 연결
2. 환경변수 설정 (`.env.local`과 동일 — `NEXT_PUBLIC_*`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `WORKER_TICK_MS`)
3. `railway.json`이 있어 `npm run worker`로 자동 시작됨
4. 프론트(Next.js)는 별도로 Vercel에 배포 권장

## 비용 가이드

- AI 호출: 5분마다 1회 × Sonnet (~5K input tokens, prompt caching 적용 시 90% 할인)
- Supabase Free 플랜: 매매 1,000건/일 정도까지 충분
- Railway: $5/월 (워커 1개)
- Binance REST: 무료, IP당 분당 1,200 요청

## 프로젝트 구조

```
app/
  page.tsx                # 홈 (차트 + 매매 패널)
  pay/page.tsx            # 구독 카드
  api/
    trades/route.ts       # 매매 조회 (15분 지연 + 근거 게이팅)
    pay/request/route.ts  # KorPay 결제 요청
    pay/confirm/route.ts  # KorPay 결제 확인 + 구독 생성
  auth/callback/route.ts  # Supabase OAuth 콜백
components/
  Chart.tsx               # lightweight-charts 캔들
  TradesPanel.tsx         # 매매내역 (15초 폴링)
  Header.tsx, Footer.tsx
lib/
  binance.ts              # REST 클라이언트
  indicators.ts           # RSI, EMA, MACD, ATR, BB
  agent.ts                # Claude Sonnet 호출 + JSON 파싱
  paperTrade.ts           # 포지션·매매 기록
  korpay.ts               # 결제 SDK
  supabase.ts, authServer.ts
worker/
  index.ts                # 5분 루프
  runOnce.ts              # 1회 실행
supabase-schema.sql       # DB 스키마
```
