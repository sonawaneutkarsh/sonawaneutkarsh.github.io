import type { SkillGroup } from "./types";

export const skillGroups: SkillGroup[] = [
  {
    category: "Languages",
    items: ["Python (strongest)", "JavaScript", "SQL", "C++"],
  },
  {
    category: "AI/ML",
    items: ["RAG", "embeddings", "pgvector", "sentence transformers", "AI agents", "semantic retrieval"],
  },
  {
    category: "Backend/Infra",
    items: ["FastAPI", "PostgreSQL", "Supabase", "data pipelines"],
  },
  {
    category: "Tools",
    items: ["Git/GitHub", "Linux/Terminal"],
  },
];
