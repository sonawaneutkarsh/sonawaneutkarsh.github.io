// Original animated diagrams for the homepage project previews.
// Each builder returns { svg, render(t) } where t is the cycle position in
// [0, 1). render(1) draws the settled final state used for reduced motion.
// The drawings follow each case study's own architecture description.

import { phase, ease, mix, pointAt, SVG_NS } from "./motion.js";

const INK = "#282d27";
const SAGE = "#455c47";
const MUTED = "#62685e";
const LINE = "#6b745d";
const WASH = "#edf0e5";
const SOFT = "#e6ebdd";
const PAPER = "#fcfaf0";
const RULE = "#c9cfbf";

const FONT = `font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"`;

function build(markup, label, viewBox = "0 -24 280 199") {
  // The default view box leaves a band at the top for the frame's caption.
  const holder = document.createElementNS(SVG_NS, "svg");
  holder.setAttribute("viewBox", viewBox);
  holder.setAttribute("class", "preview-diagram");
  holder.setAttribute("aria-hidden", "true");
  holder.setAttribute("focusable", "false");
  holder.innerHTML = markup;
  holder.dataset.label = label;
  const $ = (sel) => holder.querySelector(sel);
  const $$ = (sel) => Array.from(holder.querySelectorAll(sel));
  return { holder, $, $$ };
}

const show = (node, value) => node.setAttribute("opacity", value.toFixed(3));
const place = (node, p) => node.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);

/* ----------------------------------------------------------------------- */
/* Talks: Apple Watch → iPhone (on device) → Notion, with the ACK going back */
/* ----------------------------------------------------------------------- */
export function talksDiagram() {
  const { holder, $, $$ } = build(
    `
    <g fill="none" stroke="${RULE}" stroke-width="1.25" stroke-dasharray="3 4" stroke-linecap="round">
      <path id="t-send" d="M68 74 C 84 60, 96 60, 110 70"/>
      <path id="t-ack" d="M110 108 C 96 122, 82 122, 68 102"/>
      <path id="t-out" d="M168 88 C 182 78, 194 78, 206 84"/>
    </g>
    <text class="t-ack-label" x="89" y="132" text-anchor="middle" font-size="8.5" fill="${SAGE}" ${FONT} opacity="0">ACK</text>

    <g transform="translate(24 50)" stroke="${INK}" stroke-width="1.5">
      <rect x="11" y="-11" width="22" height="13" rx="3" fill="${WASH}"/>
      <rect x="11" y="50" width="22" height="13" rx="3" fill="${WASH}"/>
      <rect x="0" y="0" width="44" height="54" rx="12" fill="${PAPER}"/>
      <rect x="5" y="5" width="34" height="44" rx="8" fill="${WASH}" stroke="none"/>
      <circle class="t-rec" cx="22" cy="27" r="6" fill="${SAGE}" stroke="none"/>
      <circle class="t-rec-ring" cx="22" cy="27" r="9" fill="none" stroke="${SAGE}" stroke-width="1"/>
      <path class="t-watch-check" d="M15 27 l5 5 l9 -10" fill="none" stroke="${SAGE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
    </g>
    <text x="46" y="134" text-anchor="middle" font-size="9.5" fill="${MUTED}" ${FONT}>Watch</text>

    <g transform="translate(110 34)" stroke="${INK}" stroke-width="1.5">
      <rect x="0" y="0" width="58" height="106" rx="11" fill="${PAPER}"/>
      <rect x="4.5" y="9" width="49" height="88" rx="4" fill="${WASH}" stroke="none"/>
      <rect x="22" y="3.5" width="14" height="3" rx="1.5" fill="${INK}" stroke="none"/>
      <g class="t-wave" stroke="${SAGE}" stroke-width="2" stroke-linecap="round" opacity="0">
        <line x1="14" x2="14" y1="49" y2="57"/><line x1="19" x2="19" y1="45" y2="61"/>
        <line x1="24" x2="24" y1="41" y2="65"/><line x1="29" x2="29" y1="46" y2="60"/>
        <line x1="34" x2="34" y1="43" y2="63"/><line x1="39" x2="39" y1="48" y2="58"/>
        <line x1="44" x2="44" y1="50" y2="56"/>
      </g>
      <g class="t-queue" opacity="0">
        <rect x="11" y="15" width="36" height="10" rx="5" fill="${SOFT}" stroke="none"/>
        <text x="29" y="22.6" text-anchor="middle" font-size="6.5" fill="${SAGE}" stroke="none" ${FONT}>queued</text>
      </g>
      <g class="t-lines" stroke="none" fill="${LINE}">
        <rect x="10" y="32" width="36" height="3" rx="1.5"/>
        <rect x="10" y="40" width="30" height="3" rx="1.5"/>
        <rect x="10" y="48" width="38" height="3" rx="1.5"/>
        <rect x="10" y="56" width="24" height="3" rx="1.5"/>
      </g>
      <g class="t-summary" stroke="none" opacity="0">
        <rect x="10" y="68" width="28" height="4" rx="2" fill="${INK}"/>
        <circle cx="12" cy="79" r="1.6" fill="${SAGE}"/><rect x="16" y="77.5" width="26" height="3" rx="1.5" fill="${LINE}"/>
        <circle cx="12" cy="86" r="1.6" fill="${SAGE}"/><rect x="16" y="84.5" width="20" height="3" rx="1.5" fill="${LINE}"/>
      </g>
    </g>
    <text x="139" y="156" text-anchor="middle" font-size="9.5" fill="${MUTED}" ${FONT}>iPhone · on device</text>

    <g transform="translate(206 50)" stroke="${INK}" stroke-width="1.5">
      <path d="M0 0 H40 L52 12 V70 H0 Z" fill="${PAPER}" stroke-linejoin="round"/>
      <path d="M40 0 V12 H52" fill="none" stroke-linejoin="round"/>
      <g class="t-blocks" stroke="none" fill="${LINE}">
        <rect x="8" y="18" width="26" height="4" rx="2" fill="${INK}"/>
        <rect x="8" y="29" width="34" height="3" rx="1.5"/>
        <rect x="8" y="37" width="30" height="3" rx="1.5"/>
        <rect x="8" y="45" width="36" height="3" rx="1.5"/>
      </g>
      <g class="t-done" opacity="0">
        <circle cx="44" cy="62" r="8" fill="${SAGE}" stroke="none"/>
        <path d="M40 62 l3 3 l5 -6" fill="none" stroke="${PAPER}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>
    <text x="232" y="134" text-anchor="middle" font-size="9.5" fill="${MUTED}" ${FONT}>Notion</text>

    <g class="t-packet" opacity="0">
      <rect x="-8" y="-5.5" width="16" height="11" rx="2.5" fill="${SAGE}"/>
      <path d="M-4.5 0 h1.5 l1.5 -3 l1.5 6 l1.5 -3 h1.5" fill="none" stroke="${PAPER}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <circle class="t-ack-dot" r="3.5" fill="${PAPER}" stroke="${SAGE}" stroke-width="1.5" opacity="0"/>
    <g class="t-page-packet" opacity="0">
      <rect x="-7" y="-5" width="14" height="10" rx="2" fill="${PAPER}" stroke="${SAGE}" stroke-width="1.25"/>
      <path d="M-4 -1.5 h8 M-4 1.5 h5" stroke="${SAGE}" stroke-width="1" stroke-linecap="round"/>
    </g>
    `,
    "Illustration of the pipeline",
  );

  const send = $("#t-send");
  const ack = $("#t-ack");
  const out = $("#t-out");
  const packet = $(".t-packet");
  const ackDot = $(".t-ack-dot");
  const pagePacket = $(".t-page-packet");
  const lines = $$(".t-lines rect");
  const blocks = $$(".t-blocks rect");

  function render(t) {
    const rec = 1 - phase(t, 0.12, 0.18);
    const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 16);
    show($(".t-rec"), rec * (0.75 + 0.25 * pulse));
    show($(".t-rec-ring"), rec * pulse * 0.8);

    const travel = ease(phase(t, 0.12, 0.32));
    show(packet, travel > 0 && travel < 1 ? 1 : 0);
    place(packet, pointAt(send, travel));

    show($(".t-wave"), phase(t, 0.3, 0.34) * (1 - phase(t, 0.5, 0.55)));
    show($(".t-queue"), phase(t, 0.31, 0.35) * (1 - phase(t, 0.6, 0.64)));

    const back = ease(phase(t, 0.36, 0.5));
    show(ackDot, back > 0 && back < 1 ? 1 : 0);
    place(ackDot, pointAt(ack, back));
    show($(".t-ack-label"), phase(t, 0.36, 0.4) * (1 - phase(t, 0.62, 0.68)));
    show($(".t-watch-check"), phase(t, 0.5, 0.54));

    lines.forEach((line, i) => show(line, phase(t, 0.52 + i * 0.03, 0.56 + i * 0.03)));
    show($(".t-summary"), phase(t, 0.66, 0.7));

    const upload = ease(phase(t, 0.72, 0.84));
    show(pagePacket, upload > 0 && upload < 1 ? 1 : 0);
    place(pagePacket, pointAt(out, upload));
    blocks.forEach((block, i) => show(block, phase(t, 0.83 + i * 0.025, 0.86 + i * 0.025)));
    show($(".t-done"), phase(t, 0.93, 0.96));
  }

  return { svg: holder, render, cycle: 5600 };
}

/* ----------------------------------------------------------------------- */
/* Devvy: three tools → one local daemon → one Discord presence               */
/* ----------------------------------------------------------------------- */
export function devvyDiagram() {
  const tools = [
    { name: "VS Code", y: 22 },
    { name: "OpenCode", y: 72 },
    { name: "Command Code", y: 122 },
  ];
  const toolMarkup = tools
    .map(
      (tool, i) => `
      <g class="d-tool" data-i="${i}" transform="translate(4 ${tool.y})">
        <rect width="98" height="30" rx="5" fill="${PAPER}" stroke="${INK}" stroke-width="1.5"/>
        <text x="8" y="19" font-size="9" fill="${INK}" ${FONT}>${tool.name}</text>
        <circle class="d-dot" cx="89" cy="15" r="3" fill="${SAGE}" stroke="${SAGE}" stroke-width="1.25"/>
      </g>
      <path class="d-edge" data-i="${i}" d="M102 ${tool.y + 15} C 114 ${tool.y + 15}, 112 87, 124 87" fill="none" stroke="${RULE}" stroke-width="1.25" stroke-dasharray="3 4"/>`,
    )
    .join("");

  const { holder, $, $$ } = build(
    `
    ${toolMarkup}
    <rect class="d-select" x="0" y="68" width="106" height="38" rx="8" fill="none" stroke="${SAGE}" stroke-width="1.75" opacity="0"/>
    <text class="d-ttl" x="53" y="65" text-anchor="middle" font-size="8" fill="${SAGE}" ${FONT} opacity="0">no heartbeat · TTL 15 s</text>

    <g transform="translate(124 62)">
      <rect width="60" height="50" rx="8" fill="${WASH}" stroke="${SAGE}" stroke-width="1.5"/>
      <text x="30" y="22" text-anchor="middle" font-size="10" fill="${INK}" ${FONT}>Devvy</text>
      <text x="30" y="35" text-anchor="middle" font-size="8" fill="${MUTED}" ${FONT}>daemon</text>
      <circle class="d-tick" cx="52" cy="8" r="3" fill="${SAGE}" opacity="0"/>
    </g>
    <path id="d-out" d="M184 87 H200" fill="none" stroke="${SAGE}" stroke-width="1.5"/>

    <g transform="translate(200 56)">
      <rect width="76" height="62" rx="6" fill="${PAPER}" stroke="${INK}" stroke-width="1.5"/>
      <circle cx="15" cy="18" r="7" fill="${SOFT}" stroke="${SAGE}" stroke-width="1.25"/>
      <text x="27" y="16" font-size="8.5" fill="${INK}" ${FONT}>my-project</text>
      <text class="d-state" x="27" y="27" font-size="8" fill="${SAGE}" ${FONT}>Thinking</text>
      <rect x="8" y="38" width="56" height="3" rx="1.5" fill="${RULE}"/>
      <rect x="8" y="46" width="40" height="3" rx="1.5" fill="${RULE}"/>
    </g>
    <text x="238" y="134" text-anchor="middle" font-size="9.5" fill="${MUTED}" ${FONT}>Discord</text>
    <text x="238" y="147" text-anchor="middle" font-size="8" fill="${MUTED}" ${FONT}>no prompts, code,</text>
    <text x="238" y="157" text-anchor="middle" font-size="8" fill="${MUTED}" ${FONT}>or full paths</text>

    ${tools.map((_, i) => `<circle class="d-beat" data-i="${i}" r="2.5" fill="${SAGE}" opacity="0"/>`).join("")}
    <circle class="d-send" r="3" fill="${SAGE}" opacity="0"/>
    `,
    "Illustration of the architecture",
  );

  const edges = $$(".d-edge");
  const beats = $$(".d-beat");
  const toolGroups = $$(".d-tool");
  const dots = $$(".d-dot");
  const select = $(".d-select");
  const state = $(".d-state");
  const outPath = $("#d-out");
  const sendDot = $(".d-send");

  // Scene A: all three alive; OpenCode wins on tool kind.
  // Scene B: OpenCode stops sending heartbeats, expires, Command Code wins.
  function render(t) {
    const openCodeAlive = t < 0.5;
    const expired = phase(t, 0.6, 0.66);
    const fadeIn = phase(t, 0.04, 0.1);
    const switchMove = ease(phase(t, 0.68, 0.76));
    const restart = 1 - phase(t, 0.95, 1);

    beats.forEach((beat, i) => {
      const alive = i !== 1 || openCodeAlive;
      const local = (t * 4 + i * 0.27) % 1;
      const visible = alive && local < 0.8 ? Math.sin((local / 0.8) * Math.PI) : 0;
      show(beat, visible * restart);
      place(beat, pointAt(edges[i], local / 0.8));
    });

    const chosen = t < 0.68 ? 1 : 2;
    edges.forEach((edge, i) => {
      const on = i === chosen && fadeIn > 0.5;
      edge.setAttribute("stroke", on ? SAGE : RULE);
      edge.setAttribute("stroke-width", on ? "1.75" : "1.25");
      edge.setAttribute("stroke-dasharray", on ? "none" : "3 4");
    });

    show(toolGroups[1], 1 - expired * 0.55);
    dots[1].setAttribute("fill", openCodeAlive ? SAGE : PAPER);
    show($(".d-ttl"), phase(t, 0.55, 0.6) * (1 - phase(t, 0.86, 0.9)));

    select.setAttribute("y", mix(68, 118, switchMove).toFixed(2));
    show(select, fadeIn * restart);

    const firstSend = phase(t, 0.1, 0.18);
    const secondSend = phase(t, 0.76, 0.84);
    const sending = firstSend > 0 && firstSend < 1 ? firstSend : secondSend > 0 && secondSend < 1 ? secondSend : -1;
    show(sendDot, sending >= 0 ? 1 : 0);
    if (sending >= 0) place(sendDot, pointAt(outPath, sending));
    show($(".d-tick"), (sending >= 0 ? 1 : 0) * 1);

    state.textContent = t < 0.84 ? "Thinking" : "Editing";
  }

  return { svg: holder, render, cycle: 9000, still: 0.9 };
}

/* ----------------------------------------------------------------------- */
/* Clage: a small network growing a node and a connection while the demo loads */
/* ----------------------------------------------------------------------- */
export function clageNetwork() {
  const inputs = [44, 88, 132].map((y) => ({ x: 58, y }));
  const outputs = [66, 110].map((y) => ({ x: 222, y }));
  const hidden = { x: 140, y: 64 };
  const direct = [
    [0, 0], [1, 0], [1, 1], [2, 1],
  ];
  const { holder, $, $$ } = build(
    `
    <rect x="0" y="0" width="280" height="175" fill="${PAPER}"/>
    <g fill="none" stroke-linecap="round">
      ${direct
        .map(
          ([a, b], i) =>
            `<line class="c-edge" data-i="${i}" x1="${inputs[a].x}" y1="${inputs[a].y}" x2="${outputs[b].x}" y2="${outputs[b].y}" stroke="${LINE}" stroke-width="1.5"/>`,
        )
        .join("")}
      <path class="c-split-a" d="M${inputs[0].x} ${inputs[0].y} L${hidden.x} ${hidden.y}" stroke="${SAGE}" stroke-width="1.5"/>
      <path class="c-split-b" d="M${hidden.x} ${hidden.y} L${outputs[0].x} ${outputs[0].y}" stroke="${SAGE}" stroke-width="1.5"/>
      <path class="c-new" d="M${inputs[2].x} ${inputs[2].y} L${hidden.x} ${hidden.y}" stroke="${SAGE}" stroke-width="1.5" stroke-dasharray="4 3"/>
    </g>
    ${inputs.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="7" fill="${WASH}" stroke="${INK}" stroke-width="1.5"/>`).join("")}
    ${outputs.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="7" fill="${WASH}" stroke="${INK}" stroke-width="1.5"/>`).join("")}
    <circle class="c-hidden" cx="${hidden.x}" cy="${hidden.y}" r="7" fill="${SOFT}" stroke="${SAGE}" stroke-width="1.5"/>
    <circle class="c-signal" r="3" fill="${SAGE}" opacity="0"/>
    <circle class="c-signal" r="3" fill="${SAGE}" opacity="0"/>
    <text x="58" y="160" text-anchor="middle" font-size="8.5" fill="${MUTED}" ${FONT}>inputs</text>
    <text x="222" y="160" text-anchor="middle" font-size="8.5" fill="${MUTED}" ${FONT}>outputs</text>
    `,
    "Clage Studio demo",
    "0 0 280 175",
  );

  const edges = $$(".c-edge");
  const splitA = $(".c-split-a");
  const splitB = $(".c-split-b");
  const fresh = $(".c-new");
  const hiddenNode = $(".c-hidden");
  const signals = $$(".c-signal");
  // Path lengths are measured on first render, once the SVG is in the document.
  let lengthA = 0;
  let lengthB = 0;
  let lengthN = 0;

  function render(t) {
    if (!lengthA) {
      lengthA = splitA.getTotalLength();
      lengthB = splitB.getTotalLength();
      lengthN = fresh.getTotalLength();
    }
    edges.forEach((edge, i) => show(edge, phase(t, i * 0.05, 0.12 + i * 0.05) * (i === 0 ? 1 - phase(t, 0.35, 0.42) : 1)));
    const grow = ease(phase(t, 0.38, 0.5));
    hiddenNode.setAttribute("r", (7 * grow).toFixed(2));
    show(hiddenNode, grow > 0 ? 1 : 0);
    splitA.setAttribute("stroke-dasharray", `${lengthA * grow} ${lengthA}`);
    splitB.setAttribute("stroke-dasharray", `${lengthB * grow} ${lengthB}`);
    const link = ease(phase(t, 0.58, 0.72));
    fresh.setAttribute("stroke-dasharray", link >= 1 ? "4 3" : `${lengthN * link} ${lengthN}`);
    show(fresh, link > 0 ? 1 : 0);

    signals.forEach((signal, i) => {
      const local = (t * 3 + i * 0.5) % 1;
      const onA = local < 0.5;
      const path = onA ? splitA : splitB;
      const p = pointAt(path, onA ? local * 2 : (local - 0.5) * 2);
      show(signal, grow >= 1 ? Math.sin(local * Math.PI) : 0);
      place(signal, p);
    });
  }

  return { svg: holder, render, cycle: 4200 };
}

export const diagrams = { talks: talksDiagram, devvy: devvyDiagram };
