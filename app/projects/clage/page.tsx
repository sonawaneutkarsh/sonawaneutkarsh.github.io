import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Network, Dna, GitBranch, FlaskConical } from "lucide-react";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "Clage Technical Case Study — Utkarsh Sonawane",
  description:
    "Technical case study for Clage: a from-scratch Python implementation of NeuroEvolution of Augmenting Topologies (NEAT) and 2D artificial life simulation.",
};

export default function ClageCaseStudy() {
  return (
    <div className="min-h-screen py-12 sm:py-16">
      <Container className="max-w-4xl">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 text-sm text-graphite transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Selected Work
          </Link>
        </div>

        {/* Header */}
        <header className="border-b border-line pb-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-line bg-mist px-2.5 py-1 font-mono text-xs font-medium text-graphite uppercase tracking-wider">
              Core Algorithms
            </span>
            <span className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-xs text-graphite">
              Artificial Life
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Clage: Neuroevolution & Artificial Life from Scratch
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-graphite sm:text-xl">
            A pure Python implementation of NeuroEvolution of Augmenting Topologies (NEAT) built without{" "}
            <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-sm">neat-python</code> or machine-learning libraries.
            Paired with an energy-constrained 2D simulation world, reproducible multi-seed experiments, and behavioral diversity metrics.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 gap-4 rounded-lg border border-line bg-mist/50 p-4 sm:grid-cols-4">
            <div>
              <p className="eyebrow">Automated Tests</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">188 Tests</p>
            </div>
            <div>
              <p className="eyebrow">External ML Deps</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">Zero (Pure Python)</p>
            </div>
            <div>
              <p className="eyebrow">Benchmarks</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">OR/AND/XOR/Sin</p>
            </div>
            <div>
              <p className="eyebrow">Source Code</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">
                <a
                  href="https://github.com/sonawaneutkarsh/Clage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-signal hover:underline"
                >
                  GitHub <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <article className="mt-12 space-y-16 text-base leading-relaxed">
          {/* Section 1: Why Build NEAT from Scratch? */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">1. Why Build NEAT from Scratch?</h2>
            <p>
              Modern deep learning treats neural network topologies as static, fixed computation graphs where only connection
              weights are optimized via backpropagation. In contrast, Kenneth Stanley&rsquo;s <em>NeuroEvolution of Augmenting Topologies (NEAT)</em>{" "}
              evolves both connection weights <strong>and</strong> the graph structure simultaneously.
            </p>
            <p>
              While standard packages like <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">neat-python</code> exist,
              they obscure the subtle graph mechanics: how to cross over two neural networks of radically different shapes without combinatorial explosion,
              how to prevent destructive competition among novel structures, and how to verify topological correctness.
            </p>
            <p>
              I built Clage from first principles to understand exactly what happens underneath evolutionary graph abstractions.
              Every line of code—from gene encoding to speciation distance equations—is implemented in pure Python, backed by a rigorous 188-test suite.
            </p>
          </section>

          {/* Section 2: Core Algorithm Mechanics */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">2. Core Algorithm Architecture</h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Global Innovation Ledger</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  To align matching genes between two arbitrarily evolved neural networks during crossover, Clage maintains a global innovation database.
                  When a structural mutation adds a connection between node <code className="font-mono text-xs">in</code> and node <code className="font-mono text-xs">out</code>,
                  the ledger checks if that exact innovation occurred elsewhere in the current generation. If so, it reuses the historical innovation number;
                  otherwise, it increments the global counter. This makes linear-time topological alignment possible.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <Dna className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Speciation & Compatibility</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Structural additions initially decrease fitness because new connections have unoptimized weights.
                  Clage partitions the population into evolutionary niches (species) using Kenneth Stanley&rsquo;s compatibility distance:
                </p>
                <div className="mt-2 rounded bg-mist p-2 font-mono text-xs text-ink">
                  &delta; = (c1 &middot; E / N) + (c2 &middot; D / N) + c3 &middot; &Delta;W
                </div>
                <p className="mt-2 text-xs text-graphite">
                  where E is excess genes, D is disjoint genes, and &Delta;W is average weight difference across matching genes.
                  The normalizer N is set to 1 for small genomes (&lt; 20 connections) to prevent distance collapse. Species maintain
                  persistent representative champions, age counters, and stagnation tracking with explicit shared fitness.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Phenotype Network Construction</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Clage decodes genome connection lists into executable feed-forward neural networks in pure Python.
                  A deterministic evaluation order is established using Kahn&rsquo;s topological sort with min-heap tie-breaking on node IDs.
                  Active graph cycles raise a <code className="rounded bg-mist px-1 py-0.5 font-mono text-xs">ValueError</code> at decode time
                  (strictly feed-forward, cyclic graphs rejected at decode time), and node activations compute <code className="rounded bg-mist px-1 py-0.5 font-mono text-xs">math.tanh</code> over incoming weighted sums plus bias.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Benchmark Validation</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Before deploying the engine in an open-ended simulation, the evolutionary implementation was validated across fixed random seeds against:
                  <strong>OR</strong>, <strong>AND</strong>, non-linearly separable <strong>XOR</strong> (requiring evolved hidden nodes),
                  and continuous <strong>sine wave regression</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: 2D Artificial Life Simulation */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">3. 2D Artificial-Life Environment</h2>
            <p>
              Once benchmarked, the NEAT engine was connected to an embodied 2D walled grid world with energy dynamics:
            </p>
            <ul className="list-disc space-y-2.5 pl-5 text-sm text-graphite">
              <li>
                <strong className="text-ink">9-Number Observation Vector:</strong> At every tick, an organism observes its surroundings via a normalized 9-element array:
                <code className="mt-1 block rounded bg-mist p-2 font-mono text-xs text-ink">
                  [food_dx, food_dy, food_density, organism_density, normalized_energy, boundary_x, boundary_y, prev_move, prev_eat]
                </code>
                where <code className="font-mono text-xs">food_dx</code> and <code className="font-mono text-xs">food_dy</code> are normalized offsets to the nearest food item in [-1.0, 1.0],
                <code className="font-mono text-xs">food_density</code> and <code className="font-mono text-xs">organism_density</code> count entities within a radial window,
                <code className="font-mono text-xs">normalized_energy</code> represents remaining energy fraction,
                <code className="font-mono text-xs">boundary_x</code> / <code className="font-mono text-xs">boundary_y</code> measure wall proximity (1.0 at walls, 0.0 at center),
                and <code className="font-mono text-xs">prev_move</code> / <code className="font-mono text-xs">prev_eat</code> are binary indicators of the organism&rsquo;s previous action.
              </li>
              <li>
                <strong className="text-ink">4 Discrete Network Actions:</strong> The neural network outputs 4 values; the organism executes the action corresponding to <code className="font-mono text-xs">argmax(outputs)</code>:
                <div className="mt-1 grid grid-cols-2 gap-2 font-mono text-xs text-ink sm:grid-cols-4">
                  <span className="rounded bg-mist p-1.5 text-center">0: MOVE (Forward)</span>
                  <span className="rounded bg-mist p-1.5 text-center">1: TURN_LEFT (90°)</span>
                  <span className="rounded bg-mist p-1.5 text-center">2: TURN_RIGHT (90°)</span>
                  <span className="rounded bg-mist p-1.5 text-center">3: EAT (Facing Cell)</span>
                </div>
              </li>
              <li>
                <strong className="text-ink">Lifecycle Reproduction (Not a Neural Trigger):</strong> Reproduction is not an action emitted by the network.
                Instead, it is a separate lifecycle event evaluated after action execution and metabolic deduction: if an organism&rsquo;s energy meets or exceeds the reproduction threshold and an adjacent grid cell is vacant, the organism reproduces asexually, transferring a configured energy fraction to an offspring placed in the adjacent cell.
              </li>
              <li>
                <strong className="text-ink">Metabolic & World Dynamics:</strong> Each tick incurs an unavoidable baseline metabolic cost.
                Food regenerates dynamically across configurable spatial distributions to prevent trivial static feeding.
              </li>
            </ul>
          </section>

          {/* Section 4: Behavioral Diversity & Empirical Rigor */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">4. Behavioral Diversity & Empirical Rigor</h2>
            <p>
              In evolutionary simulations, it is easy to mistake accidental spatial clustering for genuine behavioral intelligence.
              To measure whether populations actually developed diverse survival strategies, I designed a set of quantitative behavioral metrics computed from per-tick traces, including:
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-mist/30 p-4">
                <p className="font-mono text-xs font-semibold text-ink uppercase">Action Entropy</p>
                <p className="mt-1 text-xs text-graphite">
                  Shannon entropy across the 4-action distribution, distinguishing active multi-action policies from degenerate fixed agents.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-mist/30 p-4">
                <p className="font-mono text-xs font-semibold text-ink uppercase">Transition Entropy Rate</p>
                <p className="mt-1 text-xs text-graphite">
                  Conditional entropy H(a<sub>t</sub> | a<sub>t-1</sub>) measuring sequential action structure and temporal predictability beyond raw marginal frequencies.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-mist/30 p-4">
                <p className="font-mono text-xs font-semibold text-ink uppercase">Spatial Grid Coverage</p>
                <p className="mt-1 text-xs text-graphite">
                  Fraction of distinct grid cells visited over the total world area, quantifying dispersion without assuming navigation intent.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-mist/30 p-4">
                <p className="font-mono text-xs font-semibold text-ink uppercase">Food Alignment Cosine</p>
                <p className="mt-1 text-xs text-graphite">
                  Mean cosine between effective movement vectors and nearest-food direction vectors, tracking statistical directional coupling.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-line bg-paper p-5">
              <h3 className="text-sm font-semibold text-ink">Empirical Finding: Food Density Confound</h3>
              <p className="mt-2 text-sm text-graphite">
                During experimental sweeps across food abundance conditions, initial analytics appeared to show that certain conditions yielded significantly higher &ldquo;food navigation intelligence.&rdquo;
                However, rigorous ablation revealed that <code className="rounded bg-mist px-1 py-0.5 font-mono text-xs">food_alignment_cosine</code> was base-rate confounded by local food replenishment density: in dense food environments, random walks naturally align with food items purely due to geometric proximity.
                Once diagnosed, food alignment was excluded from cross-condition comparisons and restricted strictly to within-condition baselines with equalized resource distributions.
              </p>
            </div>
          </section>

          {/* Section 5: Verification Suite */}
          <section className="space-y-4 border-t border-line pt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">5. Verification & Test Suite</h2>
            <p className="text-sm text-graphite">
              The entire engine is validated by <strong>188 unit and integration tests</strong> covering:
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs text-graphite sm:grid-cols-3">
              <span className="rounded border border-line bg-mist p-2">test_genome.py</span>
              <span className="rounded border border-line bg-mist p-2">test_innovation.py</span>
              <span className="rounded border border-line bg-mist p-2">test_crossover.py</span>
              <span className="rounded border border-line bg-mist p-2">test_mutation.py</span>
              <span className="rounded border border-line bg-mist p-2">test_speciation.py</span>
              <span className="rounded border border-line bg-mist p-2">test_phenotype.py</span>
              <span className="rounded border border-line bg-mist p-2">test_population.py</span>
              <span className="rounded border border-line bg-mist p-2">test_world.py</span>
              <span className="rounded border border-line bg-mist p-2">test_benchmarks.py</span>
            </div>
          </section>
        </article>
      </Container>
    </div>
  );
}
