import { skillGroups } from "@/data/skills";
import { Container } from "@/components/container";

export function Skills() {
  return (
    <section className="border-t border-line">
      <Container className="py-20 sm:py-24">
        <h2 className="eyebrow">Skills</h2>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {skillGroups.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-medium">{group.category}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-line bg-mist px-3 py-1 text-sm text-graphite"
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
