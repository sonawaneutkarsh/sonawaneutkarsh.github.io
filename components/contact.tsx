import { Mail, MapPin, FileText, ArrowUpRight } from "lucide-react";
import { contact } from "@/data/contact";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-14">
      <Container className="py-20 sm:py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
          <h2 className="eyebrow">Contact</h2>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Get in touch.
          </p>
          <p className="mt-4 text-base text-graphite leading-relaxed">
            I&rsquo;m always open to discussing LLMs, agentic systems, backend infrastructure, or undergraduate research. Feel free to reach out.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {contact.email}
            </a>

            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-mist"
            >
              <FileText className="h-4 w-4 text-signal" aria-hidden="true" />
              Download Résumé (PDF)
            </a>
          </div>

          <p className="mt-4 text-sm text-graphite">
            You can also reach me directly at{" "}
            <a
              href={`mailto:${contact.personalEmail || "utkarshsonawane67@gmail.com"}`}
              className="text-ink underline underline-offset-4 transition-colors hover:text-signal"
            >
              {contact.personalEmail || "utkarshsonawane67@gmail.com"}
            </a>
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-graphite">
            <a
              href={contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-ink transition-colors"
            >
              LinkedIn <ArrowUpRight className="h-3.5 w-3.5" />
            </a>

            <a
              href={`https://github.com/${contact.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-ink transition-colors"
            >
              GitHub <ArrowUpRight className="h-3.5 w-3.5" />
            </a>

            <span className="inline-flex items-center gap-1 text-graphite">
              <MapPin className="h-3.5 w-3.5" />
              {contact.location}
            </span>
          </div>
        </div>
        </Reveal>
      </Container>
    </section>
  );
}
