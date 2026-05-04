"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const t = (localStorage.getItem("theme") as Theme | null) ?? "light";
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <button
      onClick={toggle}
      aria-label="테마 전환"
      className="text-[13px] px-2.5 py-1.5 rounded border border-[var(--border)] hover:bg-[var(--bg-3)] text-[var(--fg-2)]"
    >
      {theme === "dark" ? "☀" : "🌙"}
    </button>
  );
}
