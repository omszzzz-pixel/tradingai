-- tradingai2 schema
-- Run in Supabase SQL editor (service role).

create extension if not exists "pgcrypto";

-- profiles: maps to auth.users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- agents: AI traders. MVP seeds one row.
create table if not exists agents (
  id text primary key,
  display_name text not null,
  model text not null,
  style text not null check (style in ('scalp','swing')),
  symbol text not null default 'BTCUSDT',
  timeframe text not null default '5m',
  starting_balance numeric not null default 10000000,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- candles: cached 5m klines from Binance (last ~500 bars per symbol)
create table if not exists candles (
  symbol text not null,
  timeframe text not null,
  open_time bigint not null,
  open numeric not null,
  high numeric not null,
  low numeric not null,
  close numeric not null,
  volume numeric not null,
  close_time bigint not null,
  primary key (symbol, timeframe, open_time)
);
create index if not exists candles_symbol_tf_time on candles(symbol, timeframe, open_time desc);

-- decisions: every AI invocation, including reasoning (gated to paid users)
create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null references agents(id) on delete cascade,
  decided_at timestamptz not null default now(),
  symbol text not null,
  action text not null check (action in ('open_long','open_short','close','hold')),
  price numeric not null,
  indicators jsonb not null default '{}'::jsonb,
  reasoning text,
  raw_response text
);
create index if not exists decisions_agent_time on decisions(agent_id, decided_at desc);

-- positions: currently open paper position per agent (MVP: at most 1 open)
create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null references agents(id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('long','short')),
  entry_price numeric not null,
  size numeric not null,
  opened_at timestamptz not null default now(),
  decision_id uuid references decisions(id)
);
create index if not exists positions_agent on positions(agent_id);

-- trades: closed round-trip trades (entry + exit)
create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null references agents(id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('long','short')),
  entry_price numeric not null,
  exit_price numeric not null,
  size numeric not null,
  opened_at timestamptz not null,
  closed_at timestamptz not null default now(),
  pnl numeric not null,
  pnl_pct numeric not null,
  open_decision_id uuid references decisions(id),
  close_decision_id uuid references decisions(id)
);
create index if not exists trades_agent_closed on trades(agent_id, closed_at desc);

-- subscriptions: per-user paid access to specific agents
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null references agents(id) on delete cascade,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  payment_key text,
  order_number text,
  amount numeric not null,
  status text not null default 'active' check (status in ('active','refunded','expired')),
  created_at timestamptz not null default now(),
  unique(user_id, agent_id, order_number)
);
create index if not exists subs_user_active on subscriptions(user_id, status, expires_at desc);

-- payments log (raw KorPay events)
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  order_number text not null,
  payment_key text,
  amount numeric not null,
  status text not null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists payments_order on payments(order_number);
create index if not exists payments_user_time on payments(user_id, created_at desc);

-- seed: MVP agent
insert into agents (id, display_name, model, style)
values ('sonnet-scalp', 'Claude Sonnet 단타', 'claude-sonnet-4-6', 'scalp')
on conflict (id) do nothing;

-- NOTE: RLS is intentionally disabled for MVP. Enable + add policies before production.
-- alter table profiles enable row level security;
-- alter table subscriptions enable row level security;
-- alter table payments enable row level security;
