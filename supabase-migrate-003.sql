-- Migration 003: link bot messages to trades for "분석 보기" deep-link.

alter table messages
  add column if not exists trade_id uuid references trades(id) on delete set null;

create index if not exists messages_trade_id on messages(trade_id);
