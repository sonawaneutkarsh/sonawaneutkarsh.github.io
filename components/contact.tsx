import { Briefcase, FileText, GitBranch, Mail, Phone } from "lucide-react";
import { contact } from "@/data/contact";
import { Container } from "@/components/container";

const fields = [
  { key: "email", icon: Mail, label: "Email", href: contact.email ? `mailto:${contact.email}` : "" },
  { key: "phone", icon: Phone, label: "Phone", href: contact.phone ? `tel:${contact.phone}` : "" },
  { key: "linkedin", icon: Briefcase, label: "LinkedIn", href: contact.linkedin },
  { key: "github", icon: GitBranch, label: "GitHub", href: `https://github.com/${contact.github}` },
  { key: "resume", icon: FileText, label: "Resume", href: contact.resumeUrl },
];

export function Contact() {
  const links = fields.filter((field) => field.href);

  return (
    <section className="border-t border-line">
      <Container className="py-20 sm:py-24">
        <h2 className="eyebrow">Contact</h2>
        {/* TODO: email, phone, LinkedIn, and resume in data/contact.ts are still empty —
            only GitHub renders until they are filled in. */}
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
          {links.map(({ key, icon: Icon, label, href }) => {
            const isExternal = href.startsWith("http");
            return (
              <a
                key={key}
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="flex items-center gap-2 text-signal transition-colors hover:text-signal-700"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </a>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
