import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-2)] sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="font-bold text-[14px] tracking-tight flex items-center gap-1"
          >
            <span className="text-[var(--fg)]">tradingai</span>
            <span className="text-[var(--accent)]">2</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="text-[12px] text-[var(--fg-2)] hover:text-[var(--fg)] px-2 py-1"
            >
              매매내역
            </Link>
            <Link
              href="/pay"
              className="text-[12px] text-[var(--fg-2)] hover:text-[var(--fg)] px-2 py-1"
            >
              구독
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px] text-[var(--fg-3)]">
            페이퍼 트레이딩 · 관찰용
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
