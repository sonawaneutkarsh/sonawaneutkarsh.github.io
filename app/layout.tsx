import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { FileText } from "lucide-react";
import { contact } from "@/data/contact";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Container } from "@/components/container";
import "./globals.css";

export const metadata: Metadata = {
  title: "Utkarsh Sonawane — Honors Computer Science at Penn State",
  description:
    "Honors Computer Science student at Penn State building software I actually use every day. Interested in LLMs, agentic systems, and backend infrastructure.",
  metadataBase: new URL("https://sonawaneutkarsh.github.io"),
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: "Utkarsh Sonawane — Honors Computer Science at Penn State",
    description:
      "Honors Computer Science student at Penn State building software I actually use every day. Interested in LLMs, agentic systems, and backend infrastructure.",
    url: "https://sonawaneutkarsh.github.io",
    type: "website",
    siteName: "Utkarsh Sonawane",
  },
  twitter: {
    card: "summary",
    title: "Utkarsh Sonawane — Honors Computer Science at Penn State",
    description:
      "Honors Computer Science student at Penn State building software I actually use every day. Interested in LLMs, agentic systems, and backend infrastructure.",
  },
};

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
        <noscript>
          <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1 !important;transform:none !important;}`}</style>
        </noscript>
        <ThemeProvider>
          <Nav />
          <main>{children}</main>
          <footer className="border-t border-line mt-16">
            <Container className="flex flex-col sm:flex-row h-auto sm:h-16 py-6 sm:py-0 items-center justify-between gap-4">
              <p className="text-sm text-graphite">
                © {new Date().getFullYear()} {contact.name}.
              </p>
              <div className="flex items-center gap-6 text-sm text-graphite">
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-ink"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  Résumé
                </a>
                <a
                  href={`https://github.com/${contact.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-ink"
                >
                  <svg
                    className="h-3.5 w-3.5 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  GitHub
                </a>
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-ink"
                >
                  LinkedIn
                </a>
              </div>
            </Container>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
