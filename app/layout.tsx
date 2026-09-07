import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GitBranch, FileText } from "lucide-react";
import { contact } from "@/data/contact";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Container } from "@/components/container";
import "./globals.css";

export const metadata: Metadata = {
  title: "Utkarsh Sonawane — Systems, Algorithms & Infrastructure",
  description:
    "Undergraduate Computer Science honors student at Penn State. Building systems from first principles — backend infrastructure, algorithms, and grounded AI where decisions can be traced back to evidence.",
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
    title: "Utkarsh Sonawane — Systems, Algorithms & Infrastructure",
    description:
      "Undergraduate Computer Science honors student at Penn State. Building systems from first principles — backend infrastructure, algorithms, and grounded AI.",
    url: "https://sonawaneutkarsh.github.io",
    type: "website",
    siteName: "Utkarsh Sonawane",
  },
  twitter: {
    card: "summary",
    title: "Utkarsh Sonawane — Systems, Algorithms & Infrastructure",
    description:
      "Undergraduate Computer Science honors student at Penn State. Building systems from first principles — backend infrastructure, algorithms, and grounded AI.",
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
                  <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
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
