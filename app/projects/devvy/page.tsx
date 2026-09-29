import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Layers, Cpu } from "lucide-react";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "Devvy Technical Case Study — Utkarsh Sonawane",
  description:
    "Technical case study for Devvy: a zero-dependency local daemon arbitrating Discord Rich Presence across VS Code, OpenCode, and Command Code via direct Unix domain socket IPC and binary opcode framing.",
};

export default function DevvyCaseStudy() {
  return (
    <div className="min-h-screen py-12 sm:py-16">
      <Container className="max-w-4xl">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 text-sm text-graphite transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Selected Work
          </Link>
        </div>

        {/* Header */}
        <header className="border-b border-line pb-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-line bg-mist px-2.5 py-1 font-mono text-xs font-medium text-graphite uppercase tracking-wider">
              Systems Programming
            </span>
            <span className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-xs text-graphite">
              Zero-Dependency IPC & Devtools
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Devvy: Multi-Environment Discord Presence & Local IPC Daemon
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-graphite sm:text-xl">
            Modern software engineering blends traditional text editors with autonomous agentic tools.
            When running VS Code, OpenCode, and Command Code side by side, having multiple uncoordinated integrations
            compete for Discord&rsquo;s local presence pipe causes status flip-flopping and inconsistent activity states.
            I engineered Devvy around three core design motivations: avoiding unnecessary dependency overhead,
            preventing multiple local integrations from competing for presence state, and deliberately limiting exposed context.
            Devvy operates as a zero-dependency background daemon that speaks Discord&rsquo;s binary IPC protocol
            directly over Unix domain sockets and Windows named pipes, arbitrating active developer environments with deterministic priority rules.
          </p>

          {/* Action Links */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/sonawaneutkarsh/devvy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-mist px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              View Repository on GitHub
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 gap-4 rounded-lg border border-line bg-mist/50 p-4 sm:grid-cols-4">
            <div>
              <p className="eyebrow">Runtime Dependencies</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">Zero (Pure Node.js)</p>
            </div>
            <div>
              <p className="eyebrow">Protocol Engine</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">Direct Binary IPC</p>
            </div>
            <div>
              <p className="eyebrow">Validation Suite</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">22 Automated Scenarios</p>
            </div>
            <div>
              <p className="eyebrow">Service Supervision</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">launchd & Windows</p>
            </div>
          </div>
        </header>

        {/* Visual Highlights */}
        <section className="mt-10 border-b border-line pb-12" aria-labelledby="devvy-visuals-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="devvy-visuals-heading" className="eyebrow">
              Live Presence Output
            </h2>
            <span className="font-mono text-xs text-graphite">Discord Rich Presence (V4 Activity)</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-paper p-6 sm:p-8">
            <div className="mx-auto max-w-xl overflow-hidden rounded-lg border border-line/60 bg-[#1e1f22] p-2 shadow-sm">
              <Image
                src="/images/projects/devvy/discord-presence.png"
                alt="Devvy Discord Rich Presence preview showing project name, activity mode Thinking, and detected AI model GPT 5.6"
                width={878}
                height={320}
                className="h-auto w-full rounded object-contain"
              />
            </div>
            <p className="mt-4 text-center text-xs text-graphite sm:text-sm">
              Real Discord V4 presence: Project name, high-level activity mode (<code className="font-mono text-xs">Thinking</code>), and detected model (<code className="font-mono text-xs">GPT 5.6</code>) with deliberate context limitation (no file paths or raw prompts).
            </p>
          </div>
        </section>

        {/* Main Content */}
        <article className="mt-12 space-y-16 text-base leading-relaxed">
          {/* Section 1: Design Motivations */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">1. Design Motivations & Problem Space</h2>
            <p>
              Displaying editor status in Discord should be a straightforward background utility. However, running
              multiple developer tools simultaneously (such as a GUI editor alongside terminal coding agents) creates
              clear architectural trade-offs that shaped Devvy&rsquo;s design:
            </p>
            <ul className="list-disc space-y-2.5 pl-5 text-sm text-graphite">
              <li>
                <strong className="text-ink">Preventing Multiple Local Integrations from Competing for Presence State:</strong> When developers run
                VS Code alongside autonomous agents like OpenCode or Command Code, having separate tools connect independently
                to Discord&rsquo;s local pipe leads to presence fighting and rapid status changes. Devvy introduces a centralized
                local daemon that arbitrates priority so only the most relevant active context updates Discord.
              </li>
              <li>
                <strong className="text-ink">Avoiding Unnecessary Dependency Overhead:</strong> Establishing a local Unix domain socket connection
                and sending periodic JSON payloads does not require large third-party client libraries, native compiled binaries, or dozens of transitive
                dependencies. Devvy implements the protocol directly using Node.js built-in modules (<code className="font-mono text-xs">node:net</code>, <code className="font-mono text-xs">node:buffer</code>)
                with <strong>zero external runtime dependencies</strong>.
              </li>
              <li>
                <strong className="text-ink">Deliberately Limiting Exposed Context:</strong> Detailed file paths, full repository branches,
                or sensitive agent prompts should never be broadcast over a public presence payload. Devvy intentionally restricts presence
                to high-level metadata: project name, coarse activity mode (<code className="font-mono text-xs">Thinking</code>, <code className="font-mono text-xs">Editing</code>),
                and normalized model family names.
              </li>
            </ul>
            <p>
              By decoupling editor telemetry from the Discord connection, Devvy centralizes multi-editor workflows into a single predictable, lightweight service.
            </p>
          </section>

          {/* Section 2: Architecture */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">2. Architecture & Control Topology</h2>
            <p>
              Rather than having IDE plugins talk to Discord directly, Devvy introduces a local hub-and-spoke model.
              Integrations publish lightweight, structured state updates over a loopback HTTP interface, while the daemon alone
              arbitrates active work and owns the single connection to Discord:
            </p>

            {/* Architecture Visual Diagram */}
            <div className="rounded-lg border border-line bg-paper p-6 font-mono text-xs leading-relaxed overflow-x-auto">
              <pre className="text-ink overflow-x-auto">
{`┌───────────────────────┐
│        VS Code        │──┐
│   (extension.js)      │  │
└───────────────────────┘  │
                           │
┌───────────────────────┐  │ PUT /state (127.0.0.1:17377)
│       OpenCode        │──┼────────────────────────────────┐
│ (discord-presence.ts) │  │ Safe structured JSON payloads  │
└───────────────────────┘  │ (Project, High-Level State,    │
                           │  Sanitized Model, Heartbeat)   │
┌───────────────────────┐  │                                │
│     Command Code      │──┘                                │
│ (discord-presence.ts) │                                   │
└───────────────────────┘                                   │
                                                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Local Devvy Daemon                              │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   Loopback HTTP API   │  │         Priority Arbitration          │  │
│  │  • 127.0.0.1:17377    │  │  • Precedence: OpenCode > Command Code│  │
│  │  • Healthcheck /health│  │    > VS Code                          │  │
│  │  • Max payload 64 KB  │  │  • Intra-kind: Active > Inactive      │  │
│  │  • EADDRINUSE exit 0  │  │  • Window focus & transition recency  │  │
│  └──────────┬────────────┘  └───────────────────┬───────────────────┘  │
│             │                                   │                      │
│             ▼                                   ▼                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Anti-Churn Flush Engine                       │  │
│  │  • Critical Anti-Flip-Flop Rule: heartbeats preserve TTL only    │  │
│  │  • 2,000ms minimum IPC rate-limit gate (MIN_IPC_INTERVAL_MS)     │  │
│  │  • Source expiry sweeper: 15s TTL sweeps stale crashed tools     │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │
│                                     ▼
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Direct Discord IPC Engine                     │  │
│  │  • Custom 8-byte binary opcode framing (readUInt32LE/writeUInt32)│  │
│  │  • Handshake negotiation (OP 0) & V4 Activity dispatch (OP 1)    │  │
│  │  • Exponential backoff reconnects (1,000ms → 30,000ms)           │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ Unix Domain Socket: /tmp/discord-ipc-0...9
                                      │ Windows Named Pipe: \\\\?\\pipe\\discord-ipc-0...9
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Discord Client (Desktop)                          │
│  • Single stable Rich Presence activity broadcast to friends & servers │
└────────────────────────────────────────────────────────────────────────┘`}
              </pre>
            </div>
          </section>

          {/* Section 3: Binary IPC Framing */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">3. Direct Discord IPC: Binary Opcode Framing from Scratch</h2>
            <p>
              Instead of bundling third-party RPC libraries, Devvy implements Discord&rsquo;s local IPC protocol directly
              using Node&rsquo;s built-in <code className="font-mono text-xs">node:net</code> and <code className="font-mono text-xs">node:buffer</code> modules.
              Discord exposes local IPC on desktop operating systems via Unix domain sockets (<code className="font-mono text-xs">discord-ipc-0</code> through <code className="font-mono text-xs">discord-ipc-9</code> in <code className="font-mono text-xs">/tmp</code> or <code className="font-mono text-xs">XDG_RUNTIME_DIR</code>) or Windows named pipes.
            </p>
            <p>
              Communication requires strict binary framing. Every packet sent and received over the socket begins with an
              <strong>8-byte header</strong>:
            </p>

            <div className="rounded-lg border border-line bg-paper p-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4 border-b border-line pb-2 font-semibold text-ink sm:grid-cols-4">
                <span>Bytes 0–3</span>
                <span>Opcode (UInt32LE)</span>
                <span>Bytes 4–7</span>
                <span>Payload Length (UInt32LE)</span>
              </div>
              <div className="pt-2 text-graphite">
                Followed immediately by <code className="text-ink">Length</code> bytes of JSON payload.
              </div>
            </div>

            <p className="text-sm text-graphite">
              The daemon implements the complete lifecycle protocol:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-graphite">
              <li><code className="font-mono text-xs font-semibold text-ink">OP 0 (HANDSHAKE):</code> Sent immediately upon socket connection with <code className="font-mono text-xs">&#123; v: 1, client_id &#125;</code>.</li>
              <li><code className="font-mono text-xs font-semibold text-ink">OP 1 (FRAME):</code> Dispatches commands such as <code className="font-mono text-xs">SET_ACTIVITY</code> and parses Discord events (<code className="font-mono text-xs">READY</code>).</li>
              <li><code className="font-mono text-xs font-semibold text-ink">OP 2 (CLOSE):</code> Gracefully terminates sessions when Discord exits.</li>
              <li><code className="font-mono text-xs font-semibold text-ink">OP 3 / 4 (PING / PONG):</code> Emits responsive heartbeat replies.</li>
              <li><code className="font-mono text-xs font-semibold text-ink">Stream Chunk Accumulation:</code> Accumulates incoming network chunks into an internal buffer, reads complete packets via <code className="font-mono text-xs">readUInt32LE</code>, and handles partial frames cleanly.</li>
              <li><code className="font-mono text-xs font-semibold text-ink">Exponential Backoff Reconnect:</code> If Discord closes or restarts, reconnect attempts back off progressively from 1,000ms up to 30,000ms to eliminate CPU spin.</li>
            </ul>
          </section>

          {/* Section 4: Priority Arbitration */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">4. Multi-Source Priority & The Anti-Flip-Flop Rule</h2>
            <p>
              When multiple developer environments run concurrently, which one should Discord display?
              Devvy solves this through a two-stage deterministic arbitration engine:
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Cross-Kind Precedence</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Coding tools have different semantic weight. An autonomous agent actively planning or modifying a codebase
                  takes precedence over a background editor window:
                </p>
                <div className="mt-2 rounded bg-mist p-2 font-mono text-xs text-ink">
                  OpenCode &gt; Command Code &gt; VS Code
                </div>
                <p className="mt-2 text-xs text-graphite">
                  If an OpenCode agent is thinking, its status is displayed. When the agent goes idle, presence falls back gracefully to the active VS Code workspace.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Intra-Kind Arbitration</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  When multiple windows of the same tool are open, <code className="font-mono text-xs">compareWithinKind</code> resolves the winner:
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-graphite">
                  <li>Active source always beats inactive source.</li>
                  <li>Focused window always beats unfocused window.</li>
                  <li>Most recent focus event (<code className="font-mono text-xs">lastFocusedAt</code>) breaks ties.</li>
                </ol>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-line bg-mist/30 p-5">
              <h3 className="text-sm font-semibold text-ink">The Critical Anti-Flip-Flop Rule</h3>
              <p className="mt-2 text-sm text-graphite">
                In distributed presence systems, tools send periodic heartbeats (e.g. every 5 seconds) to indicate they are still alive.
                In a naive system, each incoming heartbeat updates a &ldquo;last updated&rdquo; timestamp. If two windows are active,
                their presence would flip-flop back and forth every few seconds as heartbeats arrived out of phase.
              </p>
              <p className="mt-2 text-sm text-graphite">
                Devvy eliminates flip-flop through an explicit invariant in <code className="font-mono text-xs">sourceKey()</code>:
                heartbeat arrival (<code className="font-mono text-xs">lastSeen</code>) resets the TTL expiration timer, but is <strong>strictly excluded</strong> from
                arbitration keys. Recency is determined exclusively by genuine activity transitions (<code className="font-mono text-xs">busyAt</code> or <code className="font-mono text-xs">lastActiveAt</code>).
                Heartbeats never trigger Discord IPC updates.
              </p>
            </div>
          </section>

          {/* Section 5: Daemon Lifecycle */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">5. Daemon Lifecycle, Source TTL & Service Management</h2>
            <p>
              Devvy runs as an unattended background service designed to handle crashes, reboots, and sleep cycles cleanly:
            </p>
            <ul className="list-disc space-y-2.5 pl-5 text-sm text-graphite">
              <li>
                <strong className="text-ink">15-Second TTL Expiration:</strong> The daemon sweeps registered sources every 2,000ms.
                If an editor crashes or is force-quit without sending an exit payload, its state expires after 15 seconds (<code className="font-mono text-xs">TTL_MS</code>)
                and the daemon clears or reverts the presence automatically.
              </li>
              <li>
                <strong className="text-ink">Graceful Port Collision Handling:</strong> If another Devvy instance is already running on port 17377,
                the new process catches <code className="font-mono text-xs">EADDRINUSE</code> and exits cleanly with status 0, preventing process churn or duplicate daemons.
              </li>
              <li>
                <strong className="text-ink">Throttled Flush Timer (2-Second Minimum Interval):</strong> To avoid flooding Discord&rsquo;s socket with high-frequency editor events,
                Devvy gates all outgoing IPC frames behind a <code className="font-mono text-xs">MIN_IPC_INTERVAL_MS = 2000</code> timer,
                coalescing rapid bursts of typing or tool switching into smooth, throttled updates.
              </li>
              <li>
                <strong className="text-ink">Zero-Configuration Service Supervision:</strong> On macOS, Devvy installs as a user LaunchAgent
                (<code className="font-mono text-xs">com.sonawaneutkarsh.devvy.plist</code>) running against an isolated Node runtime.
                On Windows, it installs via PowerShell with startup registry registration.
              </li>
            </ul>
          </section>

          {/* Section 6: Privacy Boundaries */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">6. Privacy Boundaries & Model Display Sanitization</h2>
            <p>
              Developers work on proprietary codebases, confidential research, and commercial APIs.
              Devvy enforces rigid privacy gates before constructing any Discord presence:
            </p>

            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-mist font-mono text-xs uppercase text-graphite">
                  <tr>
                    <th className="p-3.5">Presence Domain</th>
                    <th className="p-3.5">Deliberately Permitted Context</th>
                    <th className="p-3.5">Strictly Redacted / Forbidden Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-mono text-xs">
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Project Identity</td>
                    <td className="p-3.5 text-graphite">Workspace folder basename only (e.g. &ldquo;Talks&rdquo;)</td>
                    <td className="p-3.5 text-graphite">Absolute paths, user home directory names, full Git URIs.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Activity Mode</td>
                    <td className="p-3.5 text-graphite">Standardized modes: Thinking, Editing, Planning, Reviewing, Searching</td>
                    <td className="p-3.5 text-graphite">Raw prompts, tool inputs, command-line arguments, terminal text.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Model Representation</td>
                    <td className="p-3.5 text-graphite">Normalized family strings (e.g. &ldquo;GPT 5.6&rdquo;, &ldquo;Claude 3.7&rdquo;)</td>
                    <td className="p-3.5 text-graphite">API endpoints, deployment UUIDs, fine-tuning flags, token counts.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Source Code</td>
                    <td className="p-3.5 text-graphite">Primary language tag (e.g. &ldquo;TypeScript&rdquo;)</td>
                    <td className="p-3.5 text-graphite">File names, code snippets, git commit messages, branch names.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-graphite">
              The normalization layer (<code className="font-mono text-xs">model-display.mjs</code>) maps raw internal identifiers
              to clean, public-safe labels while completely filtering out sensitive infrastructure details.
            </p>
          </section>

          {/* Section 7: Verification Suite */}
          <section className="space-y-4 border-t border-line pt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">7. Verification & Automated Test Suite</h2>
            <p className="text-sm text-graphite">
              Devvy is validated by a <strong>22-scenario automated test suite</strong> executing against both mock Discord IPC endpoints
              and physical loopback sockets:
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs text-graphite sm:grid-cols-3">
              <span className="rounded border border-line bg-mist p-2">test-arbitration.mjs</span>
              <span className="rounded border border-line bg-mist p-2">test-presence.mjs</span>
              <span className="rounded border border-line bg-mist p-2">test-model-display.mjs</span>
              <span className="rounded border border-line bg-mist p-2">test-reconnect.sh</span>
              <span className="rounded border border-line bg-mist p-2">test-unfocused.sh</span>
              <span className="rounded border border-line bg-mist p-2">test-multi-daemon.sh</span>
              <span className="rounded border border-line bg-mist p-2">test-leak.mjs</span>
              <span className="rounded border border-line bg-mist p-2">test-race.mjs</span>
              <span className="rounded border border-line bg-mist p-2">test-vscode.mjs</span>
              <span className="rounded border border-line bg-mist p-2">test-commandcode.sh</span>
              <span className="rounded border border-line bg-mist p-2">test-launchagent.sh</span>
              <span className="rounded border border-line bg-mist p-2">test-fallback.sh</span>
            </div>
          </section>

          {/* Section 8: Closing */}
          <section className="space-y-4 border-t border-line pt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">8. Source Code & Open Source</h2>
            <p className="text-sm text-graphite">
              Devvy is open source under the MIT License. The repository contains the daemon, protocol engine, macOS and Windows installer scripts,
              and integration plugins for OpenCode, Command Code, and VS Code.
            </p>
            <div className="pt-2">
              <a
                href="https://github.com/sonawaneutkarsh/devvy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-signal hover:underline"
              >
                Explore the Devvy repository on GitHub <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </section>
        </article>
      </Container>
    </div>
  );
}
