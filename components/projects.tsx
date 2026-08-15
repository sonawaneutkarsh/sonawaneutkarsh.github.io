"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Lock, X } from "lucide-react";
import { projects } from "@/data/projects";
import type { Project } from "@/data/types";
import { EASE_OUT } from "@/lib/motion";
import { useMode } from "@/components/mode-provider";
import { Container } from "@/components/container";

const visibleProjects = projects.filter((p) => p.oneLiner);

export function Projects() {
  const { mode } = useMode();

  return (
    <section id="projects" className="scroll-mt-14 border-t border-line">
      <Container className="py-20 sm:py-24">
        <h2 className="eyebrow">Projects</h2>
        {mode === "recruiter" ? (
          <RecruiterList projects={visibleProjects} />
        ) : (
          <ExperienceRail projects={visibleProjects} />
        )}
      </Container>
    </section>
  );
}

function MetricChips({ project }: { project: Project }) {
  if (!project.metrics || project.metrics.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {project.metrics.map((m) => (
        <span
          key={m.label}
          className="rounded-md border border-line bg-paper px-2 py-1 font-mono text-[11px] text-graphite"
        >
          {m.label}: {m.value}
        </span>
      ))}
    </div>
  );
}

function TechList({ project }: { project: Project }) {
  if (!project.tech || project.tech.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {project.tech.map((tech) => (
        <span
          key={tech}
          className="rounded-md border border-line bg-mist px-2 py-0.5 font-mono text-[11px] text-graphite"
        >
          {tech}
        </span>
      ))}
    </div>
  );
}

function ProjectLinks({ project }: { project: Project }) {
  if (!project.links || project.links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-4">
      {project.links.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-signal transition-colors hover:text-signal-700"
        >
          {link.label} →
        </a>
      ))}
    </div>
  );
}

function RecruiterList({ projects }: { projects: Project[] }) {
  return (
    <ul className="mt-6">
      {projects.map((project) => {
        const emphasized = Boolean(project.featured || project.metrics?.length);
        return (
          <li
            key={project.slug}
            className="border-t border-line py-6 first:border-t-0 first:pt-0"
          >
            {project.featured ? <p className="eyebrow">Featured</p> : null}
            <h3
              className={
                project.featured
                  ? "mt-2 text-2xl font-medium tracking-tight"
                  : "text-xl font-medium tracking-tight"
              }
            >
              {project.title}
            </h3>
            <p className="mt-1 text-graphite">{project.oneLiner}</p>
            {project.role ? <p className="mt-2 text-sm text-ink">{project.role}</p> : null}
            {emphasized ? (
              <div className="mt-3">
                <MetricChips project={project} />
              </div>
            ) : null}
            <div className="mt-3">
              <TechList project={project} />
            </div>
            <div className="mt-3">
              <ProjectLinks project={project} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ExperienceRail({ projects }: { projects: Project[] }) {
  const railRef = useRef<HTMLUListElement>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const openProject = projects.find((p) => p.slug === openSlug) ?? null;

  const handleArrowKeys = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>("[data-card]");
    if (!rail || !card) return;
    const step = card.getBoundingClientRect().width + 24;
    rail.scrollBy({ left: event.key === "ArrowRight" ? step : -step, behavior: "smooth" });
  };

  return (
    <>
      <ul
        ref={railRef}
        onKeyDown={handleArrowKeys}
        className="mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 -mx-6 px-6 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10"
      >
        {projects.map((project) =>
          project.status === "competition-private" ? (
            <li key={project.slug} className="shrink-0 snap-start">
              <PrivateCard project={project} />
            </li>
          ) : (
            <li key={project.slug} className="shrink-0 snap-start">
              <button
                type="button"
                data-card
                onClick={() => setOpenSlug(project.slug)}
                className="block h-full w-80 rounded-lg border border-line bg-paper p-5 text-left transition-colors hover:border-graphite sm:w-96"
              >
                <CardContent project={project} />
              </button>
            </li>
          ),
        )}
      </ul>
      <AnimatePresence>
        {openProject ? <ProjectModal project={openProject} onClose={() => setOpenSlug(null)} /> : null}
      </AnimatePresence>
    </>
  );
}

function CardContent({ project }: { project: Project }) {
  return (
    <>
      {project.featured ? <p className="eyebrow">Featured</p> : null}
      <h3 className="text-lg font-medium tracking-tight">
        {project.title}
      </h3>
      <p className="mt-1 text-sm text-graphite">{project.oneLiner}</p>
      {project.metrics && project.metrics.length > 0 ? (
        <dl className="mt-4 space-y-1.5 border-t border-line pt-4">
          {project.metrics.map((metric) => (
            <div key={metric.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-graphite">
                {metric.label}
              </dt>
              <dd className="font-mono text-[11px] text-ink">{metric.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="mt-4">
        <TechList project={project} />
      </div>
    </>
  );
}

function PrivateCard({ project }: { project: Project }) {
  return (
    <div className="flex h-full w-80 flex-col rounded-lg border border-dashed border-line bg-mist/50 p-5 sm:w-96">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-graphite" aria-hidden="true" />
        <p className="eyebrow">Competition project</p>
      </div>
      <h3 className="mt-3 text-lg font-medium tracking-tight">{project.title}</h3>
      <p className="mt-1 text-sm text-graphite">{project.oneLiner}</p>
    </div>
  );
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <motion.div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.15, ease: EASE_OUT }}
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`project-${project.slug}-title`}
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-line bg-paper p-6 sm:rounded-lg sm:p-8"
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-graphite transition-colors hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>
        {project.featured ? <p className="eyebrow">Featured</p> : null}
        <h2
          id={`project-${project.slug}-title`}
          className="mt-2 text-xl font-medium tracking-tight"
        >
          {project.title}
        </h2>
        <p className="mt-1 text-graphite">{project.oneLiner}</p>
        {project.role ? (
          <p className="mt-4 border-l-2 border-signal pl-3 text-sm text-ink">{project.role}</p>
        ) : null}
        {project.description ? <p className="mt-4 leading-relaxed">{project.description}</p> : null}
        {project.metrics && project.metrics.length > 0 ? (
          <dl className="mt-5 space-y-1.5 border-t border-line pt-5">
            {project.metrics.map((metric) => (
              <div key={metric.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-graphite">
                  {metric.label}
                </dt>
                <dd className="font-mono text-[11px] text-ink">{metric.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="mt-5">
          <TechList project={project} />
        </div>
        <div className="mt-6">
          <ProjectLinks project={project} />
        </div>
        <p className="mt-6 text-xs text-graphite">Press Esc to close</p>
      </motion.div>
    </div>
  );
}
