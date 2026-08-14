import { experience } from "@/data/experience";
import { Container } from "@/components/container";

export function Experience() {
  return (
    <section className="border-t border-line">
      <Container className="py-20 sm:py-24">
        <h2 className="eyebrow">Experience</h2>
        {experience.length > 0 ? (
          <div className="mt-6">
            {experience.map((entry) => (
              <article key={`${entry.company}-${entry.role}`}>
                <h3 className="text-xl font-medium tracking-tight">{entry.role}</h3>
                <p className="mt-1 text-graphite">
                  {entry.company}
                  {entry.location ? ` · ${entry.location}` : ""}
                  {entry.start || entry.end ? ` · ${entry.start ?? ""} — ${entry.end ?? "present"}` : ""}
                </p>
                {entry.points ? (
                  <ul className="mt-4 list-inside list-disc text-graphite">
                    {entry.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 max-w-3xl text-graphite">
            Currently building toward a junior-year internship — see Projects below for what I&apos;ve
            shipped in the meantime.
          </p>
        )}
      </Container>
    </section>
  );
}
