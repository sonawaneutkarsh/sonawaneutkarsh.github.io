import { Container } from "@/components/container";

export function About() {
  return (
    <section id="about" className="scroll-mt-14 border-b border-line">
      <Container className="py-20 sm:py-24">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="eyebrow">About</h2>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Why I build
            </p>
          </div>

          <div className="md:col-span-2 space-y-5 text-base text-graphite leading-relaxed">
            <p>
              Most of my projects start with a problem I keep running into. I like building things that
              become part of my routine instead of one-off demos. Nytr is the clearest example &mdash; I
              genuinely use it every day to guide my nutrition and training. Devvy came from wanting my
              development setup to work the way I wanted without manually managing everything around it.
            </p>
            <p>
              Not everything I build starts as a practical tool. Sometimes I build something because I
              want to understand it properly. Clage came from wanting to understand neuroevolution deeply
              enough to implement NEAT myself instead of treating it as a library call. That&rsquo;s usually
              how I learn: build the thing, use it, and then keep digging into the layers underneath.
            </p>
            <p>
              Right now I&rsquo;m spending most of my time around LLMs, agentic systems, and backend
              infrastructure &mdash; especially the problem of turning powerful AI systems into tools
              reliable enough to actually use every day.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
