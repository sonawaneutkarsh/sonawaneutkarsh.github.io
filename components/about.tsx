import { Container } from "@/components/container";

export function About() {
  return (
    <section id="about" className="scroll-mt-14 border-b border-line">
      <Container className="py-20 sm:py-24">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="eyebrow">Engineering Philosophy</h2>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Underneath the Abstractions
            </p>
          </div>

          <div className="md:col-span-2 space-y-5 text-base text-graphite leading-relaxed">
            <p>
              I care about first principles, evidence, and correctness. Rather than assembling third-party
              wrappers and hoping they behave, I prefer to build core systems from scratch: implementing
              neuroevolution without external ML packages, designing direct IPC daemons over raw Unix sockets,
              and enforcing database-level immutability with strict row-level security.
            </p>
            <p>
              My primary interest is in <strong className="text-ink font-medium">distributed plumbing, deterministic evaluation, and backend infrastructure</strong>.
              Whether architecting dual-anchor mobile synchronization engines or building vector retrieval pipelines
              for 1,000+ government schemes, I prioritize measurable failure modes over convenient assumptions.
            </p>
            <div className="pt-2">
              <div className="rounded-lg border border-line bg-mist/50 p-4 font-mono text-xs text-graphite">
                <span className="text-ink font-semibold">Current Focus:</span> Honors Computer Science @ Penn State ·
                Systems Programming (C++, Python, TypeScript, Swift) · Database Internals & Synchronization Protocols
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
