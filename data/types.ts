export interface Project {
  slug: string;
  title: string;
  oneLiner: string;
  description?: string;
  role?: string;
  tech?: string[];
  links?: { label: string; url: string; isCaseStudy?: boolean }[];
  featured?: boolean;
  metrics?: { label: string; value: string }[];
  status?: "shipped" | "in-progress" | "competition-private";
  hasCaseStudy?: boolean;
}

export interface EducationEntry {
  school: string;
  degree: string;
  gpa?: string;
  graduation?: string;
  honors?: string[];
  relevantCourses?: string[];
}

export interface Achievement {
  label: string;
  detail?: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
}

export interface Contact {
  name: string;
  title: string;
  email: string;
  phone?: string;
  linkedin: string;
  github: string;
  resumeUrl: string;
  discord?: string;
  location: string;
}
