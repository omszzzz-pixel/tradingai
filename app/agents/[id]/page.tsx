import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase";
import AgentView from "@/components/AgentView";

export const dynamic = "force-dynamic";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = supabaseService();
  const { data, error } = await sb
    .from("agents")
    .select("id, display_name, model, style")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  return (
    <AgentView
      agentId={data.id as string}
      displayName={data.display_name as string}
      model={data.model as string}
      style={data.style as "scalp" | "swing"}
    />
  );
}
