"use client";

import { education } from "@/data/education";
import { useMode } from "@/components/mode-provider";
import { Container } from "@/components/container";

export function Education() {
  const { mode } = useMode();
  const entry = education[0];

  return (
    <section className="border-t border-line">
      <Container className="py-20 sm:py-24">
        <h2 className="eyebrow">Education</h2>
        {mode === "recruiter" ? (
          <div className="mt-6">
            <h3 className="text-xl font-medium tracking-tight">{entry.school}</h3>
            <p className="mt-1 text-graphite">
              {entry.degree}
              {entry.honorsCollege ? ` · ${entry.honorsCollege}` : ""}
            </p>
            <p className="mt-3 text-graphite">
              CGPA {entry.cgpa} · Expected graduation: {entry.graduation} · {entry.notes}
            </p>
            <ul className="mt-4 list-inside list-disc text-graphite">
              {entry.extracurriculars?.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-line bg-mist p-6 sm:p-8">
            <h3 className="text-xl font-medium tracking-tight">{entry.school}</h3>
            <p className="mt-1 text-graphite">
              {entry.degree}
              {entry.honorsCollege ? ` · ${entry.honorsCollege}` : ""}
            </p>
            <p className="mt-3 text-graphite">
              CGPA {entry.cgpa} · Expected graduation: {entry.graduation} · {entry.notes}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {entry.extracurriculars?.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-line bg-paper px-3 py-1 text-sm text-graphite"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
