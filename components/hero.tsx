"use client";

import { motion, useReducedMotion } from "framer-motion";
import { achievements } from "@/data/achievements";
import { education } from "@/data/education";
import { projects } from "@/data/projects";
import { contact } from "@/data/contact";
import { EASE_OUT } from "@/lib/motion";
import { useMode } from "@/components/mode-provider";

const NAME = contact.name || "Utkarsh Sonawane";
const HEADLINE = "Software engineer. In progress, on purpose.";

const featured = projects.find((p) => p.featured) ?? projects[0];
const hackathon = achievements.find((a) => a.label.includes("Hackathon"));
const cgpa = education[0].cgpa ?? "";

const credentialParts = [
  education[0].school,
  cgpa ? `CGPA ${cgpa}` : null,
  hackathon?.label ?? null,
].filter(Boolean) as string[];

const credentialsLine = credentialParts.join(" · ");

export function Hero() {
  const { mode } = useMode();
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? false : { opacity: 0, y: 12 };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
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

function RecruiterHero({ initial }: { initial: boolean | { opacity: number; y: number } }) {
  return (
    <motion.section
      initial={initial}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="mx-auto max-w-2xl text-center"
    >
      <p className="eyebrow">{NAME}</p>
      <h1 className="mt-6 text-3xl font-medium leading-tight tracking-tight sm:text-[38px]">
        {HEADLINE}
      </h1>
      <p className="mt-6 text-graphite">{credentialsLine}</p>
      <div className="mx-auto mt-8 h-px w-16 bg-line" />
      <p className="mt-8 text-xs text-graphite">scroll for the work</p>
    </motion.section>
  );
}

function ExperienceHero({ initial }: { initial: boolean | { opacity: number; y: number } }) {
  const metrics = featured.metrics?.slice(0, 3) ?? [];
  const pills = [hackathon?.label, cgpa ? `CGPA ${cgpa}` : null].filter(Boolean) as string[];

  return (
    <section>
      <motion.p
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="eyebrow"
      >
        {NAME}
      </motion.p>
      <motion.h1
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.08 }}
        className="mt-4 max-w-2xl text-3xl font-medium leading-tight tracking-tight sm:text-[38px]"
      >
        {HEADLINE}
      </motion.h1>
      {/* TODO: one-line pitch goes here (user to write — not the credentials line,
          which is duplicated by the pills below). */}
      <motion.div
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.16 }}
        className="mt-6 flex flex-wrap gap-2"
      >
        {pills.map((pill) => (
          <span key={pill} className="rounded-full bg-mist px-3 py-1 text-sm text-graphite">
            {pill}
          </span>
        ))}
      </motion.div>
      <motion.article
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.24 }}
        className="mt-10 rounded-lg border border-line bg-mist p-6 sm:p-8"
      >
        <p className="eyebrow">Featured work</p>
        <h2 className="mt-3 text-xl font-medium tracking-tight">{featured.title}</h2>
        <p className="mt-2 text-graphite">{featured.oneLiner}</p>
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
        <a
          href="#projects"
          className="mt-6 inline-block text-sm font-medium text-signal transition-colors hover:text-signal-700"
        >
          View →
        </a>
      </motion.article>
    </section>
  );
}
