export interface Project {
  slug: string;
  title: string;
  oneLiner: string;
  description?: string;
  role?: string;
  tech?: string[];
  links?: { label: string; url: string }[];
  featured?: boolean;
  metrics?: { label: string; value: string }[];
  status?: "shipped" | "in-progress" | "competition-private";
}

export interface EducationEntry {
  school: string;
  degree: string;
  honorsCollege?: string;
  cgpa?: string;
  graduation?: string;
  notes?: string;
  extracurriculars?: string[];
}

export interface ExperienceEntry {
  role: string;
  company: string;
  location?: string;
  start?: string;
  end?: string;
  points?: string[];
}

export interface Achievement {
  label: string;
  detail?: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface Book {
  title: string;
  status: "reading" | "read" | "owned";
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
}

export interface Contact {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  resumeUrl: string;
  location: string;
}
