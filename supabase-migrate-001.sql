-- Migration 001: add chat messages table.
-- Run this in Supabase SQL editor on top of an already-applied supabase-schema.sql.

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  display_name text,
  body text not null check (length(body) between 1 and 500),
  channel text not null default 'all',
  is_bot boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_channel_time on messages(channel, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table messages';
  end if;
end $$;
