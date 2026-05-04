"use client";

import { SYMBOLS, type SymbolId } from "@/lib/symbols";

export default function SymbolSwitcher({
  selected,
  onChange,
}: {
  selected: SymbolId;
  onChange: (s: SymbolId) => void;
}) {
  return (
    <div className="panel mb-3 overflow-x-auto">
      <div className="flex items-stretch min-w-max">
        {SYMBOLS.map((s) => {
          const active = s.id === selected;
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className={`px-5 py-3 border-r border-[var(--border)] last:border-r-0 transition-colors ${
                active
                  ? "bg-[var(--bg-soft)] border-b-2 border-b-[var(--accent)]"
                  : "hover:bg-[var(--row-hover)]"
              }`}
            >
              <div className="flex flex-col items-start">
                <div
                  className={`text-[14px] font-bold ${
                    active ? "text-[var(--fg)]" : "text-[var(--fg-2)]"
                  }`}
                >
                  {s.short}/USDT
                </div>
                <div className="text-[11px] text-[var(--fg-3)]">{s.name}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
