import type { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "clage",
    title: "Clage",
    oneLiner: "A from-scratch NEAT implementation and 2D artificial-life simulation",
    description:
      "Custom NEAT (NeuroEvolution of Augmenting Topologies) implementation built without neat-python — genome representation, phenotype/network construction, an innovation ledger, mutation, crossover, speciation, and full population lifecycle. Runs inside a 2D artificial-life environment with organisms, food, energy, and reproduction, plus controlled experiments and behavioral diversity metrics.",
    role: "Solo, built from scratch",
    tech: ["Python", "NEAT", "Evolutionary algorithms"],
    featured: true,
    metrics: [
      { label: "Tests", value: "184" },
      { label: "Benchmarks", value: "OR / AND / XOR / sin" },
      { label: "Seeds", value: "Multi-seed validated" },
    ],
    status: "in-progress",
    links: [{ label: "Repository", url: "https://github.com/sonawaneutkarsh/Clage" }],
  },
  {
    slug: "scholarai",
    title: "ScholarAI",
    oneLiner: "AI platform for discovering eligible Indian government schemes across 1,000+ programs",
    description:
      "Built for the USAII Global AI Hackathon (6,081 participants worldwide, 5-person team) — finalist. Covers data scraping/normalization, weighted eligibility logic, RAG over embeddings in pgvector, AI-generated reports, and what-if simulations.",
    role: "Data engineer — owned the data pipeline and vector database/retrieval layer",
    metrics: [
      { label: "Result", value: "Hackathon finalist" },
      { label: "Schemes covered", value: "1,000+" },
    ],
    tech: ["RAG", "pgvector", "PostgreSQL", "Supabase", "FastAPI", "SQLAlchemy", "Selenium"],
    status: "shipped",
    links: [
      { label: "Repository", url: "https://github.com/faridabachir769-code/USAII_GlobalAI-Hackathon-2026_ScholarAI" },
    ],
  },
  {
    slug: "medclarity",
    title: "MedClarity",
    oneLiner: "AI assistant that analyzes and cross-references medical documents",
    description:
      "Processes multiple medical documents, compares them, identifies discrepancies, answers questions, and provides page-level citations. Features reading-level toggles, source coverage badges, persistent chat history, voice input, and PDF export.",
    tech: ["React", "Express", "Gemini API"],
    status: "shipped",
    links: [
      { label: "Repository", url: "https://github.com/sonawaneutkarsh/MedClarity" },
      { label: "Live Demo", url: "https://medclarity-one.vercel.app" },
    ],
  },
  {
    slug: "esp32-plant-monitor",
    title: "ESP32 Plant Monitor",
    oneLiner: "Embedded soil-moisture monitor with email alerts",
    description: "Capacitive soil sensor with calibrated ADC readings and averaging, connected over Wi-Fi with SMTP/Gmail notifications.",
    tech: ["ESP32-C3", "C++", "Arduino"],
    status: "shipped",
    links: [
      { label: "Repository", url: "https://github.com/sonawaneutkarsh/esp32-soil-moisture-monitor" },
    ],
  },
  {
    slug: "devvy",
    title: "Devvy",
    oneLiner: "A local Discord Rich Presence bridge for OpenCode, Command Code, and VS Code",
    description:
      "Devvy publishes local coding activity from OpenCode, Command Code, and VS Code to Discord Rich Presence through a single local daemon.\n\nOpenCode ──────┐\nVS Code ───────┤ → local HTTP daemon → Discord IPC → Discord\nCommand Code ──┘\n\nThe daemon is the only Discord IPC/RPC owner. Publishers communicate only with the local daemon over HTTP. No cloud service is required.\n\nThe system publishes safe activity metadata such as: project basename, file basename, language, git branch, model identifier, and activity label.\n\nIt does NOT send: source code, prompts, credentials, API keys, file contents, or absolute paths.\n\nComponents: Node daemon with HTTP API and Discord IPC client, VS Code extension, OpenCode integration, Command Code integration, and LaunchAgent integration for macOS.\n\nPriority system: OpenCode actively working → Command Code actively working → VS Code available → idle / clear. Each source uses heartbeats with expiration/TTL handling, and the daemon clears Discord presence when all sources disappear.\n\nTesting includes: daemon end-to-end tests, fallback tests, reconnect tests, VS Code behavior tests, Command Code integration tests, OpenCode plugin tests, multi-session tests, race-condition tests, privacy/leak tests, and asset tests.\n\nRequirements: macOS, Node.js, Discord desktop app, Discord Developer Portal application.",
    tech: ["Node.js", "JavaScript", "TypeScript", "Shell", "Discord IPC"],
    status: "shipped",
    links: [{ label: "Repository", url: "https://github.com/sonawaneutkarsh/devvy" }],
  },
];
