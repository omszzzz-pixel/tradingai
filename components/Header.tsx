import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-2)] sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-bold text-[17px] tracking-tight flex items-center"
          >
            <span className="text-[var(--fg)]">tradingai</span>
            <span className="text-[var(--accent)]">2</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="text-[14px] font-medium text-[var(--fg-2)] hover:text-[var(--fg)] px-2.5 py-1.5"
            >
              리더보드
            </Link>
            <Link
              href="/pay"
              className="text-[14px] font-medium text-[var(--fg-2)] hover:text-[var(--fg)] px-2.5 py-1.5"
            >
              구독
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline text-[12px] text-[var(--fg-3)]">
            페이퍼 트레이딩 · 관찰용
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
