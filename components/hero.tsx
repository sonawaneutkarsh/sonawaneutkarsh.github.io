"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { education } from "@/data/education";
import { projects } from "@/data/projects";
import { contact } from "@/data/contact";
import { EASE_OUT } from "@/lib/motion";
import { useMode } from "@/components/mode-provider";

const NAME = contact.name || "Utkarsh Sonawane";
const featured = projects.find((p) => p.featured) ?? projects[0];

const credentialParts = [
  education[0].degree ? `${education[0].degree} — ${education[0].school}` : education[0].school,
  education[0].gpa ? `GPA: ${education[0].gpa}` : null,
  education[0].graduation ? `Expected graduation: ${education[0].graduation}` : null,
].filter(Boolean) as string[];

const credentialsLine = credentialParts.join(" · ");

type Initial = boolean | { opacity: number; y: number };

export function Hero() {
  const { mode } = useMode();
  const reduceMotion = useReducedMotion();
  const initial: Initial = reduceMotion ? false : { opacity: 0, y: 12 };

  return (
    <div id="top" className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex flex-1 items-center">
        <div className="w-full">
          {mode === "recruiter" ? (
            <RecruiterHero initial={initial} />
          ) : (
            <ExperienceHero initial={initial} />
          )}
        </div>
      </div>
    </div>
  );
}

function RecruiterHero({ initial }: { initial: Initial }) {
  return (
    <motion.section
      initial={initial}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="mx-auto max-w-2xl text-center"
    >
      <h1 className="eyebrow">{NAME}</h1>
      <p className="mt-6 text-graphite">{credentialsLine}</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <a
          href="#projects"
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-graphite"
        >
          View work
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </a>
        <a
          href={`https://github.com/${contact.github}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-signal transition-colors hover:text-signal-700"
        >
          GitHub
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </motion.section>
  );
}

function ExperienceHero({ initial }: { initial: Initial }) {
  const metrics = featured.metrics?.slice(0, 3) ?? [];

  return (
    <section>
      <div className="mx-auto max-w-2xl">
        <motion.h1
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="eyebrow"
        >
          {NAME}
        </motion.h1>
        <motion.p
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.08 }}
          className="mt-4 text-graphite"
        >
          {credentialsLine}
        </motion.p>
        <motion.article
          initial={initial}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.16 }}
          className="mt-8 rounded-lg border border-line bg-mist p-6 sm:p-8"
        >
          <p className="eyebrow">Featured work</p>
          <h2 className="mt-3 text-xl font-medium tracking-tight">{featured.title}</h2>
          <p className="mt-2 text-graphite">{featured.oneLiner}</p>
          {metrics.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {metrics.map((m) => (
                <span
                  key={m.label}
                  className="rounded-md border border-line bg-paper px-2 py-1 font-mono text-[11px] text-graphite"
                >
                  {m.label}: {m.value}
                </span>
              ))}
            </div>
          ) : null}
          <a
            href="#projects"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-signal transition-colors hover:text-signal-700"
          >
            View project
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
        </motion.article>
      </div>
    </section>
  );
}
