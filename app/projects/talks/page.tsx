import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Watch, Cpu, CheckCircle, ShieldAlert } from "lucide-react";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "Talks Technical Case Study — Utkarsh Sonawane",
  description:
    "Technical case study for Talks: an on-device meeting intelligence system across watchOS and iOS with durable background file transfers, local speech transcription, Apple Foundation Models, and direct Notion synchronization.",
};

export default function TalksCaseStudy() {
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
              Systems & Mobile
            </span>
            <span className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-xs text-graphite">
              watchOS + iOS + Apple Intelligence
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Talks: On-Device Meeting Intelligence Across Apple Watch & iPhone
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-graphite sm:text-xl">
            Recording lectures, advising sessions, and research office hours should not require pulling out a phone,
            tolerating wireless audio dropouts, or transmitting sensitive conversations to third-party AI clouds.
            I engineered Talks as a reliable, distributed iOS and watchOS system: one-tap distraction-free recording from Apple Watch,
            durable background file transfer, on-device speech transcription, and local structuring via Apple Foundation Models before
            synchronizing structured notes directly to a private Notion workspace.
          </p>

          {/* Action Links */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/sonawaneutkarsh/Talks"
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
              <p className="eyebrow">Automated Tests</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">54 Tests</p>
            </div>
            <div>
              <p className="eyebrow">Supported Platforms</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">iOS 18+ & watchOS 11+</p>
            </div>
            <div>
              <p className="eyebrow">Speech & AI</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">SpeechAnalyzer & LLM</p>
            </div>
            <div>
              <p className="eyebrow">Transfer Model</p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">Out-of-Process + ACK</p>
            </div>
          </div>
        </header>

        {/* Visual Highlights */}
        <section className="mt-10 border-b border-line pb-12" aria-labelledby="talks-visuals-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="talks-visuals-heading" className="eyebrow">
              Interface & System In Action
            </h2>
            <span className="font-mono text-xs text-graphite">Native watchOS & iOS Clients</span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Watch UI Card */}
            <div className="flex flex-col items-center rounded-xl border border-line bg-paper p-6 text-center">
              <div className="flex items-center justify-center gap-4">
                <div className="w-36 overflow-hidden rounded-2xl border border-line/60 bg-black shadow-sm">
                  <Image
                    src="/images/projects/talks/watch-record-idle.png"
                    alt="Apple Watch Talks application in idle state showing high-contrast Record button"
                    width={416}
                    height={496}
                    className="h-auto w-full object-contain"
                  />
                </div>
                <div className="w-36 overflow-hidden rounded-2xl border border-line/60 bg-black shadow-sm">
                  <Image
                    src="/images/projects/talks/watch-recording-active.png"
                    alt="Apple Watch Talks active recording state showing live timer, stop action, and screen-off trigger"
                    width={416}
                    height={496}
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
              <h3 className="mt-4 font-mono text-xs font-semibold uppercase text-ink">
                watchOS Capture & Screen-Off Controls
              </h3>
              <p className="mt-1 text-xs text-graphite">
                One-tap start with haptic feedback, live duration timer, and non-intrusive Screen Off blackout for academic meetings.
              </p>
            </div>

            {/* iPhone UI Card */}
            <div className="flex flex-col items-center rounded-xl border border-line bg-paper p-6 text-center">
              <div className="flex items-center justify-center gap-4">
                <div className="w-40 overflow-hidden rounded-2xl border border-line/60 bg-black shadow-sm">
                  <Image
                    src="/images/projects/talks/iphone-talk-detail.png"
                    alt="iPhone Talks Talk Detail screen showing AI-formatted transcript, executive summary, and key points"
                    width={750}
                    height={1630}
                    className="h-auto w-full object-contain"
                  />
                </div>
                <div className="w-40 overflow-hidden rounded-2xl border border-line/60 bg-black shadow-sm">
                  <Image
                    src="/images/projects/talks/iphone-settings.png"
                    alt="iPhone Talks Settings screen showing Keychain credentials and on-device intelligence readiness"
                    width={750}
                    height={1630}
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
              <h3 className="mt-4 font-mono text-xs font-semibold uppercase text-ink">
                iPhone Processing & Talk Intelligence
              </h3>
              <p className="mt-1 text-xs text-graphite">
                Structured meeting deliverables generated on-device via Foundation Models, paired with Keychain-secured Notion sync.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <article className="mt-12 space-y-16 text-base leading-relaxed">
          {/* Section 1: The Problem */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">1. The Problem: Physical Constraints in Distributed Wearable Capture</h2>
            <p>
              Recording meetings from an Apple Watch appears deceptively simple at the UI layer: present a button, invoke an audio recorder,
              and display a timer. In reality, reliable capture across an Apple Watch and iPhone is a distributed systems problem governed
              by aggressive mobile operating system constraints:
            </p>
            <ul className="list-disc space-y-2.5 pl-5 text-sm text-graphite">
              <li>
                <strong className="text-ink">Transient Physical Connectivity:</strong> Users walk away from their desks, pace seminar rooms,
                or step outside Bluetooth range during 90-minute lectures. Streaming raw audio over Bluetooth is fragile, highly vulnerable to packet loss,
                and rapidly drains wearable battery life.
              </li>
              <li>
                <strong className="text-ink">Hostile Lifecycle Limits:</strong> Both watchOS and iOS aggressively terminate background processes
                and revoke CPU execution slots. Any pipeline that assumes uninterrupted execution or in-memory state across stages will drop audio segments.
              </li>
              <li>
                <strong className="text-ink">Confidentiality & Cloud Leaks:</strong> Academic advising, research planning, and lab discussions
                frequently touch unpublished intellectual property and confidential student evaluations. Sending unencrypted voice streams to third-party
                commercial transcription and LLM cloud providers introduces unacceptable privacy violations and recurring per-minute API fees.
              </li>
              <li>
                <strong className="text-ink">External Sync Idempotency:</strong> When mobile networks drop midway through an external sync,
                naive upload pipelines create duplicate pages or corrupt notes.
              </li>
            </ul>
            <p>
              Talks was built to solve these exact physical constraints through a strictly decoupled, local-first architecture.
            </p>
          </section>

          {/* Section 2: End-to-End Architecture */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">2. End-to-End Architecture</h2>
            <p>
              The system splits responsibilities strictly between wearable capture, phone persistence, on-device compute,
              and external archiving:
            </p>

            {/* Architecture Visual Diagram */}
            <div className="rounded-lg border border-line bg-paper p-6 font-mono text-xs leading-relaxed overflow-x-auto">
              <pre className="text-ink overflow-x-auto">
{`┌────────────────────────────────────────────────────────────────────────┐
│                        Apple Watch (TalksWatch)                        │
│                                                                        │
│  • AVAudioSession (.playAndRecord, .spokenAudio, 24kHz mono AAC)       │
│  • WKExtendedRuntimeSession keeps capture alive throughout long talks  │
│  • Screen Off Mode blanks display with subtle 4px dim dot              │
│  • Verifies file integrity (> 1024 bytes) in Documents/WatchRecordings │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Out-of-process background file transfer
                                    │ WCSession.transferFile (system daemon wcd)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            iPhone (Talks)                              │
│                                                                        │
│  1. Ingest audio file atomically into Documents/Recordings/            │
│  2. Send durable background ACK back to Watch via transferUserInfo     │
│  3. Atomically persist job transition to Documents/queue.json          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Crash-Resilient Job Queue                     │  │
│  │  • UUID-indexed single-ownership processing lock                 │  │
│  │  • Reconciles interrupted jobs across app restarts               │  │
│  │  • UIBackgroundTaskIdentifier expiration safety                  │  │
│  └────────────────────────────────┬─────────────────────────────────┘  │
│                                   │
│  ┌────────────────────────────────▼─────────────────────────────────┐  │
│  │                     On-Device Speech Pipeline                    │  │
│  │  • Primary: SpeechAnalyzer + SpeechTranscriber (#available iOS 26)│  │
│  │  • Fallback: SFSpeechRecognizer (strict on-device, zero cloud)    │  │
│  │  • withTimeout watchdog isolates speech finalization hangs        │  │
│  │  • Session circuit breaker triggers immediate fallback           │  │
│  │  • Invariant: Immutable raw transcript preserved verbatim         │  │
│  └────────────────────────────────┬─────────────────────────────────┘  │
│                                   │
│  ┌────────────────────────────────▼─────────────────────────────────┐  │
│  │                  Apple Intelligence Structuring                  │  │
│  │  • Foundation Models SystemLanguageModel schema generation       │  │
│  │  • Context-aware chunking for long transcripts                    │  │
│  │  • Structured extraction: Title, Summary, Key Points, Decisions, │  │
│  │    Action Items, and Follow-Ups                                  │  │
│  └────────────────────────────────┬─────────────────────────────────┘  │
│                                   │
│  ┌────────────────────────────────▼─────────────────────────────────┐  │
│  │                       Direct Notion Upload                       │  │
│  │  • Keychain-secured credentials (Token + Parent Page ID)         │  │
│  │  • Reconciled block upload with 2,000-character boundary chunking│  │
│  │  • Zero-duplicate page creation idempotency                      │  │
│  │  • Raw transcript archived in collapsible bottom toggle block    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Direct HTTPS API (URLSession)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        User Notion Workspace                           │
│  • Cleanly nested under designated 'Talks' parent page                 │
│  • Searchable, formatted meeting records with actionable todo blocks   │
└────────────────────────────────────────────────────────────────────────┘`}
              </pre>
            </div>
          </section>

          {/* Section 3: Watch-Side Reliability */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">3. Watch-Side Reliability & Deletion Invariants</h2>
            <p>
              Audio integrity begins on the wrist. Talks avoids live wireless streaming entirely in favor of an offline-first
              recording loop engineered to survive physical disconnection:
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <Watch className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Audio Session & Runtime</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  The watch captures audio using <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">AVAudioSession</code> configured
                  with <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">.playAndRecord</code> and mode <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">.spokenAudio</code>.
                  It encodes directly to high-efficiency AAC at 24,000 Hz mono (sample rate optimized for spoken voice fidelity while keeping storage under 15 MB per hour).
                  A <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">WKExtendedRuntimeSession</code> keeps the capture thread alive even when the wrist is lowered.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Screen Off Academic Mode</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Bright smart watch displays are distracting in seminar rooms and office hours.
                  Talks introduces a dedicated Screen Off mode that paints the entire canvas pitch black (<code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">Color.black</code>)
                  with a single, 15% opacity 4px red dot in the corner to confirm active telemetry.
                  A tap anywhere on the glass wakes the UI back to controls without interrupting the audio session.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-line bg-mist/30 p-5">
              <h3 className="text-sm font-semibold text-ink">The Deletion Acknowledgement Invariant</h3>
              <p className="mt-2 text-sm text-graphite">
                When the user taps <em>Stop</em>, the watch verifies the generated <code className="font-mono text-xs">.m4a</code> container
                is non-empty and exceeds the 1,024-byte header threshold. It queues the file via <code className="rounded bg-mist px-1 py-0.5 font-mono text-xs">WCSession.default.transferFile</code>.
                Because <code className="font-mono text-xs">transferFile</code> is managed out-of-process by watchOS&rsquo;s <code className="font-mono text-xs">wcd</code> daemon,
                the transfer completes even if the TalksWatch app is suspended immediately after tapping Stop.
              </p>
              <p className="mt-2 text-sm text-graphite">
                <strong>Crucially:</strong> The watch does <em>not</em> delete the audio file upon stopping.
                The local recording remains safely stored in <code className="font-mono text-xs">Documents/WatchRecordings/</code> until
                the iPhone sends a durable, verified acknowledgement payload via <code className="rounded bg-mist px-1 py-0.5 font-mono text-xs">WCSession.transferUserInfo</code>.
                If the user walks out of Bluetooth range before transfer completes, the recording remains on the watch and transfers automatically
                the next time the devices reconnect.
              </p>
            </div>
          </section>

          {/* Section 4: iPhone Durable Queue */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">4. iPhone Durable Queue & State Recovery</h2>
            <p>
              Mobile apps are frequently killed by the operating system due to memory pressure or background execution limits.
              Talks is designed to recover in-flight jobs across app restarts by persisting state transitions atomically to disk:
            </p>
            <ul className="list-disc space-y-2.5 pl-5 text-sm text-graphite">
              <li>
                <strong className="text-ink">Atomic Disk Serialization:</strong> Every state change is serialized via <code className="font-mono text-xs">JSONEncoder</code> and
                written atomically to <code className="font-mono text-xs">Documents/queue.json</code>. No state exists solely in volatile UI memory.
              </li>
              <li>
                <strong className="text-ink">UUID Claim Ownership:</strong> Jobs are tracked by UUID rather than array indices.
                The queue maintains an <code className="font-mono text-xs">activeProcessingJobId</code> lock that prevents race conditions,
                duplicate concurrent processing loops, or index shifts when new recordings arrive.
              </li>
              <li>
                <strong className="text-ink">Lifecycle Restart Reconciliation:</strong> When the app launches or wakes via a background task,
                <code className="rounded bg-mist px-1 py-0.5 font-mono text-xs">JobQueueManager.reconcileInterruptedJobs</code> scans the queue and reconciles any job left in an active state:
                an interrupted <code className="font-mono text-xs">.transcribing</code> job resets to <code className="font-mono text-xs">.received</code> if the audio file exists on disk;
                an interrupted <code className="font-mono text-xs">.formatting</code> job resets to <code className="font-mono text-xs">.waitingForAI</code> using the cached raw transcript;
                and an interrupted <code className="font-mono text-xs">.uploadingToNotion</code> job safely resets to <code className="font-mono text-xs">.waitingForNotion</code>.
              </li>
              <li>
                <strong className="text-ink">Strict Local Deletion Boundaries:</strong> Users can swipe left on completed or failed jobs to delete
                the local iPhone recording and metadata. The deletion routine explicitly validates that active processing jobs cannot be deleted,
                never triggers deletion on Apple Watch, and never attempts to delete or mutate published Notion pages.
              </li>
            </ul>
          </section>

          {/* Section 5: Speech Pipeline */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">5. On-Device Speech Pipeline: SpeechAnalyzer & Watchdog Fallback</h2>
            <p>
              Speech recognition executes 100% on device, ensuring that zero audio streams leave the user&rsquo;s hardware for transcription.
              To balance cutting-edge speech models with platform backwards compatibility, Talks implements an adaptive dual-engine pipeline:
            </p>

            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-mist font-mono text-xs uppercase text-graphite">
                  <tr>
                    <th className="p-3.5">Pipeline Component</th>
                    <th className="p-3.5">Environment / Target</th>
                    <th className="p-3.5">Operational Role & Safeguard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-mono text-xs">
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">SpeechAnalyzer + SpeechTranscriber</td>
                    <td className="p-3.5 text-graphite">#available(iOS 26.0, *)</td>
                    <td className="p-3.5 text-graphite">Modern streaming speech architecture with enhanced acoustic modeling.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">SFSpeechRecognizer Fallback</td>
                    <td className="p-3.5 text-graphite">iOS 18.0–25.x / Fallback Engine</td>
                    <td className="p-3.5 text-graphite">Strict on-device mode (requiresOnDeviceRecognition = true). Zero cloud fallback.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Timeout Watchdog (withTimeout)</td>
                    <td className="p-3.5 text-graphite">TranscriptionService with AtomicCompletionState</td>
                    <td className="p-3.5 text-graphite">Enforces duration-scaled deadlines and isolates speech finalization hangs.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-ink">Session Circuit Breaker</td>
                    <td className="p-3.5 text-graphite">Runtime Lock Protected</td>
                    <td className="p-3.5 text-graphite">Trips after uncooperative analyzer timeouts, immediately routing subsequent jobs to SFSpeechRecognizer.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-lg border border-line bg-paper p-5">
              <h3 className="text-sm font-semibold text-ink">The Full Fallback Invariant</h3>
              <p className="mt-2 text-sm text-graphite">
                A subtle failure mode discovered during iOS speech testing was finalization hangs: occasionally, the primary speech analyzer would transcribe
                audio successfully but hang indefinitely while attempting to close its audio input stream or yield final recognition tokens.
                To guard against this, <code className="font-mono text-xs">TranscriptionService</code> implements watchdog behavior using an asynchronous <code className="font-mono text-xs">withTimeout(...)</code> mechanism
                paired with an <code className="font-mono text-xs">AtomicCompletionState</code> flag. If an analyzer task exceeds its calculated timeout window (proportional to audio length: <code className="font-mono text-xs">max(30s, duration * 2)</code>),
                the watchdog fires, trips the session circuit breaker, and abandons the primary task.
              </p>
              <p className="mt-2 text-sm text-graphite">
                Rather than trusting potentially truncated partial results from an uncooperative engine, Talks discards the partial buffer and invokes
                a complete, clean transcription pass from the beginning using <code className="font-mono text-xs">SFSpeechRecognizer</code>.
                Once transcribed, the raw transcript is marked strictly immutable and stored untouched.
              </p>
            </div>
          </section>

          {/* Section 6: Foundation Models */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">6. On-Device Foundation Models & Apple Intelligence</h2>
            <p>
              Transcripts alone are overwhelming after a 60-minute research sync.
              Talks leverages Apple&rsquo;s on-device Foundation Models (<code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">SystemLanguageModel</code>)
              via Swift&rsquo;s <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">@Generable</code> schema-guided generation to extract structured deliverables:
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-mist/30 p-4">
                <p className="font-mono text-xs font-semibold uppercase text-ink">Polished Transcript</p>
                <p className="mt-1 text-xs text-graphite">
                  Removes disfluencies, false starts, and filler words while preserving speaker cadence and technical terminology.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-mist/30 p-4">
                <p className="font-mono text-xs font-semibold uppercase text-ink">Executive Summary</p>
                <p className="mt-1 text-xs text-graphite">
                  Concise overview capturing the core context, background, and outcomes of the conversation.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-mist/30 p-4">
                <p className="font-mono text-xs font-semibold uppercase text-ink">Key Points & Advice</p>
                <p className="mt-1 text-xs text-graphite">
                  Bullet points extracting methodological guidance, mathematical formulations, and research feedback.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-mist/30 p-4">
                <p className="font-mono text-xs font-semibold uppercase text-ink">Decisions & Action Items</p>
                <p className="mt-1 text-xs text-graphite">
                  Agreed deadlines, assigned responsibilities, and upcoming check-ins formatted as actionable checkboxes.
                </p>
              </div>
            </div>

            <p className="text-sm text-graphite">
              For long transcripts that exceed the on-device model&rsquo;s token window, <code className="font-mono text-xs">MeetingAIService.splitIntoChunks</code> performs
              context-aware chunking: it divides text along natural paragraph and turn boundaries into bounded chunks (target size ~3,500 characters),
              generates structured summaries per section, and synthesizes a consolidated executive summary (<code className="font-mono text-xs">ConsolidatedSummaryOutput</code>)
              without dropping a single character from the source transcript.
            </p>
          </section>

          {/* Section 7: Notion Sync */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">7. Direct Notion API Sync & Idempotency</h2>
            <p>
              Once structured by Foundation Models, notes are uploaded directly from the iPhone to the user&rsquo;s private Notion workspace
              using the official Notion REST API over <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">URLSession</code>.
              There is no intermediary cloud server or proxy.
            </p>
            <ul className="list-disc space-y-2.5 pl-5 text-sm text-graphite">
              <li>
                <strong className="text-ink">Keychain Credential Security:</strong> Integration tokens and parent page IDs are saved exclusively
                in the hardware-backed iOS Keychain via <code className="font-mono text-xs">KeychainHelper</code> and never logged or serialized to queue files.
              </li>
              <li>
                <strong className="text-ink">Structured Block Layout:</strong> Notion pages follow a rigid structural hierarchy:
                AI-Formatted Transcript &rarr; Summary Callout &rarr; Key Points &rarr; Decisions &rarr; Action Items (native <code className="font-mono text-xs">to_do</code> blocks)
                &rarr; Follow-Ups &rarr; and finally the verbatim Raw Transcript enclosed in an expandable toggle block at the absolute bottom.
              </li>
              <li>
                <strong className="text-ink">2,000-Character Notion Block Boundary Splitting:</strong> The Notion API rejects any block whose rich text content exceeds
                2,000 characters. Talks automatically splits long transcript paragraphs across safe sentence boundaries to prevent API payload rejections.
              </li>
              <li>
                <strong className="text-ink">Zero Duplicate Page Invariant:</strong> If an upload fails midway through block insertion,
                the job persists the created Notion page ID. Upon retry, <code className="font-mono text-xs">NotionService</code> queries existing block children
                and appends only missing blocks, preventing duplicate pages or repeated blocks.
              </li>
            </ul>
          </section>

          {/* Section 8: Failure Modes & Lessons */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">8. Real Failure Modes & Engineering Lessons</h2>

            <div className="space-y-6">
              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Avoiding 0xbaadca11 Watchdog Kills</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  iOS background tasks (<code className="font-mono text-xs">UIBackgroundTaskIdentifier</code>) grant a brief window to complete work when suspended.
                  If an expiration handler blocks or attempts asynchronous cleanup, iOS immediately terminates the process with exception code <code className="font-mono text-xs">0xbaadca11</code>.
                  Talks encapsulates background task identifiers in an isolated, thread-safe <code className="font-mono text-xs">BackgroundTaskBox</code>:
                  when the expiration handler fires, it invokes <code className="font-mono text-xs">getAndClear()</code> synchronously, cleans up state immediately,
                  and signals task completion without attempting blocking network operations.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-paper p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-signal" />
                  <h3 className="text-lg font-semibold text-ink">Why Live-Message ACKs Fail</h3>
                </div>
                <p className="mt-3 text-sm text-graphite">
                  Early iterations attempted to acknowledge file receipt from iPhone to Apple Watch using <code className="font-mono text-xs">WCSession.sendMessage</code>.
                  However, <code className="font-mono text-xs">sendMessage</code> requires both apps to be active and reachable simultaneously.
                  If the watch went to sleep immediately after finishing capture, the ACK would fail with an error, leaving the watch uncertain whether the file had arrived.
                  Replacing live messages with <code className="font-mono text-xs">WCSession.transferUserInfo</code> resolved the problem:
                  the system queues the acknowledgement dictionary out-of-process, delivering it reliably when watchOS wakes.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Verification */}
          <section className="space-y-4 border-t border-line pt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">9. Verification & Test Suite</h2>
            <p className="text-sm text-graphite">
              The entire audio, transfer, queue, and sync pipeline is verified by a suite of <strong>54 unit and integration tests</strong> in
              <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">TalksTests/PipelineTests.swift</code>:
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs text-graphite sm:grid-cols-3">
              <span className="rounded border border-line bg-mist p-2">Audio Format & Integrity</span>
              <span className="rounded border border-line bg-mist p-2">Corrupt Audio Rejection</span>
              <span className="rounded border border-line bg-mist p-2">Transfer ACK Invariant</span>
              <span className="rounded border border-line bg-mist p-2">Raw Transcript Immutability</span>
              <span className="rounded border border-line bg-mist p-2">Hierarchical Chunking</span>
              <span className="rounded border border-line bg-mist p-2">Notion Block Ordering</span>
              <span className="rounded border border-line bg-mist p-2">Notion Page ID Parsing</span>
              <span className="rounded border border-line bg-mist p-2">Rate Limit & 429 Retry</span>
              <span className="rounded border border-line bg-mist p-2">Idempotent Block Upload</span>
              <span className="rounded border border-line bg-mist p-2">Job Queue Persistence</span>
              <span className="rounded border border-line bg-mist p-2">Crash Resumption Logic</span>
              <span className="rounded border border-line bg-mist p-2">Speech Watchdog Timeout</span>
            </div>
          </section>

          {/* Section 10: Closing */}
          <section className="space-y-4 border-t border-line pt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">10. Source Code & Open Source</h2>
            <p className="text-sm text-graphite">
              Talks is fully open source under the MIT License. The repository includes complete Xcode project specifications (<code className="font-mono text-xs">project.yml</code>),
              SwiftUI views, watchOS background audio configurations, and test runners.
            </p>
            <div className="pt-2">
              <a
                href="https://github.com/sonawaneutkarsh/Talks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-signal hover:underline"
              >
                Explore the Talks repository on GitHub <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </section>
        </article>
      </Container>
    </div>
  );
}
