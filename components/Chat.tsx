"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Msg = {
  id: string;
  display_name: string | null;
  body: string;
  channel: string;
  is_bot: boolean;
  created_at: string;
};

const CHANNELS: { id: string; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "btc", label: "BTC" },
  { id: "eth", label: "ETH" },
  { id: "free", label: "자유" },
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
  });
}

export default function Chat() {
  const [channel, setChannel] = useState("all");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMsgs([]);
    fetch(`/api/chat?channel=${channel}`)
      .then((r) => r.json())
      .then((j: { messages: Msg[] }) => {
        if (!cancelled) setMsgs(j.messages ?? []);
      })
      .catch(() => {});

    const sb = getBrowserClient();
    const ch = sb
      .channel(`chat-${channel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel=eq.${channel}` },
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
  }, [channel]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [msgs]);

  async function send() {
    const body = input.trim();
    if (!body) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body, channel }),
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
    <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded flex flex-col h-[480px]">
      <div className="flex items-center gap-1 px-2 py-2 border-b border-[var(--border)]">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChannel(c.id)}
            className={`text-[12px] px-2 py-1 rounded ${
              channel === c.id
                ? "bg-[var(--bg-3)] text-[var(--fg)]"
                : "text-[var(--fg-3)] hover:text-[var(--fg)]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 text-[13px]">
        {msgs.length === 0 && (
          <div className="text-center text-[var(--fg-3)] mt-8 text-[12px]">
            첫 메시지를 남겨보세요.
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className="mb-1.5 leading-snug break-words">
            <span className="text-[var(--fg-3)] num text-[11px] mr-2">
              {fmtTime(m.created_at)}
            </span>
            <span
              className={`text-[12px] mr-1.5 ${
                m.is_bot ? "text-[var(--accent)]" : "text-[var(--fg-2)]"
              }`}
            >
              {m.is_bot ? "🤖" : ""}{m.display_name ?? "익명"}
            </span>
            <span>{m.body}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border)] p-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={err ? err : "메시지 입력 (로그인 필요)…"}
          maxLength={500}
          disabled={sending}
          className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-[13px] outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="text-[12px] px-3 rounded bg-[var(--accent)] text-black font-medium disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  );
}
