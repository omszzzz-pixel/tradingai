import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getServerUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { user: null, sb: null };

  const cookieStore = await cookies();
  const sb = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        for (const { name, value, options } of toSet) {
          cookieStore.set({ name, value, ...options });
        }
      },
    },
  });
  const {
    data: { user },
  } = await sb.auth.getUser();
  return { user, sb };
}

export async function userHasAgent(
  userId: string,
  agentId: string,
): Promise<boolean> {
  const { supabaseService } = await import("./supabase");
  const sb = supabaseService();
  const { data } = await sb
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("agent_id", agentId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .limit(1);
  return !!data && data.length > 0;
}
