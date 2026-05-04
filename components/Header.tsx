import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-2)]">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-[15px] tracking-tight">
            tradingai<span className="text-[var(--accent)]">2</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-[13px] text-[var(--fg-2)]">
            <Link href="/" className="hover:text-[var(--fg)]">매매내역</Link>
            <Link href="/pay" className="hover:text-[var(--fg)]">구독</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[12px] text-[var(--fg-3)] num">
            페이퍼 트레이딩 · 관찰용
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
