"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import AgentLogo, { agentIdFromName } from "./AgentLogo";

const INTEL_BOT_COLORS: Record<string, string> = {
  고래: "#0ea5e9",
  펀딩: "#f97316",
  청산: "#ef4444",
  김프: "#dc2626",
  상장: "#8b5cf6",
  뉴스: "#6b7280",
  OI: "#facc15",
  거시: "#10b981",
};

function intelBotColor(name: string): string {
  for (const k of Object.keys(INTEL_BOT_COLORS)) {
    if (name.includes(k)) return INTEL_BOT_COLORS[k];
  }
  return "#6b7280";
}

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

function colorize(text: string): React.ReactNode[] {
  const pattern = /(진입|청산|롱|숏|[+-]\d+\.\d+%)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
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
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function parseBotBody(body: string): {
  headline: string;
  detail: string;
  commentary: string;
} {
  const lines = body.split("\n");
  const headline = lines[0]?.trim() ?? "";
  const detail: string[] = [];
  const commentary: string[] = [];
  let inCommentary = false;
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (
      trimmed.startsWith("📌") ||
      trimmed.startsWith("⚡") ||
      trimmed.startsWith("💡") ||
      inCommentary
    ) {
      inCommentary = true;
      commentary.push(trimmed);
    } else {
      detail.push(trimmed);
    }
  }
  return {
    headline,
    detail: detail.join("\n"),
    commentary: commentary.join("\n"),
  };
}

type Mode = "intel" | "agent" | "general" | "ai";

export default function Chat({
  fixedMode,
  title,
  hideInput,
}: {
  fixedMode?: Mode;
  title?: string;
  hideInput?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(fixedMode ?? "intel");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [winRates, setWinRates] = useState<Record<string, number>>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (fixedMode) setMode(fixedMode);
  }, [fixedMode]);

  useEffect(() => {
    if (mode !== "agent") return;
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((j: { rows: { display_name: string; win_rate: number }[] }) => {
        const map: Record<string, number> = {};
        for (const r of j.rows ?? [])
          map[r.display_name] = Number(r.win_rate);
        setWinRates(map);
      })
      .catch(() => {});
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    setMsgs([]);
    fetch(`/api/chat?mode=${mode}`)
      .then((r) => r.json())
      .then((j: { messages: Msg[] }) => {
        if (!cancelled) setMsgs(j.messages ?? []);
      })
      .catch(() => {});

    const filter =
      mode === "intel"
        ? `channel=eq.intel`
        : mode === "agent"
          ? `channel=eq.agent`
          : mode === "general"
            ? `is_bot=eq.false`
            : `is_bot=eq.true`;

    const sb = getBrowserClient();
    const ch = sb
      .channel(`chat-${mode}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter,
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
    if (mode !== "general") {
      setErr("이 채널은 읽기 전용입니다");
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
    <div
      className={`flex flex-col h-full min-h-0 w-full ${fixedMode ? "" : "panel"}`}
    >
      {fixedMode ? (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          {fixedMode === "intel" || fixedMode === "ai" ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          ) : fixedMode === "agent" ? (
            <span className="text-[16px]">🤖</span>
          ) : (
            <span className="text-[16px]">💬</span>
          )}
          <span className="text-[15px] font-bold">
            {title ??
              (fixedMode === "intel" || fixedMode === "ai"
                ? "AI 정보 피드"
                : fixedMode === "agent"
                  ? "AI 토론"
                  : "커뮤니티")}
          </span>
        </div>
      ) : (
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
      )}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-3"
      >
        {msgs.length === 0 && (
          <div className="text-center text-[var(--fg-3)] mt-10 text-[14px]">
            {fixedMode === "ai"
              ? "곧 새로운 시장 알림이 도착합니다…"
              : "첫 메시지를 남겨보세요."}
          </div>
        )}
        {msgs.map((m) => {
          if (!m.is_bot) {
            return (
              <div
                key={m.id}
                className="mb-3 leading-snug break-words"
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[14px] font-semibold text-[var(--fg-2)]">
                    {m.display_name ?? "익명"}
                  </span>
                  <span className="text-[var(--fg-3)] num text-[12px]">
                    {fmtTime(m.created_at)}
                  </span>
                </div>
                <div className="text-[15px] text-[var(--fg)] pl-0.5 leading-relaxed">
                  {m.body}
                </div>
              </div>
            );
          }

          const isAgent = !!agentIdFromName(m.display_name ?? "");

          // Agent commentary: compact chat style
          if (isAgent && m.channel === "agent") {
            const winRate = winRates[m.display_name ?? ""];
            return (
              <div
                key={m.id}
                className="mb-3 flex gap-2.5 leading-snug break-words"
              >
                <span className="rounded-full overflow-hidden shrink-0 mt-0.5">
                  <AgentLogo displayName={m.display_name ?? ""} size={26} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-[13px] font-bold">
                      {m.display_name ?? ""}
                    </span>
                    {typeof winRate === "number" && winRate > 0 && (
                      <span
                        className={`text-[10px] font-bold num px-1.5 py-px rounded ${
                          winRate >= 60
                            ? "up bg-[rgba(200,74,49,0.10)]"
                            : winRate >= 50
                              ? "text-[var(--fg-2)] bg-[var(--bg-3)]"
                              : "down bg-[rgba(18,97,196,0.10)]"
                        }`}
                      >
                        승률 {winRate.toFixed(0)}%
                      </span>
                    )}
                    <span className="text-[var(--fg-3)] num text-[11px]">
                      {fmtTime(m.created_at)}
                    </span>
                  </div>
                  <div className="text-[14px] text-[var(--fg)] leading-relaxed">
                    {colorize(m.body)}
                  </div>
                </div>
              </div>
            );
          }

          const dotColor = isAgent
            ? null
            : intelBotColor(m.display_name ?? "");
          const { headline, detail, commentary } = parseBotBody(m.body);

          return (
            <div
              key={m.id}
              className="mb-2.5 px-3.5 py-3 rounded-md border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg)] transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                {isAgent ? (
                  <span className="rounded-full overflow-hidden shrink-0">
                    <AgentLogo
                      displayName={m.display_name ?? ""}
                      size={18}
                    />
                  </span>
                ) : (
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: dotColor ?? "#6b7280" }}
                  />
                )}
                <span className="text-[13px] font-bold text-[var(--fg)]">
                  {m.display_name ?? "익명"}
                </span>
                <span className="text-[var(--fg-3)] num text-[12px] ml-auto">
                  {fmtTime(m.created_at)}
                </span>
              </div>
              <div className="text-[16px] font-bold leading-snug">
                {colorize(headline)}
              </div>
              {detail && (
                <div className="text-[14px] text-[var(--fg-2)] mt-1 leading-snug whitespace-pre-line">
                  {colorize(detail)}
                </div>
              )}
              {commentary && (
                <div className="text-[14px] text-[var(--fg-2)] mt-2.5 pt-2.5 border-t border-[var(--border)] leading-relaxed whitespace-pre-line">
                  {colorize(commentary)}
                </div>
              )}
              {m.trade_id && (
                <Link
                  href={`/trades/${m.trade_id}`}
                  className="inline-block mt-2.5 text-[13px] font-semibold text-[var(--accent)] hover:underline"
                >
                  분석 보기 →
                </Link>
              )}
            </div>
          );
        })}
      </div>
      {!hideInput && mode !== "ai" && (
        <div className="border-t border-[var(--border)] p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={err ? err : "메시지 (로그인 필요)"}
            maxLength={500}
            disabled={sending}
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-[14px] outline-none focus:border-[var(--accent)] disabled:opacity-60"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="text-[14px] px-4 rounded bg-[var(--accent)] text-white font-semibold disabled:opacity-50"
          >
            전송
          </button>
        </div>
      )}
    </div>
  );
}
