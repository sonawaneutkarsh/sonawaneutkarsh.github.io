import { Award, Trophy, BookOpen } from "lucide-react";
import { Container } from "@/components/container";

export function Experience() {
  return (
    <section id="experience" className="scroll-mt-14 border-b border-line">
      <Container className="py-20 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h2 className="eyebrow">Recognition & Leadership</h2>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Experience, Honors & Technical Leadership
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Column 1: Technical Leadership & Experience */}
          <div className="space-y-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-graphite">
              Leadership & Community
            </h3>

            <div className="rounded-lg border border-line bg-paper p-6 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">CS Team Lead & Technical Team Member</span>
                <span className="font-mono text-xs text-graphite">Sept 2025 — Present</span>
              </div>
              <p className="text-sm font-medium text-signal">IEEE Student Branch · Penn State Harrisburg</p>
              <p className="text-xs text-graphite leading-relaxed">
                Conducted hands-on developer workshops for 20+ engineering students on documentation,
                Markdown tooling, and developer workflows. Coordinate technical team initiatives and collaborative sessions.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-paper p-6 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">Founder & Editor-in-Chief</span>
                <span className="font-mono text-xs text-graphite">Jun 2024 — Feb 2025</span>
              </div>
              <p className="text-sm font-medium text-graphite">Glimpse — Student Publication</p>
              <p className="text-xs text-graphite leading-relaxed">
                Scaled technical publication readership from 0 to 250+ subscribers within 3 months.
                Authored and edited 30+ long-form analytical articles on technology, software, and student engineering.
              </p>
            </div>
          </div>

          {/* Column 2: Honors & Additional Learning */}
          <div className="space-y-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-graphite">
              Honors & Additional Learning
            </h3>

            <div className="rounded-lg border border-line bg-paper p-6 space-y-3">
              <div className="flex items-start gap-3">
                <Trophy className="h-5 w-5 text-signal shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink text-sm">USAII Global AI Hackathon 2026 — Finalist</p>
                  <p className="text-xs text-graphite mt-0.5">
                    Selected as finalist among 6,081+ global participants across all tracks (ScholarAI data engineering pipeline).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-line/60 pt-3">
                <Award className="h-5 w-5 text-signal shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink text-sm">Dean&rsquo;s List & Capital Honors Program</p>
                  <p className="text-xs text-graphite mt-0.5">
                    The Pennsylvania State University · B.S. in Computer Science (GPA: 3.53 / 4.0).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-line/60 pt-3">
                <BookOpen className="h-5 w-5 text-graphite shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-ink text-sm">Additional Learning</p>
                  <p className="text-xs text-graphite">
                    <span className="font-medium text-ink">Completed:</span> Ethics of AI (University of Helsinki) · AI Essentials (Penn State)
                  </p>
                  <p className="text-xs text-graphite">
                    <span className="font-medium text-ink">In Progress:</span> Machine Learning Specialization (DeepLearning.AI) · Practical Deep Learning for Coders (fast.ai)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
