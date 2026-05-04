-- Migration 002: add remaining 7 agents (all initially inactive — worker won't burn API for them)
-- Run after 001.

insert into agents (id, display_name, model, style, is_active) values
  ('sonnet-swing',  'Claude Sonnet 스윙', 'claude-sonnet-4-6', 'swing', false),
  ('opus-scalp',    'Claude Opus 단타',   'claude-opus-4-7',   'scalp', false),
  ('opus-swing',    'Claude Opus 스윙',   'claude-opus-4-7',   'swing', false),
  ('gpt-scalp',     'GPT-5.4 단타',       'gpt-5.4',           'scalp', false),
  ('gpt-swing',     'GPT-5.4 스윙',       'gpt-5.4',           'swing', false),
  ('gemini-scalp',  'Gemini 단타',        'gemini-2.5-pro',    'scalp', false),
  ('gemini-swing',  'Gemini 스윙',        'gemini-2.5-pro',    'swing', false)
on conflict (id) do nothing;
