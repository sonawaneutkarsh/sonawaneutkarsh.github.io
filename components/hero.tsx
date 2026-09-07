"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight, FileText, ArrowRight } from "lucide-react";
import { education } from "@/data/education";
import { contact } from "@/data/contact";
import { Container } from "@/components/container";

export function Hero() {
  const edu = education[0];

  return (
    <div id="top" className="border-b border-line">
      <Container className="py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl">
          {/* Eyebrow & Status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{contact.name}</span>
            <span className="text-graphite font-mono text-xs">·</span>
            <span className="font-mono text-xs text-graphite">
              {edu.degree} · {edu.school}
            </span>
          </div>

          {/* Main Statement */}
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-5xl lg:leading-[1.15]">
            I build systems from first principles — backend infrastructure, algorithms, and grounded AI where decisions can be traced back to evidence.
          </h1>

          <p className="mt-6 text-base leading-relaxed text-graphite sm:text-lg">
            Undergraduate Computer Science honors student at Penn State (GPA 3.53/4.0, Dean&rsquo;s List, Capital Honors Program).
            Focused on systems programming, deterministic data pipelines, neuroevolution from scratch, and zero-dependency local daemons.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <a
              href="#projects"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-all hover:opacity-90"
            >
              Selected Work
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>

            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-mist"
            >
              <FileText className="h-4 w-4 text-signal" aria-hidden="true" />
              View Résumé (PDF)
            </a>

            <a
              href={`https://github.com/${contact.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-graphite transition-colors hover:text-ink"
            >
              GitHub
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          {/* Flagship Highlight Banner */}
          <div className="mt-12 rounded-xl border border-line bg-mist/60 p-5 sm:p-6 transition-colors hover:border-graphite/40">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-signal" />
                <span className="eyebrow text-ink">Flagship System</span>
              </div>
              <span className="font-mono text-xs text-graphite">1,041 Automated Tests · 0-Drift Math</span>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Nytr: Evidence-Driven Nutrition & Training Decision Platform
            </h2>

            <p className="mt-2 text-sm text-graphite leading-relaxed">
              Eliminating digital health hallucinations. Integrates Penn State dining menus, Apple HealthKit telemetry,
              and Hevy workout revisions via a FastAPI modular monolith, Supabase PostgreSQL, and a native SwiftUI companion client.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line/60 pt-4">
              <div className="flex flex-wrap gap-2">
                {["Python", "FastAPI", "PostgreSQL", "SwiftUI", "HealthKit", "Docker"].map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-line bg-paper px-2 py-0.5 font-mono text-[11px] text-graphite"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <Link
                href="/projects/nytr"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-signal transition-colors hover:text-signal-700"
              >
                Read Technical Case Study
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
