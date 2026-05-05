import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase";
import { INTEL_BOTS, type BotSlug } from "@/lib/bots";

export const dynamic = "force-dynamic";

function relTime(iso: string): string {
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return `${Math.floor(diff / (86400 * 7))}주 전`;
}

export default async function BotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = INTEL_BOTS[slug as BotSlug];
  if (!meta) notFound();

  const sb = supabaseService();
  const { data: messages, error } = await sb
    .from("messages")
    .select("id, body, created_at")
    .eq("display_name", meta.name)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-6">
        <div className="panel p-5 text-[var(--down)]">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="lg:h-full lg:overflow-y-auto">
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 py-5">
      <div className="flex items-center gap-2 mb-3 text-[13px]">
        <Link href="/" className="text-[var(--fg-3)] hover:text-[var(--fg)]">
          ← 피드
        </Link>
        <span className="text-[var(--fg-3)]">/</span>
        <span className="font-semibold">봇 정보</span>
      </div>

      <div className="panel p-5 mb-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0"
            style={{ background: meta.color }}
          />
          <h1 className="text-[20px] font-bold">{meta.name}</h1>
          <span className="chip num">{messages?.length ?? 0}건</span>
        </div>
        <p className="text-[13px] text-[var(--fg-2)] mt-2 leading-relaxed">
          {meta.description}
        </p>
      </div>

      <div className="panel">
        <div className="px-4 py-3 border-b border-[var(--border)] text-[14px] font-bold">
          최근 알림
        </div>
        {(messages ?? []).length === 0 ? (
          <div className="p-6 text-center text-[var(--fg-3)] text-[13px]">
            아직 알림이 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {(messages ?? []).map((m) => {
              const lines = (m.body as string).split("\n");
              const headline = lines[0] ?? "";
              const detail = lines.slice(1).join("\n").trim();
              return (
                <li key={m.id} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-[15px] font-semibold leading-snug">
                      {headline}
                    </span>
                    <span className="text-[var(--fg-3)] num text-[11px] shrink-0">
                      {relTime(m.created_at as string)}
                    </span>
                  </div>
                  {detail && (
                    <div className="text-[13px] text-[var(--fg-2)] leading-relaxed whitespace-pre-line">
                      {detail}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      </div>
    </div>
  );
}
