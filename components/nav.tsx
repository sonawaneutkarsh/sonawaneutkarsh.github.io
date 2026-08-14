"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { contact } from "@/data/contact";
import { Container } from "@/components/container";
import { useMode, type Mode } from "@/components/mode-provider";
import { cn } from "@/lib/utils";

const MODES: { value: Mode; label: string }[] = [
  { value: "recruiter", label: "Recruiter" },
  { value: "experience", label: "Experience" },
];

export function Nav() {
  const { mode, setMode } = useMode();

  const handleTabKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = MODES.findIndex((m) => m.value === mode);
    let next = current;
    if (event.key === "ArrowRight") next = Math.min(current + 1, MODES.length - 1);
    if (event.key === "ArrowLeft") next = Math.max(current - 1, 0);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = MODES.length - 1;
    setMode(MODES[next].value);
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[role="tab"][data-value="${MODES[next].value}"]`)
      ?.focus();
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center justify-between gap-4">
          <span className="min-w-0 truncate font-medium">{contact.name || "Portfolio"}</span>
          <div
            role="tablist"
            aria-label="View mode"
            onKeyDown={handleTabKeys}
            className="flex shrink-0 items-center rounded-full border border-line p-1"
          >
            {MODES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="tab"
                data-value={value}
                aria-selected={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm transition-colors",
                  mode === value ? "bg-ink text-paper" : "text-graphite hover:bg-mist hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Container>
    </nav>
  );
}
