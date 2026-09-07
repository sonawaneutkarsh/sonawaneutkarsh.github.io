import type { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "nytr",
    title: "Nytr",
    oneLiner: "An evidence-driven personal nutrition and training decision platform integrating campus dining, HealthKit, and Hevy",
    description:
      "A production-tested personal decision system built on a FastAPI modular monolith, PostgreSQL/Supabase, and a native SwiftUI/HealthKit iOS companion. Separates authoritative source data, deterministic computation, and user-approved policy changes through strict source authority, immutable versioned evidence, replay-safe mobile sync, PostgreSQL RLS, and deterministic Decimal calculations.",
    role: "Solo Creator · Systems Architecture, Backend, Database & Native iOS",
    tech: ["Python", "FastAPI", "PostgreSQL", "Supabase", "SwiftUI", "HealthKit", "Hevy API", "Docker", "Pytest"],
    featured: true,
    hasCaseStudy: true,
    metrics: [
      { label: "Core Philosophy", value: "DATA → CALCULATION → DECISION" },
      { label: "Backend Tests", value: "1,041 automated tests" },
      { label: "Sync Engine", value: "Dual-anchor idempotent sync" },
      { label: "Precision", value: "Deterministic Decimal arithmetic" },
    ],
    status: "shipped",
    links: [
      { label: "Technical Case Study", url: "/projects/nytr", isCaseStudy: true },
    ],
  },
  {
    slug: "clage",
    title: "Clage",
    oneLiner: "From-scratch NEAT neuroevolution implementation and 2D artificial-life simulation",
    description:
      "Complete NeuroEvolution of Augmenting Topologies (NEAT) implemented from first principles in pure Python without neat-python or external ML libraries. Features a global innovation ledger, topological crossover, structural mutation, speciation, and directed graph feed-forward network execution. Evaluated on classic benchmarks (OR, AND, XOR, sine) across fixed seeds and deployed in an energy-constrained 2D artificial life world.",
    role: "Solo Creator · Evolutionary Algorithms, Simulation & Analytics",
    tech: ["Python", "Algorithms from Scratch", "Complex Systems", "Simulation", "Pytest"],
    featured: true,
    hasCaseStudy: true,
    metrics: [
      { label: "Passing Tests", value: "188 passing tests" },
      { label: "Dependencies", value: "Zero ML packages (pure Python)" },
      { label: "Validation", value: "Multi-seed on OR / AND / XOR / Sin" },
    ],
    status: "shipped",
    links: [
      { label: "Technical Case Study", url: "/projects/clage", isCaseStudy: true },
      { label: "Repository", url: "https://github.com/sonawaneutkarsh/Clage" },
    ],
  },
  {
    slug: "devvy",
    title: "Devvy",
    oneLiner: "Zero-dependency local daemon coordinating Discord Rich Presence across developer environments",
    description:
      "Local background infrastructure that speaks Discord's local IPC protocol directly over Unix domain sockets with custom binary opcode framing, handshake negotiation, and backoff reconnects. Unifies activity status across OpenCode, Command Code, and VS Code with priority arbitration, heartbeats, and TTL-based source expiry.",
    role: "Solo Creator · Systems Programming, IPC & Devtools",
    tech: ["TypeScript", "Node.js", "Discord IPC", "macOS launchd", "Unix Sockets"],
    featured: false,
    metrics: [
      { label: "Runtime Deps", value: "Zero external dependencies" },
      { label: "Protocol", value: "Direct IPC binary opcode framing" },
      { label: "Validation", value: "22-scenario automated suite" },
    ],
    status: "shipped",
    links: [{ label: "Repository", url: "https://github.com/sonawaneutkarsh/devvy" }],
  },
  {
    slug: "scholarai",
    title: "ScholarAI",
    oneLiner: "AI platform for discovering and verifying Indian government schemes across 1,000+ programs",
    description:
      "Built for the USAII Global AI Hackathon 2026 (6,081+ participants worldwide, 5-person team) — Finalist. As the Data Engineer, I built the complete data engineering pipeline: scraped and normalized 1,000+ complex schemes via regex-based extraction into structured relational models, generated high-dimensional semantic embeddings, and built batched loaders into PostgreSQL with pgvector for hybrid retrieval.",
    role: "Data Engineer · Data Pipeline, Relational Schema & Vector Database",
    tech: ["Python", "PostgreSQL", "pgvector", "FastAPI", "Selenium", "RAG"],
    featured: false,
    metrics: [
      { label: "Hackathon Result", value: "Finalist (6,081+ participants)" },
      { label: "Data Volume", value: "1,000+ schemes indexed" },
      { label: "Engineering Team", value: "5-person team" },
    ],
    status: "shipped",
    links: [
      { label: "Repository", url: "https://github.com/faridabachir769-code/USAII_GlobalAI-Hackathon-2026_ScholarAI" },
    ],
  },
  {
    slug: "medclarity",
    title: "MedClarity",
    oneLiner: "Client-side audited medical document intelligence with page-level ground truth",
    description:
      "Schema-enforced Gemini pipeline comparing cross-document medical reports, identifying contradictions, unit mismatches, and temporal trends. Client-side PDF extraction guarantees that only relevant clinical text reaches the model, paired with page-level clickable citations.",
    tech: ["React", "TypeScript", "Express", "Gemini API"],
    status: "shipped",
    links: [
      { label: "Repository", url: "https://github.com/sonawaneutkarsh/MedClarity" },
      { label: "Live Demo", url: "https://medclarity-one.vercel.app" },
    ],
  },
  {
    slug: "esp32-plant-monitor",
    title: "ESP32 Soil Moisture Monitor",
    oneLiner: "Embedded capacitive soil-moisture sensor with Wi-Fi alert daemon",
    description:
      "Low-power embedded telemetry system using an ESP32-C3 microcontroller, calibrated capacitive soil sensing, running window ADC noise filtering, and automated SMTP/Gmail alert dispatching.",
    tech: ["ESP32-C3", "C++", "Arduino", "Embedded Systems"],
    status: "shipped",
    links: [
      { label: "Repository", url: "https://github.com/sonawaneutkarsh/esp32-soil-moisture-monitor" },
    ],
  },
];
