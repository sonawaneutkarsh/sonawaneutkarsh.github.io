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
  },
  {
    slug: "scholarai",
    title: "ScholarAI",
    oneLiner: "AI platform for discovering eligible Indian government schemes across 4,700+ programs",
    description:
      "Built for the USAII Global AI Hackathon (6,081 participants worldwide, 5-person team) — finalist. Covers data scraping/normalization, weighted eligibility logic, RAG over embeddings in pgvector, AI-generated reports, and what-if simulations.",
    role: "Data engineer — owned the data pipeline and vector database/retrieval layer",
    metrics: [
      { label: "Result", value: "Hackathon finalist" },
      { label: "Schemes covered", value: "4,700+" },
    ],
    tech: ["RAG", "pgvector", "PostgreSQL", "Supabase", "FastAPI", "SQLAlchemy", "Selenium"],
    status: "shipped",
  },
  {
    slug: "medclarity",
    title: "MedClarity",
    oneLiner: "AI assistant that analyzes and cross-references medical documents",
    description:
      "Processes multiple medical documents, compares them, identifies discrepancies, answers questions, and provides page-level citations. Features reading-level toggles, source coverage badges, persistent chat history, voice input, and PDF export.",
    tech: ["React", "Express", "Gemini API"],
    status: "shipped",
  },
  {
    slug: "zorabihealth",
    title: "ZorabiHealth",
    oneLiner: "Full-stack healthcare platform with offline-first sync",
    description: "Real-time synchronization, offline-first architecture, notifications, and AI voice workflows.",
    tech: ["Next.js", "TypeScript", "React Native", "Expo", "Supabase", "PostgreSQL"],
    status: "shipped",
  },
  {
    slug: "esp32-plant-monitor",
    title: "ESP32 Plant Monitor",
    oneLiner: "Embedded soil-moisture monitor with email alerts",
    description: "Capacitive soil sensor with calibrated ADC readings and averaging, connected over Wi-Fi with SMTP/Gmail notifications.",
    tech: ["ESP32-C3", "C++", "Arduino"],
    status: "shipped",
  },
  {
    slug: "twenty-questions",
    title: "20 Questions",
    oneLiner: "Real-time multiplayer 20 Questions game",
    tech: ["Flask", "Python", "JavaScript", "Firebase"],
    status: "shipped",
  },
  {
    slug: "hatchling",
    title: "Hatchling",
    oneLiner: "Competition submission — details available on request",
    status: "competition-private",
  },
  {
    slug: "voyager-9",
    title: "VOYAGER-9",
    oneLiner: "Competition submission — details available on request",
    status: "competition-private",
  },
  {
    // TODO: fill in when the user provides details
    slug: "roomatino",
    title: "Roomatino",
    oneLiner: "",
    tech: [],
  },
  {
    // TODO: fill in when the user provides details
    slug: "glimpse-newsletter",
    title: "Glimpse Newsletter",
    oneLiner: "",
    tech: [],
  },
  {
    // TODO: fill in when the user provides details
    slug: "stick-films-animation",
    title: "Stick Films Animation",
    oneLiner: "",
    tech: [],
  },
];
