import Link from "next/link";
import { ArrowUpRight, ArrowRight, Award } from "lucide-react";
import { projects } from "@/data/projects";
import { Container } from "@/components/container";

export function Projects() {
  const primaryProjects = projects.slice(0, 4);
  const secondaryProjects = projects.slice(4);

  return (
    <section id="projects" className="scroll-mt-14 border-b border-line">
      <Container className="py-20 sm:py-24">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h2 className="eyebrow">Projects</h2>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Selected Work
            </p>
          </div>
          <p className="font-mono text-xs text-graphite">
            Sorted by engineering depth
          </p>
        </div>

        {/* Primary Project Cards (Nytr, Clage, Devvy, ScholarAI) */}
        <div className="mt-10 space-y-8">
          {primaryProjects.map((project, index) => (
            <article
              key={project.slug}
              className="rounded-xl border border-line bg-paper p-6 sm:p-8 transition-all hover:border-graphite/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {project.featured ? (
                      <span className="rounded-md border border-line bg-mist px-2 py-0.5 font-mono text-[11px] font-medium text-graphite uppercase tracking-wider">
                        {index === 0 ? "Flagship System" : "Core Algorithm"}
                      </span>
                    ) : null}
                    {project.slug === "scholarai" ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-line bg-mist px-2 py-0.5 font-mono text-[11px] font-medium text-signal">
                        <Award className="h-3 w-3" />
                        Hackathon Finalist
                      </span>
                    ) : null}
                    <span className="font-mono text-xs text-graphite">0{index + 1}</span>
                  </div>

                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                    {project.title}
                  </h3>

                  <p className="mt-1 text-base font-medium text-graphite">
                    {project.oneLiner}
                  </p>
                </div>

                {/* Primary Action Button */}
                <div className="shrink-0">
                  {project.hasCaseStudy ? (
                    <Link
                      href={`/projects/${project.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-mist px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
                    >
                      Technical Case Study
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : project.links && project.links[0] ? (
                    <a
                      href={project.links[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-mist px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
                    >
                      {project.links[0].label}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Description */}
              <p className="mt-4 text-sm text-graphite leading-relaxed">
                {project.description}
              </p>

              {/* Role */}
              {project.role ? (
                <div className="mt-4 border-l-2 border-signal pl-3 font-mono text-xs text-ink">
                  {project.role}
                </div>
              ) : null}

              {/* Metrics Chips */}
              {project.metrics && project.metrics.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-md border border-line bg-mist px-2.5 py-1 font-mono text-[11px]"
                    >
                      <span className="text-graphite">{metric.label}: </span>
                      <span className="font-semibold text-ink">{metric.value}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Technologies & Links Footer */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line/60 pt-5">
                <div className="flex flex-wrap gap-1.5">
                  {project.tech?.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-line bg-paper px-2 py-0.5 font-mono text-[11px] text-graphite"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {project.hasCaseStudy ? (
                    <Link
                      href={`/projects/${project.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-signal hover:underline"
                    >
                      Read Deep Dive <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                  {project.links
                    ?.filter((l) => !l.isCaseStudy)
                    .map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-graphite transition-colors hover:text-ink"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Secondary Projects Section */}
        {secondaryProjects.length > 0 ? (
          <div className="mt-16">
            <div className="border-b border-line pb-4">
              <h3 className="eyebrow">Additional & Exploratory Projects</h3>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {secondaryProjects.map((project) => (
                <div
                  key={project.slug}
                  className="rounded-lg border border-line bg-paper p-6 transition-colors hover:border-graphite/40"
                >
                  <h4 className="text-lg font-semibold tracking-tight text-ink">
                    {project.title}
                  </h4>
                  <p className="mt-1 text-xs font-medium text-graphite">
                    {project.oneLiner}
                  </p>
                  <p className="mt-3 text-xs text-graphite leading-relaxed">
                    {project.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {project.tech?.map((t) => (
                      <span
                        key={t}
                        className="rounded border border-line bg-mist px-2 py-0.5 font-mono text-[10px] text-graphite"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {project.links && project.links.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-3 border-t border-line/60 pt-3">
                      {project.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-signal hover:underline"
                        >
                          {link.label}
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
