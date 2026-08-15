import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GitBranch } from "lucide-react";
import { contact } from "@/data/contact";
import { education } from "@/data/education";
import { ModeProvider } from "@/components/mode-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { ScrollThread } from "@/components/scroll-thread";
import { Container } from "@/components/container";
import "./globals.css";

const credentialParts = [
  education[0].degree ? `${education[0].degree} — ${education[0].school}` : education[0].school,
  education[0].gpa ? `GPA: ${education[0].gpa}` : null,
  education[0].graduation ? `Expected graduation: ${education[0].graduation}` : null,
].filter(Boolean);

const credentialsLine = credentialParts.join(" · ");

export const metadata: Metadata = {
  title: contact.name || "Software Engineer",
  description: contact.name ? `${contact.name} — ${credentialsLine}` : "Software engineer portfolio.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: contact.name || "Software Engineer",
    description: contact.name ? `${contact.name} — ${credentialsLine}` : "Software engineer portfolio.",
    type: "website",
    siteName: contact.name || "Software Engineer",
  },
};

// Runs before first paint so the correct theme is applied with no flash.
const themeInitScript = `(function(){try{var t=localStorage.getItem("portfolio-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var c=d?"dark":"light";document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=c;}catch(e){}})();`;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0C0E" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
