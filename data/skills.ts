import type { SkillGroup } from "./types";

export const skillGroups: SkillGroup[] = [
  {
    category: "Languages",
    items: ["Python", "TypeScript", "JavaScript", "C++", "Swift", "SQL"],
  },
  {
    category: "Backend & Systems",
    items: ["FastAPI", "Node.js", "Express", "Flask", "REST APIs", "Docker", "Linux", "Git"],
  },
  {
    category: "Data & Databases",
    items: ["PostgreSQL", "Supabase", "pgvector", "Vector Embeddings", "RAG", "NumPy", "Pandas"],
  },
  {
    category: "Mobile & Frontend",
    items: ["SwiftUI", "HealthKit", "React", "Next.js", "Tailwind CSS"],
  },
  {
    category: "Embedded & Hardware",
    items: ["ESP32-C3", "Arduino", "Sensor Telemetry"],
  },
];
