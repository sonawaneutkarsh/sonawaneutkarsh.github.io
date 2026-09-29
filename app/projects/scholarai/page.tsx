import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Database, Award, Layers, ShieldCheck, CheckCircle } from "lucide-react";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "ScholarAI Technical Case Study — Utkarsh Sonawane",
  description:
    "Technical case study for ScholarAI: building the data engineering pipeline, relational schema, semantic embedding generation, and pgvector database for 1,000+ Indian government schemes.",
};

export default function ScholarAICaseStudy() {
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
              Data Engineering
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-line bg-mist px-2.5 py-1 font-mono text-xs font-medium text-signal">
              <Award className="h-3 w-3" />
              USAII Global AI Hackathon 2026 — Finalist
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            ScholarAI: Large-Scale Government Scheme Ingestion & Vector Retrieval
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-graphite sm:text-xl">
            India hosts hundreds of welfare and educational support programs across central ministries and state departments,
            yet navigating eligibility criteria remains a barrier for millions of students. Built for the USAII Global AI
            Hackathon 2026 (6,081+ participants worldwide, 5-person team), ScholarAI is an AI-powered discovery platform.
            As the team&rsquo;s <strong>Data Engineer</strong>, I engineered the complete data pipeline: scraping and regex-normalizing
            1,008 heterogeneous scheme records, generating 384-dimensional dense semantic embeddings, and architecting the
            PostgreSQL + pgvector storage foundation that powers downstream hybrid search and agentic reasoning.
          </p>

          {/* Action Links */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/faridabachir769-code/USAII_GlobalAI-Hackathon-2026_ScholarAI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-mist px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              View Team Repository on GitHub
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 gap-4 rounded-lg border border-line bg-mist/50 p-4 sm:grid-cols-4">
            <div>
              <p className="eyebrow">Data Volume</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">1,008 Schemes</p>
            </div>
            <div>
              <p className="eyebrow">Vector Dimension</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">384-dim (gte-small)</p>
            </div>
            <div>
              <p className="eyebrow">Database & Index</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">PostgreSQL + pgvector</p>
            </div>
            <div>
              <p className="eyebrow">Hackathon Result</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">Finalist (6,081+ Users)</p>
            </div>
          </div>
        </header>

        {/* Visual Highlights */}
        <section className="mt-10 border-b border-line pb-12" aria-labelledby="scholarai-visuals-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="scholarai-visuals-heading" className="eyebrow">
              Application Interfaces
            </h2>
            <span className="font-mono text-xs text-graphite">Frontend Powered by Vector & Relational Store</span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Dashboard Screenshot */}
            <div className="flex flex-col rounded-xl border border-line bg-paper p-4">
              <div className="overflow-hidden rounded-lg border border-line/60 bg-slate-50 shadow-sm">
                <Image
                  src="/images/projects/scholarai/scholarai-dashboard.png"
                  alt="ScholarAI Dashboard displaying personalized recommended government schemes with match percentage badges"
                  width={1200}
                  height={768}
                  className="h-auto w-full object-contain"
                />
              </div>
              <h3 className="mt-3 font-mono text-xs font-semibold uppercase text-ink">
                Discovery Dashboard
              </h3>
              <p className="mt-1 text-xs text-graphite">
                Personalized scheme recommendations ranked by hybrid semantic similarity and rule-based profile matching.
              </p>
            </div>

            {/* Comparison Screenshot */}
            <div className="flex flex-col rounded-xl border border-line bg-paper p-4">
              <div className="overflow-hidden rounded-lg border border-line/60 bg-slate-50 shadow-sm">
                <Image
                  src="/images/projects/scholarai/scholarai-comparison.png"
                  alt="ScholarAI Scheme Comparison interface with multi-factor scoring breakdown bars and matched criteria badges"
                  width={1200}
                  height={768}
                  className="h-auto w-full object-contain"
                />
              </div>
              <h3 className="mt-3 font-mono text-xs font-semibold uppercase text-ink">
                Multi-Factor Scheme Comparison
              </h3>
              <p className="mt-1 text-xs text-graphite">
                Side-by-side comparison displaying eligibility scores, benefit metrics, matched criteria badges, and difficulty assessments.
              </p>
            </div>
          </div>
        </section>

        {/* Role & Attribution Clarity Callout */}
        <section className="my-8 rounded-lg border border-line bg-mist p-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">
              Team Attribution & Role Separation
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 text-xs leading-relaxed text-graphite sm:grid-cols-2">
            <div>
              <strong className="text-ink">My Direct Contribution (Data Engineering):</strong>
              <p className="mt-1">
                I engineered the data pipeline located in <code className="font-mono text-[11px]">data-engineering/</code>:
                scraped and regex-normalized 1,008 raw schemes, resolved corrupted formatting and concatenated lists, designed the relational schema
                and rules models, generated 384-dimensional GTE embeddings, and built batched loaders into PostgreSQL with pgvector for hybrid retrieval.
              </p>
            </div>
            <div>
              <strong className="text-ink">Team Engineering (Full-Stack & Agents):</strong>
              <p className="mt-1">
                My teammates built the FastAPI backend services, the 11-node LangGraph orchestration pipeline,
                local Qwen2.5:3B LLM inference, 3-tier caching, document OCR parsing, and the React 19 frontend interface.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <article className="mt-12 space-y-16 text-base leading-relaxed">
          {/* Section 1: The Problem */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">1. The Problem: Unstructured Government Scheme Portals</h2>
            <p>
              Government welfare and scholarship programs in India are published across dozens of federal and state portals.
              While vast financial aid is allocated each fiscal year, citizen discovery suffers from critical data engineering bottlenecks:
            </p>
            <ul className="list-disc space-y-2.5 pl-5 text-sm text-graphite">
              <li>
                <strong className="text-ink">Highly Heterogeneous Text:</strong> Public portals contain no unified schema.
                One scheme lists document requirements as clean bullet points, another as an unformatted run-on paragraph,
                and another as camelCase-concatenated text strings without punctuation or delimiters.
              </li>
              <li>
                <strong className="text-ink">Multi-Tiered Eligibility Rules:</strong> Criteria involve strict numerical thresholds
                (e.g., family annual income &le; &#8377;2.5 Lakh), categorical constraints (Scheduled Tribe, OBC, General, PwD),
                geographic jurisdiction (State domicile vs. Central eligibility), and academic status (enrolled in recognized post-matric course).
              </li>
              <li>
                <strong className="text-ink">Pure Keyword Search Fails:</strong> A student searching for &ldquo;tuition fee waiver for engineering&rdquo;
                will miss &ldquo;Post Matric Financial Assistance to ST Scholars&rdquo; under simple keyword matching, because official scheme titles rarely match colloquial student queries.
              </li>
            </ul>
          </section>

          {/* Section 2: Data Pipeline Architecture */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">2. Data Pipeline Architecture</h2>
            <p>
              To power reliable retrieval and deterministic rule verification, I built a multi-stage data engineering pipeline
              that transforms raw public portal dumps into queryable relational and vector records:
            </p>

            {/* Pipeline Visual Diagram */}
            <div className="rounded-lg border border-line bg-paper p-6 font-mono text-xs leading-relaxed overflow-x-auto">
              <pre className="text-ink overflow-x-auto">
{`┌────────────────────────────────────────────────────────────────────────┐
│                        Raw Public Scheme Data                          │
│  • Web scraper extraction across central and state welfare portals     │
│  • 1,008 raw JSON files in data-engineering/scraped_schemes/           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Regex Pattern Normalization
                                    │ (batch_normalizer.py)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Text Normalization & Parsing                       │
│  • CamelCase boundary splitting: re.sub(r'(?<=[a-z])(?=[A-Z])', '|')   │
│  • Process workflow extraction: re.findall(r'Step \\d+:.*?', re.DOTALL) │
│  • Relational schema mapping: metadata, rules, benefits, and FAQs      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Dense Semantic Vector Generation
                                    │ (generate_embeddings.py)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Semantic Embedding Generation                      │
│  • Model: thenlper/gte-small (384-dimensional dense vectors)           │
│  • Composite text: scheme name + overview + eligibility + benefits     │
│  • Vectorized batch encoding (batch_size = 32) via SentenceTransformer │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Batched Supabase Ingestion
                                    │ (bulk_insert.py, batch_size = 50)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL + pgvector Database                      │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   Relational Schema   │  │             Vector Index              │  │
│  │  • schemes table      │  │  • pgvector (384-dim, cosine <=>)     │  │
│  │  • rules (income caps)│  │  • tsvector (full-text search)        │  │
│  │  • faqs table         │  │  • pg_trgm (fuzzy scheme name match)  │  │
│  └───────────────────────┘  └───────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Hybrid Query Execution (Vector + Keyword)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Downstream Platform (Team-Engineered Services)             │
│  • LangGraph 11-Node Agent Pipeline & Local Qwen2.5:3B LLM             │
│  • Deterministic Eligibility Gates & Multi-Factor Comparison Engine    │
│  • React 19 Citizen Discovery Dashboard & What-If Simulator            │
└────────────────────────────────────────────────────────────────────────┘`}
              </pre>
            </div>
          </section>

          {/* Section 3: Extraction & Normalization */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">3. Robust Regex-Based Normalization</h2>
            <p>
              A major engineering hurdle in <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">batch_normalizer.py</code> was
              repairing unstructured text scraped from government web forms.
              Two parsing techniques proved essential:
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">CamelCase Document Splitting</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Scraped document lists frequently lacked whitespace or commas (e.g. <code className="font-mono text-xs">AadhaarCardIncomeCertificateHostelCertificate</code>).
                  A regex lookaround pattern detected lowercase-to-uppercase character transitions:
                </p>
                <div className="mt-2 rounded bg-mist p-2 font-mono text-xs text-ink">
                  re.sub(r&apos;(?&lt;=[a-z])(?=[A-Z])&apos;, &apos;|&apos;, doc_string)
                </div>
                <p className="mt-2 text-xs text-graphite">
                  Splitting by delimiter transformed run-on blocks into structured arrays of required certificates.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Workflow Step Extraction</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Application workflows were buried within dense paragraphs.
                  A non-greedy regular expression parsed sequential steps:
                </p>
                <div className="mt-2 rounded bg-mist p-2 font-mono text-xs text-ink">
                  re.findall(r&apos;Step \d+:.*?(?=Step \d+:|$)&apos;, s, re.DOTALL)
                </div>
                <p className="mt-2 text-xs text-graphite">
                  Cleaned steps were isolated into actionable, ordered instructions for citizen guidance.
                </p>
              </div>
            </div>

            <p className="text-sm text-graphite">
              The batch pipeline processed all 1,008 raw files, validated required fields (rejecting corrupt or empty entries),
              and exported clean, schema-compliant JSON ready for database ingestion and vectorization.
            </p>
          </section>

          {/* Section 4: Semantic Embeddings */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">4. Semantic Vector Embeddings (gte-small)</h2>
            <p>
              To allow natural language retrieval against administrative scheme descriptions, I integrated
              <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">thenlper/gte-small</code> via SentenceTransformers.
              GTE-small generates <strong>384-dimensional dense vectors</strong>, providing an optimal balance of semantic clustering quality
              and lightweight memory footprint for local and cloud PostgreSQL deployment.
            </p>
            <p>
              Rather than embedding scheme titles alone, <code className="font-mono text-xs">generate_embeddings.py</code> constructed a composite text block:
            </p>
            <div className="rounded bg-mist p-3 font-mono text-xs text-ink">
              [scheme_name] + [description] + [benefits] + [eligibility_summary]
            </div>
            <p className="text-sm text-graphite">
              Encoding was executed in batches of 32 (<code className="font-mono text-xs">batch_size = 32</code>), generating dense vectors
              for all 1,008 schemes in minutes. Vectors were serialized directly alongside relational records for atomic loading.
            </p>
          </section>

          {/* Section 5: PostgreSQL + pgvector */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">5. PostgreSQL & pgvector Database Architecture</h2>
            <p>
              The persistence layer was designed around PostgreSQL with the <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">pgvector</code> extension:
            </p>
            <ul className="list-disc space-y-2.5 pl-5 text-sm text-graphite">
              <li>
                <strong className="text-ink">Relational Models:</strong> SQLAlchemy models partitioned data across
                <code className="font-mono text-xs">schemes</code> (authoritative title, benefits, ministry, URL),
                <code className="font-mono text-xs">rules</code> (structured income upper-bounds, category constraints, student requirements),
                and <code className="font-mono text-xs">faqs</code> (official government question-and-answer pairs).
              </li>
              <li>
                <strong className="text-ink">Hybrid Search Indexing:</strong> Queries execute across three complementary indices:
                pgvector cosine distance (<code className="font-mono text-xs">&lt;=&gt;</code>) for semantic similarity,
                PostgreSQL <code className="font-mono text-xs">tsvector</code> for full-text keyword matching, and
                <code className="font-mono text-xs">pg_trgm</code> for typo-tolerant trigram search on scheme titles.
              </li>
              <li>
                <strong className="text-ink">Batched Ingestion Pipeline:</strong> To avoid network timeouts when populating Supabase,
                <code className="rounded bg-mist px-1 py-0.5 font-mono text-xs">bulk_insert.py</code> streams records in batches of 50,
                verifying foreign key constraints and vector dimensionality before committing each transaction.
              </li>
            </ul>
          </section>

          {/* Section 6: Downstream Integration */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">6. Downstream System Architecture (Team Contributions)</h2>
            <p>
              With the clean data foundation in place, my teammates built the surrounding application services:
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-mist/30 p-4">
                <p className="font-mono text-xs font-semibold uppercase text-ink">LangGraph 11-Node Pipeline</p>
                <p className="mt-1 text-xs text-graphite">
                  StateGraph orchestrating intent extraction, question planning, eligibility filtering, vector retrieval, and verification.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-mist/30 p-4">
                <p className="font-mono text-xs font-semibold uppercase text-ink">Local LLM Reasoning</p>
                <p className="mt-1 text-xs text-graphite">
                  Qwen2.5:3B running via GGUF for private, on-device eligibility verification, decision reports, and side-by-side comparison scoring.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-mist/30 p-4">
                <p className="font-mono text-xs font-semibold uppercase text-ink">3-Tier Caching</p>
                <p className="mt-1 text-xs text-graphite">
                  Memory &rarr; Redis &rarr; PostgreSQL multi-layer caching reducing redundant LLM inferences and vector queries.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-mist/30 p-4">
                <p className="font-mono text-xs font-semibold uppercase text-ink">React 19 Frontend</p>
                <p className="mt-1 text-xs text-graphite">
                  Vite + Tailwind CSS interface featuring citizen onboarding, interactive comparison matrices, and What-If profile simulations.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Tradeoffs & Lessons */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">7. Engineering Tradeoffs & Lessons</h2>

            <div className="space-y-6">
              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Deterministic Rules vs. Pure LLM Filtering</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Early design discussions considered passing all 1,000+ schemes directly to an LLM for eligibility determination.
                  This was rejected due to latency, token costs, and hallucination risks.
                  Instead, the architecture enforces a strict two-stage gate: the relational database first filters out impossible candidates
                  using deterministic numerical constraints (<code className="font-mono text-xs">income_max</code>, category, state domicile).
                  The LLM is invoked only on the top candidate pool to evaluate nuanced qualitative criteria, reducing inference volume by over 95%.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Pre-Computed Embeddings vs. Dynamic Ingestion</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Because government scheme details change infrequently (primarily during annual budget cycles),
                  pre-computing embeddings offline during data ingestion proved far superior to dynamic runtime embedding generation.
                  The backend queries the pgvector index directly with the user query vector in milliseconds without incurring per-scheme embedding latency.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Hackathon Results & Verification */}
          <section className="space-y-4 border-t border-line pt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">8. Hackathon Verification & Results</h2>
            <p className="text-sm text-graphite">
              ScholarAI was developed for the <strong>USAII Global AI Hackathon 2026</strong>, competing against <strong>6,081+ participants</strong> worldwide
              across multi-disciplinary software engineering and AI tracks.
              The project was selected as a <strong>Finalist</strong> based on its working hybrid retrieval system,
              accurate eligibility matching, and end-to-end user experience across 1,008 live schemes.
            </p>
          </section>

          {/* Section 9: Closing */}
          <section className="space-y-4 border-t border-line pt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">9. Source Code & Team Repository</h2>
            <p className="text-sm text-graphite">
              ScholarAI is open source under the MIT License. The team repository includes the data engineering scripts,
              FastAPI backend, LangGraph state graph implementations, and React 19 frontend application.
            </p>
            <div className="pt-2">
              <a
                href="https://github.com/faridabachir769-code/USAII_GlobalAI-Hackathon-2026_ScholarAI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-signal hover:underline"
              >
                Explore the ScholarAI repository on GitHub <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </section>
        </article>
      </Container>
    </div>
  );
}
