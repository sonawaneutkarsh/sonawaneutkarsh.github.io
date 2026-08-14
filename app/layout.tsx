import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GitBranch } from "lucide-react";
import { contact } from "@/data/contact";
import { ModeProvider } from "@/components/mode-provider";
import { Nav } from "@/components/nav";
import { ScrollThread } from "@/components/scroll-thread";
import { Container } from "@/components/container";
import "./globals.css";

// TODO: favicon is a generated placeholder (solid ink rounded square) — replace with a real one.
export const metadata: Metadata = {
  title: contact.name ? `${contact.name} — Software Engineer` : "Portfolio",
  description: "Software engineer. In progress, on purpose.",
  openGraph: {
    title: contact.name ? `${contact.name} — Software Engineer` : "Portfolio",
    description: "Software engineer. In progress, on purpose.",
    type: "website",
    siteName: contact.name || "Portfolio",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ModeProvider>
          <ScrollThread />
          <Nav />
          <main>{children}</main>
          <footer className="border-t border-line">
            <Container className="flex h-16 items-center justify-between">
              <p className="text-sm text-graphite">
                © {new Date().getFullYear()} {contact.name || "Portfolio"}
              </p>
              <a
                href={`https://github.com/${contact.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-signal transition-colors hover:text-signal-700"
              >
                <GitBranch className="h-4 w-4" aria-hidden="true" />
                GitHub
              </a>
            </Container>
          </footer>
        </ModeProvider>
      </body>
    </html>
  );
}
