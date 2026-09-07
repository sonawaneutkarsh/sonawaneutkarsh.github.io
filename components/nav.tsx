"use client";

import Link from "next/link";
import { Moon, Sun, FileText, GitBranch } from "lucide-react";
import { contact } from "@/data/contact";
import { Container } from "@/components/container";
import { useTheme } from "@/components/theme-provider";

const DESKTOP_LINKS = [
  { href: "/#projects", label: "Work" },
  { href: "/#about", label: "About" },
  { href: "/#skills", label: "Skills" },
  { href: "/resume.pdf", label: "Résumé", external: true },
  { href: "/#contact", label: "Contact" },
];

export function Nav() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav aria-label="Site" className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center justify-between gap-4">
          <Link
            href="/"
            className="min-w-0 font-medium tracking-tight hover:text-signal transition-colors flex items-center gap-2"
          >
            <span className="font-semibold text-ink text-sm sm:text-base truncate">
              {contact.name || "Utkarsh Sonawane"}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-3 sm:gap-6">
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-5 sm:gap-6">
              {DESKTOP_LINKS.map(({ href, label, external }) =>
                external ? (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-medium text-graphite transition-colors hover:text-ink"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </a>
                ) : (
                  <a
                    key={href}
                    href={href}
                    className="text-sm font-medium text-graphite transition-colors hover:text-ink"
                  >
                    {label}
                  </a>
                )
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="flex sm:hidden items-center gap-3 text-xs font-medium text-graphite">
              <a href="/#projects" className="hover:text-ink transition-colors">
                Work
              </a>
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-signal hover:underline"
              >
                <FileText className="h-3 w-3" />
                Résumé
              </a>
            </div>

            <a
              href={`https://github.com/${contact.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-1.5 text-graphite transition-colors hover:bg-mist hover:text-ink hidden sm:inline-flex"
              aria-label="GitHub Profile"
            >
              <GitBranch className="h-4 w-4" aria-hidden="true" />
            </a>

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
          </div>
        </div>
      </Container>
    </nav>
  );
}
