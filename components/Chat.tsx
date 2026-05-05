"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import AgentLogo from "./AgentLogo";

type Msg = {
  id: string;
  display_name: string | null;
  body: string;
  channel: string;
  is_bot: boolean;
  trade_id: string | null;
  created_at: string;
};

const MODES: { id: "ai" | "general"; label: string }[] = [
  { id: "ai", label: "AI 매매" },
  { id: "general", label: "일반 채팅" },
];

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function renderBotBody(body: string) {
  const pattern = /(진입|청산|롱|숏|[+-]\d+\.\d+%)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = pattern.exec(body)) !== null) {
    if (m.index > last) parts.push(body.slice(last, m.index));
    const t = m[0];
    let cls = "";
    if (t === "진입") cls = "text-emerald-500 font-bold";
    else if (t === "청산") cls = "text-amber-500 font-bold";
    else if (t === "롱") cls = "up font-bold";
    else if (t === "숏") cls = "down font-bold";
    else if (t.startsWith("+")) cls = "up font-bold";
    else if (t.startsWith("-")) cls = "down font-bold";
    parts.push(
      <span key={key++} className={cls}>
        {t}
      </span>,
    );
    last = m.index + t.length;
  }
  if (last < body.length) parts.push(body.slice(last));
  return parts;
}

export default function Chat() {
  const [mode, setMode] = useState<"ai" | "general">("ai");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMsgs([]);
    fetch(`/api/chat?mode=${mode}`)
      .then((r) => r.json())
      .then((j: { messages: Msg[] }) => {
        if (!cancelled) setMsgs(j.messages ?? []);
      })
      .catch(() => {});

    const sb = getBrowserClient();
    const ch = sb
      .channel(`chat-${mode}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `is_bot=eq.${mode === "ai"}`,
        },
        (payload) => {
          const m = payload.new as Msg;
          setMsgs((prev) => [...prev, m].slice(-100));
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      sb.removeChannel(ch);
    };
  }, [mode]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [msgs]);

  async function send() {
    const body = input.trim();
    if (!body) return;
    if (mode === "ai") {
      setErr("AI 매매 채널은 읽기 전용입니다");
      return;
    }
    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `status ${res.status}`);
      }
      setInput("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "전송 실패");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="panel flex flex-col h-full min-h-0 w-full">
      <div className="flex items-center px-2 py-1 border-b border-[var(--border)]">
        {MODES.map((c) => (
          <button
            key={c.id}
            onClick={() => setMode(c.id)}
            className={`btn-tab ${mode === c.id ? "active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-2.5 text-[13px]"
      >
        {msgs.length === 0 && (
          <div className="text-center text-[var(--fg-3)] mt-10 text-[13px]">
            첫 메시지를 남겨보세요.
          </div>
        )}
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`mb-2.5 leading-snug break-words ${
              m.is_bot ? "px-2 py-1.5 rounded bg-[var(--bg-soft)] border-l-2 border-[var(--accent)]" : ""
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              {m.is_bot && (
                <span className="rounded-full overflow-hidden shrink-0">
                  <AgentLogo
                    displayName={m.display_name ?? ""}
                    size={16}
                  />
                </span>
              )}
              <span
                className={`text-[12px] font-semibold ${
                  m.is_bot ? "text-[var(--accent)]" : "text-[var(--fg-2)]"
                }`}
              >
                {m.display_name ?? "익명"}
              </span>
              <span className="text-[var(--fg-3)] num text-[11px]">
                {fmtTime(m.created_at)}
              </span>
            </div>
            <div className="text-[13px] text-[var(--fg)] pl-0.5 whitespace-pre-line">
              {m.is_bot ? renderBotBody(m.body) : m.body}
            </div>
            {m.is_bot && m.trade_id && (
              <Link
                href={`/trades/${m.trade_id}`}
                className="inline-block mt-2 text-[11px] font-semibold text-[var(--accent)] hover:underline"
              >
                분석 보기 →
              </Link>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border)] p-2.5 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={
            mode === "ai"
              ? "AI 매매 피드 (읽기 전용)"
              : err
                ? err
                : "메시지 (로그인 필요)"
          }
          maxLength={500}
          disabled={sending || mode === "ai"}
          className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--accent)] disabled:opacity-60"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim() || mode === "ai"}
          className="text-[13px] px-3.5 rounded bg-[var(--accent)] text-white font-semibold disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  );
}
