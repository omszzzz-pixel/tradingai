"use client";

import { useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}

export default function LiveCount() {
  const [presenceCount, setPresenceCount] = useState(0);
  const [base, setBase] = useState(0);

  useEffect(() => {
    setBase(72 + Math.floor(Math.random() * 36));
    const drift = setInterval(() => {
      setBase((b) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        return Math.max(48, Math.min(180, b + delta));
      });
    }, 6000);
    return () => clearInterval(drift);
  }, []);

  useEffect(() => {
    const sb = getClient();
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const ch = sb.channel("online", {
      config: { presence: { key: id } },
    });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      setPresenceCount(Object.keys(state).length);
    });
    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ at: Date.now() });
      }
    });
    return () => {
      sb.removeChannel(ch);
    };
  }, []);

  const total = presenceCount + base;

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[12px] text-[var(--fg-2)]">
        <span className="num font-semibold text-[var(--fg)]">
          {total.toLocaleString("ko-KR")}
        </span>
        명 접속중
      </span>
    </div>
  );
}
