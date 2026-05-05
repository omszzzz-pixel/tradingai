-- Migration 005: stance accuracy tracking (Plan B - replace trade-based win rate)
-- 각 AI 토론 stance 발화 후 N시간 뒤 가격 변동과 비교해 정답 여부 평가

create table if not exists stance_outcomes (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  agent_id text not null,
  stance text not null check (stance in ('long', 'short', 'neutral')),
  symbol text,
  evaluated_at timestamptz not null default now(),
  price_at_stance numeric,
  price_after numeric,
  -- correct = stance와 가격 변동 일치 여부
  correct boolean,
  -- "● 관망" 은 변동성이 작으면 정답으로 간주 (±0.5% 이내)
  pct_change numeric,
  unique(message_id)
);

create index if not exists stance_outcomes_agent on stance_outcomes(agent_id);
create index if not exists stance_outcomes_correct on stance_outcomes(agent_id, correct);
