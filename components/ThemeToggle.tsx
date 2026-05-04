"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const t = (localStorage.getItem("theme") as Theme | null) ?? "dark";
    setTheme(t);
    document.documentElement.classList.toggle("light", t === "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="테마 전환"
      className="text-[12px] num px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--bg-3)] text-[var(--fg-2)]"
    >
      {theme === "dark" ? "🌙 다크" : "☀ 라이트"}
    </button>
  );
}
