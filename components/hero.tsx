"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight, FileText, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { education } from "@/data/education";
import { contact } from "@/data/contact";
import { Container } from "@/components/container";
import { EASE_OUT } from "@/lib/motion";

export function Hero() {
  const edu = education[0];
  const shouldReduceMotion = useReducedMotion();

  const getTransition = (delay: number) => ({
    duration: shouldReduceMotion ? 0 : 0.4,
    delay: shouldReduceMotion ? 0 : delay,
    ease: EASE_OUT,
  });

  const initialMotion = shouldReduceMotion ? false : { opacity: 0, y: 10 };
  const animateMotion = { opacity: 1, y: 0 };

  return (
    <div id="top" className="border-b border-line">
      <Container className="py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl">
          {/* Eyebrow & Status */}
          <motion.div
            initial={initialMotion}
            animate={animateMotion}
            transition={getTransition(0)}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="eyebrow">{contact.name}</span>
            <span className="text-graphite font-mono text-xs">·</span>
            <span className="font-mono text-xs text-graphite">
              {edu.degree} · {edu.school}
            </span>
          </motion.div>

          {/* Main Statement */}
          <motion.h1
            initial={initialMotion}
            animate={animateMotion}
            transition={getTransition(0.08)}
            className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-5xl lg:leading-[1.15]"
          >
            I build software I actually want to use every day.
          </motion.h1>

          {/* Description & Action CTAs */}
          <motion.div
            initial={initialMotion}
            animate={animateMotion}
            transition={getTransition(0.16)}
          >
            <p className="mt-6 text-base leading-relaxed text-graphite sm:text-lg">
              I&rsquo;m an honors Computer Science student at Penn State. Most of my projects start with something I want to improve in my own life &mdash; my nutrition and training, my setup, or something repetitive I wish worked better. Right now I&rsquo;m especially interested in LLMs, agentic systems, and backend infrastructure.
            </p>

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
          </motion.div>

          {/* Flagship Highlight Banner */}
          <motion.div
            initial={initialMotion}
            animate={animateMotion}
            transition={getTransition(0.24)}
            className="mt-12 rounded-xl border border-line bg-mist/60 p-5 sm:p-6 transition-colors hover:border-graphite/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-signal" />
                <span className="eyebrow text-ink">Flagship System</span>
              </div>
              <span className="font-mono text-xs text-graphite">1,041 Automated Tests · Deterministic Decimal Math</span>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Nytr: Evidence-Driven Nutrition & Training Decision Platform
            </h2>

            <p className="mt-2 text-sm text-graphite leading-relaxed">
              Separating authoritative source data, deterministic computation, and user-approved policy changes. Integrates Penn State dining menus, Apple HealthKit telemetry,
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
          </motion.div>
        </div>
      </Container>
    </div>
  );
}
