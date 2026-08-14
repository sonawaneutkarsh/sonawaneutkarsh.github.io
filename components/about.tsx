import { Container } from "@/components/container";

export function About() {
  return (
    <section className="border-t border-line">
      <Container className="py-20 sm:py-24">
        <h2 className="eyebrow">About</h2>
        {/* TODO: Replace this placeholder with your own bio copy. */}
        <p className="mt-6 max-w-3xl text-xl leading-relaxed text-ink">
          Your bio goes here — replace this paragraph with your own writing.
        </p>
      </Container>
    </section>
  );
}
