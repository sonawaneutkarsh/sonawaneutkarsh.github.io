import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";

export function About() {
  return (
    <section id="about" className="scroll-mt-14 border-b border-line">
      <Container className="py-20 sm:py-24">
        <Reveal>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="eyebrow">About</h2>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Why I build
            </p>
          </div>

          <div className="md:col-span-2 space-y-5 text-base text-graphite leading-relaxed">
            <p>
              I started building things because I wanted to improve parts of my own day-to-day life.
              I like making software that becomes part of my routine instead of something I build once
              and never use again. Nytr is a good example. I train regularly, and I wanted something
              that could scan the dining options at Penn State each day and recommend meals that fit
              my nutrition goals. So I built it. I genuinely use Nytr every day to help make decisions
              about my nutrition and training.
            </p>
            <p>
              Not everything I build starts with a practical problem, though. Sometimes I build something
              simply because I want to understand how it works. When I started tinkering with autonomous
              systems, I became interested in how behavior could emerge from the algorithms underneath
              them. That led me to neuroevolution and eventually to Clage, where I implemented NEAT myself
              instead of treating it as a library call. That&rsquo;s usually how I learn: build something,
              understand it from the inside, and keep improving it as I learn more.
            </p>
            <p>
              Right now, I&rsquo;m spending most of my time exploring LLMs, agentic systems, and backend
              infrastructure.
            </p>
          </div>
        </div>
        </Reveal>
      </Container>
    </section>
  );
}
