import type { SkillGroup } from "./types";

export const skillGroups: SkillGroup[] = [
  {
    category: "Languages",
    items: ["Python", "JavaScript", "SQL", "C++"],
  },
  {
    category: "AI / ML",
    items: [
      "RAG",
      "Embeddings",
      "pgvector",
      "Sentence Transformers",
      "AI agents",
      "Semantic retrieval",
      "NEAT",
      "Evolutionary algorithms",
    ],
  },
  {
    category: "Backend / Infrastructure",
    items: ["FastAPI", "PostgreSQL", "Supabase", "SQLAlchemy", "Selenium", "Gemini API", "Data pipelines"],
  },
  {
    category: "Frontend & Mobile",
    items: ["TypeScript", "React", "Next.js", "React Native", "Expo", "Express", "Flask", "Firebase"],
  },
  {
    category: "Embedded",
    items: ["ESP32", "Arduino"],
  },
  {
    category: "Tools",
    items: ["Git / GitHub", "Linux / Terminal"],
  },
];
