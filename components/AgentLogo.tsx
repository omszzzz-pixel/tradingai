"use client";

import { Claude, OpenAI, Gemini } from "@lobehub/icons";

export function agentIdFromName(name: string): string | null {
  const lc = name.toLowerCase();
  let prefix: string | null = null;
  if (lc.includes("sonnet")) prefix = "sonnet";
  else if (lc.includes("opus")) prefix = "opus";
  else if (lc.includes("gpt")) prefix = "gpt";
  else if (lc.includes("gemini")) prefix = "gemini";
  if (!prefix) return null;
  const suffix = name.includes("보수형") ? "conservative" : "aggressive";
  return `${prefix}-${suffix}`;
}

export default function AgentLogo({
  agentId,
  displayName,
  size = 20,
  variant = "avatar",
}: {
  agentId?: string;
  displayName?: string;
  size?: number;
  variant?: "avatar" | "color" | "mono";
}) {
  const id = agentId ?? (displayName ? agentIdFromName(displayName) : null);
  if (!id) return null;

  const Brand =
    id.startsWith("sonnet") || id.startsWith("opus")
      ? Claude
      : id.startsWith("gpt")
        ? OpenAI
        : id.startsWith("gemini")
          ? Gemini
          : null;

  if (!Brand) return null;

  if (variant === "avatar") return <Brand.Avatar size={size} />;
  if (variant === "color" && "Color" in Brand) {
    const ColorIcon = (Brand as unknown as { Color: typeof Brand }).Color;
    return <ColorIcon size={size} />;
  }
  return <Brand size={size} />;
}
