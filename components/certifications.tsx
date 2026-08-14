import { certifications } from "@/data/certifications";
import { Container } from "@/components/container";

export function Certifications() {
  if (certifications.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-line">
      <Container className="py-20 sm:py-24">
        <h2 className="eyebrow">Certifications</h2>
        <ul className="mt-6 space-y-4">
          {certifications.map((certification) => (
            <li key={certification.name}>
              <p className="font-medium">{certification.name}</p>
              <p className="mt-0.5 text-sm text-graphite">
                {certification.issuer}
                {certification.date ? ` · ${certification.date}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
