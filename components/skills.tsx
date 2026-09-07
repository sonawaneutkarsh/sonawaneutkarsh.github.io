import { skillGroups } from "@/data/skills";
import { Container } from "@/components/container";

export function Skills() {
  return (
    <section id="skills" className="scroll-mt-14 border-b border-line">
      <Container className="py-20 sm:py-24">
        <div>
          <h2 className="eyebrow">Technical Skills</h2>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Tools I use
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group) => (
            <div
              key={group.category}
              className="rounded-lg border border-line bg-paper p-6 transition-colors hover:border-graphite/40"
            >
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-graphite">
                {group.category}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-line bg-mist px-2.5 py-1 font-mono text-xs text-ink"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
