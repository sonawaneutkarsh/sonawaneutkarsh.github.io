"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Moon, Sun } from "lucide-react";
import { contact } from "@/data/contact";
import { Container } from "@/components/container";
import { useMode, type Mode } from "@/components/mode-provider";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const MODES: { value: Mode; label: string }[] = [
  { value: "recruiter", label: "Recruiter" },
  { value: "experience", label: "Experience" },
];

const SECTIONS = [
  { href: "#projects", label: "Work" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  const { mode, setMode } = useMode();
  const { theme, toggleTheme } = useTheme();

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
    <nav aria-label="Site" className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center justify-between gap-4">
          <a href="#top" className="min-w-0 truncate font-medium hover:text-signal transition-colors">
            {contact.name || "Portfolio"}
          </a>
          <div className="flex shrink-0 items-center gap-4 sm:gap-6">
            <div className="hidden items-center gap-6 sm:flex">
              {SECTIONS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm text-graphite transition-colors hover:text-ink"
                >
                  {label}
                </a>
              ))}
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="rounded-full p-1.5 text-graphite transition-colors hover:bg-mist hover:text-ink"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
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
                  tabIndex={mode === value ? 0 : -1}
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
        </div>
      </Container>
    </nav>
  );
}
