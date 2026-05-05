import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import LiveCount from "./LiveCount";

export default function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-2)] sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-bold text-[17px] tracking-tight flex items-center"
          >
            <span className="text-[var(--fg)]">trading</span>
            <span style={{ color: "#f5b50a" }}>ai</span>
          </Link>
          <span className="free-badge">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            전 기능 무료
          </span>
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="text-[14px] font-medium text-[var(--fg-2)] hover:text-[var(--fg)] px-2.5 py-1.5"
            >
              피드
            </Link>
            <Link
              href="/dashboard"
              className="text-[14px] font-medium text-[var(--fg-2)] hover:text-[var(--fg)] px-2.5 py-1.5"
            >
              대시보드
            </Link>
            <Link
              href="/leaderboard"
              className="text-[14px] font-medium text-[var(--fg-2)] hover:text-[var(--fg)] px-2.5 py-1.5"
            >
              리더보드
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LiveCount />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
