import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Database, Cpu, Activity } from "lucide-react";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "Nytr Technical Case Study — Utkarsh Sonawane",
  description:
    "Technical case study for Nytr: an evidence-driven personal nutrition and training decision platform built with Python, FastAPI, Supabase PostgreSQL, Apple HealthKit, and native SwiftUI.",
};

export default function NytrCaseStudy() {
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
              Flagship Project
            </span>
            <span className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-xs text-graphite">
              Production System
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Nytr: Evidence-Driven Nutrition & Training Decision Platform
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-graphite sm:text-xl">
            A personal decision system built from first principles to eliminate digital health hallucinations.
            Combines Penn State dining menus, Apple HealthKit telemetry, and Hevy workout data via a FastAPI
            modular monolith, Supabase PostgreSQL, and a native SwiftUI iOS client.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 gap-4 rounded-lg border border-line bg-mist/50 p-4 sm:grid-cols-4">
            <div>
              <p className="eyebrow">Backend Suite</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">1,041 Tests</p>
            </div>
            <div>
              <p className="eyebrow">Math Precision</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">Deterministic Decimal</p>
            </div>
            <div>
              <p className="eyebrow">Sync Engine</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">Dual Anchors</p>
            </div>
            <div>
              <p className="eyebrow">Database Security</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">RLS & Tombstones</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <article className="mt-12 space-y-16 text-base leading-relaxed">
          {/* Section 1: Overview & Philosophy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">1. Overview & System Philosophy</h2>
            <p>
              Most fitness and diet applications operate on fragile assumptions: they trust uncalibrated user inputs,
              rely on probabilistic AI chatbots to guess portion weights, and silently mutate historical records.
              When apps auto-adjust daily calorie allowances based on questionable Apple Watch burn estimates (&ldquo;exercise-calorie eat-back&rdquo;),
              users routinely blow their real dietary budgets.
            </p>
            <p>
              <strong>Nytr</strong> was conceived from an uncompromising engineering premise:
            </p>
            <div className="my-6 rounded-lg border border-line bg-mist p-6 text-center">
              <span className="font-mono text-sm tracking-widest text-graphite uppercase">Core Principle</span>
              <p className="mt-2 font-mono text-xl font-bold tracking-tight text-ink sm:text-2xl">
                DATA &rarr; DETERMINISTIC CALCULATION &rarr; DECISION
              </p>
              <p className="mx-auto mt-2 max-w-xl text-xs text-graphite">
                Raw facts are ingested with immutable provenance. Math runs deterministically in pure domain logic.
                Decisions belong exclusively to the human user.
              </p>
            </div>
            <p>
              Nytr is <strong>not</strong> a generic calorie tracker, an LLM chatbot wrapper, or an automated health dashboard.
              It is an operational decision platform deployed for daily life at Penn State Harrisburg, specifically bounded
              to campus dining (Stacks Market), Apple HealthKit weight observations, and Hevy strength logs.
            </p>
          </section>

          {/* Section 2: Source Authority Matrix */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">2. Explicit Source Authority</h2>
            <p>
              Distributed data systems fail when multiple sources claim ownership over the same domain concept.
              Nytr prevents source confusion through a strict, non-negotiable authority matrix:
            </p>

            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-mist font-mono text-xs uppercase text-graphite">
                  <tr>
                    <th className="p-3.5">Upstream Source</th>
                    <th className="p-3.5">Exclusive Authority</th>
                    <th className="p-3.5">Deliberately Forbidden Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-mono text-xs">
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Penn State Dining (Stacks)</td>
                    <td className="p-3.5 text-graphite">Menu availability, serving units, recipe names, published macro profiles</td>
                    <td className="p-3.5 text-graphite">Cannot dictate meal timing, user schedule, or daily calorie targets</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Apple HealthKit (via iOS Companion)</td>
                    <td className="p-3.5 text-graphite">Historical body mass, workout session timing context</td>
                    <td className="p-3.5 text-graphite">Active calorie burn cannot alter food recommendations; no on-device trend math</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Hevy Official API</td>
                    <td className="p-3.5 text-graphite">Workout exercise sets, reps, load, and volume progression revisions</td>
                    <td className="p-3.5 text-graphite">Cannot alter HealthKit session authority or create unlogged sessions</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">FastAPI / PostgreSQL Backend</td>
                    <td className="p-3.5 text-graphite">Deterministic plan scoring, target policies, 28-day trends, audit logs</td>
                    <td className="p-3.5 text-graphite">Cannot auto-apply target modifications without explicit user approval</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Architecture Diagram */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">3. Architecture & Public-Safe Topology</h2>
            <p>
              Nytr avoids fragile microservices in favor of a <strong>Python + FastAPI modular monolith</strong> backed by
              Supabase PostgreSQL and a native SwiftUI iOS companion client:
            </p>

            {/* Architecture Visual Diagram */}
            <div className="rounded-lg border border-line bg-paper p-6 font-mono text-xs leading-relaxed overflow-x-auto">
              <pre className="text-ink">
{`┌────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│   Penn State Stacks    │      │    Apple HealthKit      │      │     Hevy Cloud API      │
│  Daily Menu Scraper    │      │   (Native iOS Client)   │      │ (Official Developer API)│
└───────────┬────────────┘      └────────────┬────────────┘      └────────────┬────────────┘
            │ Bounded Ingestion              │ Idempotent Sync                │ Append-Only Sync
            ▼ Compliance Gate                ▼ Dual Anchors                   ▼ Token Redacted
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Modular Monolith                                  │
│                                                                                          │
│  ┌──────────────────────┐  ┌───────────────────────┐  ┌───────────────────────────────┐  │
│  │   Dining Ingestion   │  │   HealthKit Receiver  │  │    Training Syncer (Hevy)     │  │
│  │  • Complete vs Usable│  │  • Tombstone Deletion │  │  • Session Revisions          │  │
│  │  • Mid Identity Reuse│  │  • kg Unit Canonical  │  │  • Volume & Progression Math  │  │
│  └──────────┬───────────┘  └───────────┬───────────┘  └───────────────┬───────────────┘  │
│             │                          │                              │                  │
│             ▼                          ▼                              ▼                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                               Pure Domain Engine                                   │  │
│  │  • Deterministic Decimal Arithmetic (exact numeric precision)                      │  │
│  │  • Schedule Resolution (Class schedule + workout timing context)                   │  │
│  │  • Strict Dietary Eligibility Gates (Diet-Specific Filtering)                     │  │
│  │  • Bounded Candidate Scoring & Frozen Plan Generation (SHA-256 Fingerprint)        │  │
│  │  • 28-Day Theil-Sen Body-Mass Trend & Explicit Target Review Policy                │  │
│  └─────────────────────────────────────┬──────────────────────────────────────────────┘  │
└────────────────────────────────────────┼─────────────────────────────────────────────────┘
                                         │ Authenticated RLS / Backend Service Connection
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Supabase PostgreSQL                                      │
│  • Immutable Plan Runs, Items & Target Policy Versions (Append-Only)                     │
│  • Controlled Tombstone Updates (tombstoned_at) on HealthKit Sync Records                │
│  • Shared Dining Menus & Station Cache (Read via Backend Service Connection)             │
│  • User-Owned Tables Protected by Row-Level Security (RLS) Bound to Auth Identity        │
└──────────────────────────────────────────────────────────────────────────────────────────┘`}
              </pre>
            </div>
          </section>

          {/* Section 4: Engineering Challenges */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">4. Key Engineering Challenges</h2>

            <div className="space-y-6">
              {/* Challenge 1 */}
              <div className="rounded-lg border border-line bg-mist/40 p-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-signal" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-ink">
                    Dual-Anchor HealthKit Synchronization & Tombstone Semantics
                  </h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Syncing mobile health telemetry over cellular networks without state corruption requires
                  distinguishing between transient query state and durable storage:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-graphite">
                  <li>
                    <strong className="text-ink">Transient vs Durable Anchors:</strong> The iOS companion uses an in-memory{" "}
                    <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">HKQueryAnchor</code> during anchored queries.
                    However, the durable sync anchor (<code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">health.sync.*.durableState.v1</code>)
                    advances in device keychain storage <em>only after</em> the backend confirms a successful database transaction commit.
                    If a crash occurs mid-flight, the batch safely replays without duplication.
                  </li>
                  <li>
                    <strong className="text-ink">Idempotent Tombstone Deletions:</strong> When samples are deleted in Apple Health,
                    a tombstone record is committed (<code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">tombstoned_at</code>).
                    If an out-of-order add arrives for an already-tombstoned UUID, the backend immediately drops it—preventing ghost resurrection of deleted data.
                  </li>
                </ul>
              </div>

              {/* Challenge 2 */}
              <div className="rounded-lg border border-line bg-mist/40 p-6">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-signal" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-ink">
                    Database-Enforced Immutability & Row-Level Security
                  </h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Traditional web apps mutate historical logs when user settings or nutritional profiles change.
                  In Nytr, historical truth is permanent:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-graphite">
                  <li>
                    <strong className="text-ink">PostgreSQL Row-Level Security:</strong> User-owned tables enforce RLS policies bound directly to the authenticated user ID. Plan runs, daily items, and target policy versions are strictly immutable insert-only records.
                  </li>
                  <li>
                    <strong className="text-ink">Controlled Tombstone Semantics:</strong> Health telemetry synchronizations avoid physical row deletion in favor of explicit <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">tombstoned_at</code> timestamps, maintaining historical auditability. Shared global dining menus and station caches are accessed via a dedicated backend service connection without per-user RLS.
                  </li>
                  <li>
                    <strong className="text-ink">Versioned Pinning:</strong> When a daily plan is generated, it pins the exact{" "}
                    <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">nutrition_profile_version_id</code> and{" "}
                    <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">target_policy_version_id</code>.
                    Historical plans never re-query modern food profiles; they represent a verifiable snapshot sealed with a SHA-256 fingerprint.
                  </li>
                </ul>
              </div>

              {/* Challenge 3 */}
              <div className="rounded-lg border border-line bg-mist/40 p-6">
                <div className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-signal" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-ink">
                    Deterministic Decimal Arithmetic & No Exercise Eat-Back
                  </h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Standard IEEE-754 floating-point numbers accumulate rounding artifacts that corrupt calorie and macronutrient sums over time:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-graphite">
                  <li>
                    <strong className="text-ink">End-to-End Decimal Types:</strong> All continuous quantities (calories, protein, carbs, fats, body mass)
                    parse through Python&rsquo;s <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">Decimal</code> module and persist into
                    PostgreSQL <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">numeric(6,3)</code> columns. Deterministic Decimal arithmetic eliminates floating-point rounding drift.
                  </li>
                  <li>
                    <strong className="text-ink">Strict Anti-Eat-Back Doctrine:</strong> Workouts observed via HealthKit or Hevy provide timing context
                    (e.g., qualifying a dated lunch slot as a <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">post_workout_lunch</code> with 40% daily calorie allocation).
                    Workouts <em>never</em> add extra calories to the daily target. This protects lean-bulk goals from exercise overcompensation.
                  </li>
                </ul>
              </div>

              {/* Challenge 4 */}
              <div className="rounded-lg border border-line bg-mist/40 p-6">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-signal" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-ink">
                    28-Day Theil–Sen Body-Mass Evidence Window & Target Reviews
                  </h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Instead of automatic recalibration that alters meal sizes without warning, Nytr runs an on-demand 28-day body-mass evidence window using robust Theil–Sen slope estimation:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-graphite">
                  <li>
                    The median-of-slopes Theil–Sen estimator calculates an outlier-resistant rate of change (kg/week) over a 28-day rolling window, remaining resilient against single-day hydration fluctuations.
                  </li>
                  <li>
                    If the trend indicates a persistent rate outside target boundaries, the backend formulates a bounded review proposal (strictly limited to &plusmn;100 kcal).
                  </li>
                  <li>
                    The review is purely advisory. The proposal can only become active policy when the authenticated user explicitly approves it on iOS,
                    which atomically writes a new versioned target policy row and a mandatory decision-log rationale.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5: Verification & Production Discipline */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">5. Verification & Production Discipline</h2>
            <p>
              Because Nytr is trusted with personal health and nutrition in production, it is backed by a rigorous test and verification suite:
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-line bg-paper p-5">
                <p className="font-mono text-2xl font-bold text-ink">1,041</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-graphite">Backend Tests</p>
                <p className="mt-2 text-xs text-graphite">
                  Pytest suite covering domain algorithms, candidate scoring, date windows, idempotency, and PostgreSQL RLS integration.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-paper p-5">
                <p className="font-mono text-2xl font-bold text-ink">Dual Anchors</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-graphite">Sync Engine</p>
                <p className="mt-2 text-xs text-graphite">
                  Durable keychain anchors and tombstone semantics guaranteeing idempotent mobile telemetry synchronization.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-paper p-5">
                <p className="font-mono text-2xl font-bold text-ink">Hardware</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-graphite">Physical Validation</p>
                <p className="mt-2 text-xs text-graphite">
                  Physical-device validated with real iPhone hardware, authentic Apple HealthKit permissions, and Stacks Market food offerings.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Key Lessons */}
          <section className="space-y-4 border-t border-line pt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">6. Engineering Lessons</h2>
            <div className="space-y-3 text-sm text-graphite">
              <p>
                <strong className="text-ink">1. First-principles modeling beats LLM wrappers:</strong> Generating meal plans with
                generative AI sounds modern, but large language models struggle with integer programming, fail exact dietary exclusions,
                and hallucinate nutritional facts. A deterministic scoring engine running over verified, versioned database rows is fast,
                explainable, and eliminates entire classes of LLM hallucination and constraint violation.
              </p>
              <p>
                <strong className="text-ink">2. Treat data provenance as a tier-1 property:</strong> In production systems, knowing
                <em>where</em> a datum originated (e.g. verified Stacks label vs user estimated portion vs HealthKit sensor) is just as critical
                as the value itself.
              </p>
              <p>
                <strong className="text-ink">3. Immutability creates tranquility:</strong> By enforcing immutable insert-only records
                and explicit tombstone transitions at the database level, race conditions, mutation bugs, and accidental historical overwrites are systematically prevented.
              </p>
            </div>
          </section>
        </article>
      </Container>
    </div>
  );
}
