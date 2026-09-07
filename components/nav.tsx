"use client";

import Link from "next/link";
import { Moon, Sun, FileText } from "lucide-react";
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
              <svg
                className="h-4 w-4 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
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
