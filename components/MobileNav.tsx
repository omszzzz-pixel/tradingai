"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--bg-2)] border-t border-[var(--border)] flex">
      <Tab href="/" label="피드" active={pathname === "/"} />
      <Tab
        href="/dashboard"
        label="대시보드"
        active={pathname === "/dashboard"}
      />
      <Tab
        href="/leaderboard"
        label="리더보드"
        active={pathname === "/leaderboard"}
      />
    </nav>
  );
}

function Tab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex-1 py-3.5 text-[14px] text-center ${
        active
          ? "text-[var(--fg)] border-t-2 border-[var(--accent)] font-bold"
          : "text-[var(--fg-3)] font-medium"
      }`}
    >
      {label}
    </Link>
  );
}
