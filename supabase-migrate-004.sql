-- Migration 004: link agent replies to their parent intel message for threaded discussion.

alter table messages
  add column if not exists parent_message_id uuid references messages(id) on delete set null;

create index if not exists messages_parent_id on messages(parent_message_id);
