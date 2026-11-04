// Animated inline icons in the homepage introduction.
//
// Each icon is an ordinary link whose rest drawing is inline SVG in the HTML,
// so it reads without JavaScript. This module adds the moving parts, runs
// them with damped springs, and mirrors the lit icon into a larger card that
// springs out of the icon into the right margin on wide screens. Where the
// margin is too narrow, only the inline icon animates.
//
// Triggers: mouse/pen hover and keyboard focus light an icon. A finger tap
// follows the link at once (no double tap); on touch screens each icon instead
// plays once, staggered, the first time the introduction is on screen. With
// reduced motion a lit icon jumps straight to one still of its final state.

import { Spring, frameLoop, reducedMotion, coarsePointer, watchVisibility, svg, mix, phase, ease } from "./motion.js";

const INK = "#282d27";
const SAGE = "#455c47";
const LINE = "#6b745d";
const PAPER = "#fcfaf0";
const SOFT = "#e6ebdd";
const WASH = "#edf0e5";

const set = (node, attrs) => {
  for (const key in attrs) {
    const value = attrs[key];
    node.setAttribute(key, typeof value === "number" ? value.toFixed(2) : value);
  }
};
const fade = (node, value) => node.setAttribute("opacity", Math.max(0, Math.min(1, value)).toFixed(3));

/** Spring that starts moving towards `target` after `delay` ms of the current script. */
function springs(count, value, config) {
  return Array.from({ length: count }, () => new Spring(value, config));
}

/* =====================================================================
   A — AI systems: a compact network spreads, grows connections, carries
   signals, then reorganizes into a small agent loop (plan → act → check).
   ===================================================================== */
const aiIcon = {
  caption: "A small network that grows connections, passes signals, then rearranges into an agent loop: plan, act, check.",
  rest: [[21, 15], [21, 27], [30, 12], [30, 21], [30, 30], [39, 21]],
  spread: [[12, 12], [12, 30], [30, 6], [30, 21], [30, 36], [48, 21]],
  // [x, y, width, height]: three nodes become steps, one becomes a tool, two fold away.
  flow: [[10, 19, 13, 9], [10, 19, 0, 0], [30, 6, 5, 5], [30, 19, 13, 9], [50, 19, 0, 0], [50, 19, 13, 9]],
  edges: [[0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 5], [4, 5]],
  extra: [[0, 4], [1, 2]],
  paths: [[0, 2, 5], [1, 4, 5]],
  hold: 1800,

  create() {
    const cfg = { stiffness: 140, damping: 14 };
    return {
      x: this.rest.map(([x]) => new Spring(x, cfg)),
      y: this.rest.map(([, y]) => new Spring(y, cfg)),
      w: springs(6, 5.4, cfg),
      h: springs(6, 5.4, cfg),
      stage: 0,
    };
  },

  bind(root) {
    const lines = Array.from(root.querySelectorAll(".a-edge"));
    const nodes = Array.from(root.querySelectorAll(".a-node"));
    let layer = root.querySelector(".a-live");
    if (!layer) {
      layer = svg("g", { class: "a-live", fill: "none", "stroke-linecap": "round" });
      const extra = this.extra.map(() => svg("line", { class: "a-extra", stroke: SAGE, "stroke-width": 1, opacity: 0 }, layer));
      const f0 = svg("line", { class: "a-f0", stroke: SAGE, "stroke-width": 1.5, opacity: 0 }, layer);
      const f1 = svg("line", { class: "a-f1", stroke: SAGE, "stroke-width": 1.5, opacity: 0 }, layer);
      const tool = svg("line", { class: "a-tool", stroke: LINE, "stroke-width": 1, opacity: 0 }, layer);
      const loop = svg("path", { class: "a-loop", d: "M50 24 C 50 37, 10 37, 10 24", stroke: SAGE, "stroke-width": 1, "stroke-dasharray": "2.2 2.2", opacity: 0 }, layer);
      const head = svg("path", { class: "a-head", d: "M7.6 26.8 L10 24 L12.4 26.8", stroke: SAGE, "stroke-width": 1, opacity: 0 }, layer);
      root.insertBefore(layer, root.querySelector(".a-nodes"));
      const signals = svg("g", { class: "a-signals", fill: SAGE }, root);
      this.paths.forEach(() => svg("circle", { class: "a-signal", r: 1.7, opacity: 0 }, signals));
      void extra, f0, f1, tool, loop, head;
    }
    return {
      lines,
      nodes,
      extra: Array.from(root.querySelectorAll(".a-extra")),
      f0: root.querySelector(".a-f0"),
      f1: root.querySelector(".a-f1"),
      tool: root.querySelector(".a-tool"),
      loop: root.querySelector(".a-loop"),
      head: root.querySelector(".a-head"),
      signals: Array.from(root.querySelectorAll(".a-signal")),
    };
  },

  target(state, layout, stagger = 0) {
    const now = state.since ?? 0;
    layout.forEach((point, i) => {
      const delay = now + i * stagger;
      state.pending = state.pending || [];
      state.pending.push([delay, () => {
        state.x[i].to(point[0]);
        state.y[i].to(point[1]);
        state.w[i].to(point[2] ?? 5.4);
        state.h[i].to(point[3] ?? 5.4);
      }]);
    });
  },

  light(state) {
    state.pending = [];
    state.stage = 1;
    this.target(state, this.spread, 30);
  },

  dim(state) {
    state.pending = [];
    state.stage = 0;
    this.target(state, this.rest, 20);
  },

  step(state, dt, t, lit) {
    let moving = false;
    if (lit && state.stage === 1 && t > 900) {
      state.stage = 2;
      state.pending = [];
      this.target(state, this.flow, 45);
    }
    if (state.pending && state.pending.length) {
      state.pending = state.pending.filter(([delay, run]) => {
        if (delay > (state.since ?? 0)) return true;
        run();
        return false;
      });
      moving = true;
    }
    state.since = (state.since ?? 0) + dt;
    for (const group of [state.x, state.y, state.w, state.h]) {
      for (const spring of group) moving = spring.step(dt) || moving;
    }
    return moving;
  },

  still: 2200,

  render(view, state, t, lit, level) {
    const at = (i) => ({ x: state.x[i].value, y: state.y[i].value, w: Math.max(0, state.w[i].value), h: Math.max(0, state.h[i].value) });
    const nodes = state.x.map((_, i) => at(i));
    view.nodes.forEach((rect, i) => {
      const n = nodes[i];
      set(rect, { x: n.x - n.w / 2, y: n.y - n.h / 2, width: n.w, height: n.h, rx: Math.min(n.w, n.h) / 2 });
      fade(rect, n.w < 0.6 ? 0 : 1);
    });
    const flowIn = lit ? ease(phase(t, 950, 1400)) : 0;
    const oldOut = 1 - flowIn;
    view.lines.forEach((line, k) => {
      const [a, b] = this.edges[k];
      set(line, { x1: nodes[a].x, y1: nodes[a].y, x2: nodes[b].x, y2: nodes[b].y });
      fade(line, oldOut);
    });
    const grow = lit ? ease(phase(t, 250, 650)) * oldOut : 0;
    view.extra.forEach((line, k) => {
      const [a, b] = this.extra[k];
      const end = { x: mix(nodes[a].x, nodes[b].x, grow), y: mix(nodes[a].y, nodes[b].y, grow) };
      set(line, { x1: nodes[a].x, y1: nodes[a].y, x2: end.x, y2: end.y });
      fade(line, grow > 0.02 ? level : 0);
    });
    const travelling = lit ? phase(t, 450, 1050) : 0;
    view.signals.forEach((dot, k) => {
      const [a, b, c] = this.paths[k];
      const local = (travelling * 2 + k * 0.35) % 1;
      const first = local < 0.5;
      const from = nodes[first ? a : b];
      const to = nodes[first ? b : c];
      const u = first ? local * 2 : (local - 0.5) * 2;
      set(dot, { cx: mix(from.x, to.x, u), cy: mix(from.y, to.y, u) });
      fade(dot, travelling > 0 && travelling < 1 ? Math.sin(local * Math.PI) * level : 0);
    });
    const b0 = nodes[0];
    const b1 = nodes[3];
    const b2 = nodes[5];
    const draw = (line, from, to, p) => {
      set(line, { x1: from.x, y1: from.y, x2: mix(from.x, to.x, p), y2: mix(from.y, to.y, p) });
      fade(line, p > 0.02 ? level : 0);
    };
    draw(view.f0, { x: b0.x + b0.w / 2 + 1, y: b0.y }, { x: b1.x - b1.w / 2 - 1, y: b1.y }, lit ? ease(phase(t, 1150, 1450)) : 0);
    draw(view.f1, { x: b1.x + b1.w / 2 + 1, y: b1.y }, { x: b2.x - b2.w / 2 - 1, y: b2.y }, lit ? ease(phase(t, 1300, 1600)) : 0);
    draw(view.tool, { x: b1.x, y: b1.y - b1.h / 2 - 0.5 }, { x: nodes[2].x, y: nodes[2].y + 2.5 }, lit ? ease(phase(t, 1200, 1500)) : 0);
    const loop = lit ? ease(phase(t, 1450, 1900)) : 0;
    fade(view.loop, loop * level);
    fade(view.head, phase(loop, 0.7, 1) * level);
  },
};

/* =====================================================================
   B — Software: a laptop steps back, a watch and phone come forward, a
   recording travels across, the phone changes state and confirms, then
   everything returns to rest. Modeled on Talks' watch → phone hand-off.
   ===================================================================== */
const softwareIcon = {
  caption: "A recording moves from watch to phone, the phone processes it and confirms receipt, then everything returns to rest.",
  hold: 0,
  create() {
    const soft = { stiffness: 150, damping: 15 };
    return {
      laptop: new Spring(0, { stiffness: 170, damping: 20 }),
      watch: new Spring(0, soft),
      phone: new Spring(0, { stiffness: 135, damping: 13.5 }),
      returning: false,
    };
  },

  bind(root) {
    let live = root.querySelector(".b-live");
    if (!live) {
      live = svg("g", { class: "b-live" }, root);
      const arc = svg("path", { class: "b-arc", d: "M19 20 C 25 12, 35 12, 41 18", fill: "none", stroke: LINE, "stroke-width": 1, "stroke-dasharray": "1.6 2", opacity: 0 }, live);
      const watch = svg("g", { class: "b-watch", opacity: 0 }, live);
      svg("rect", { x: -3, y: -9.5, width: 6, height: 4, rx: 1.2, fill: WASH, stroke: INK, "stroke-width": 1 }, watch);
      svg("rect", { x: -3, y: 5.5, width: 6, height: 4, rx: 1.2, fill: WASH, stroke: INK, "stroke-width": 1 }, watch);
      svg("rect", { x: -5.5, y: -6.5, width: 11, height: 13, rx: 3.4, fill: PAPER, stroke: INK, "stroke-width": 1.5 }, watch);
      svg("circle", { class: "b-rec", cx: 0, cy: 0, r: 2, fill: SAGE }, watch);
      const phone = svg("g", { class: "b-phone", opacity: 0 }, live);
      svg("rect", { x: -6.5, y: -11, width: 13, height: 22, rx: 2.8, fill: PAPER, stroke: INK, "stroke-width": 1.5 }, phone);
      const screen = svg("g", { class: "b-screen", fill: LINE }, phone);
      [[-3.5, -5, 7], [-3.5, -1.5, 5.5], [-3.5, 2, 6.5], [-3.5, 5.5, 4]].forEach(([x, y, w]) =>
        svg("rect", { class: "b-line", x, y, width: w, height: 1.1, rx: 0.55, opacity: 0 }, screen),
      );
      const wave = svg("path", { class: "b-wave", d: "M-4 0 h1.5 l1 -3 l1.5 6 l1.5 -5 l1 2 h1.5", fill: "none", stroke: SAGE, "stroke-width": 1, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0 }, phone);
      const check = svg("g", { class: "b-check", opacity: 0 }, live);
      svg("circle", { r: 4, fill: SAGE }, check);
      svg("path", { d: "M-1.9 0 l1.3 1.4 l2.6 -2.8", fill: "none", stroke: PAPER, "stroke-width": 1.1, "stroke-linecap": "round", "stroke-linejoin": "round" }, check);
      svg("rect", { class: "b-packet", x: -2.5, y: -1.8, width: 5, height: 3.6, rx: 1, fill: SAGE, opacity: 0 }, live);
      void arc, wave;
    }
    return {
      laptop: root.querySelector(".b-laptop"),
      arc: root.querySelector(".b-arc"),
      watch: root.querySelector(".b-watch"),
      phone: root.querySelector(".b-phone"),
      rec: root.querySelector(".b-rec"),
      lines: Array.from(root.querySelectorAll(".b-line")),
      wave: root.querySelector(".b-wave"),
      check: root.querySelector(".b-check"),
      packet: root.querySelector(".b-packet"),
    };
  },

  light(state) {
    state.returning = false;
    state.laptop.to(1);
    state.watch.to(1);
    state.phone.to(1);
  },

  dim(state) {
    state.returning = true;
    state.laptop.to(0);
    state.watch.to(0);
    state.phone.to(0);
  },

  step(state, dt, t, lit) {
    // One-shot: after the confirmation, return to rest even while still hovered.
    if (lit && !state.returning && t > 2050) this.dim(state);
    let moving = false;
    for (const spring of [state.laptop, state.watch, state.phone]) moving = spring.step(dt) || moving;
    return moving || (lit && t < 2600);
  },

  still: 1650,

  render(view, state, t, lit, level) {
    const l = state.laptop.value;
    view.laptop.setAttribute(
      "transform",
      `translate(30 21) scale(${mix(1, 0.62, l).toFixed(3)}) translate(-30 ${mix(-21, -26, l).toFixed(2)})`,
    );
    fade(view.laptop, mix(1, 0.28, l));

    const w = state.watch.value;
    const p = state.phone.value;
    view.watch.setAttribute("transform", `translate(${mix(30, 13, w).toFixed(2)} ${mix(21, 25, w).toFixed(2)}) scale(${Math.max(0.01, w).toFixed(3)})`);
    view.phone.setAttribute("transform", `translate(${mix(30, 47, p).toFixed(2)} ${mix(21, 22, p).toFixed(2)}) scale(${Math.max(0.01, p).toFixed(3)})`);
    fade(view.watch, Math.min(1, w * 1.6));
    fade(view.phone, Math.min(1, p * 1.6));

    const active = lit && !state.returning;
    const shown = active ? 1 : level;
    fade(view.arc, Math.min(w, p) * shown * (lit ? phase(t, 350, 500) : 0));

    const send = lit ? ease(phase(t, 520, 1000)) : 0;
    const from = { x: 18.5, y: 21 };
    const ctrl1 = { x: 25, y: 12 };
    const ctrl2 = { x: 35, y: 12 };
    const to = { x: 41, y: 18 };
    const u = send;
    const bez = (a, b, c, d) => (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u * u * c + u ** 3 * d;
    set(view.packet, { x: bez(from.x, ctrl1.x, ctrl2.x, to.x) - 2.5, y: bez(from.y, ctrl1.y, ctrl2.y, to.y) - 1.8 });
    fade(view.packet, send > 0 && send < 1 ? shown : 0);

    fade(view.rec, lit ? 1 - phase(t, 450, 600) * 0.6 : 1);
    fade(view.wave, lit ? phase(t, 980, 1080) * (1 - phase(t, 1180, 1280)) * shown : 0);
    view.lines.forEach((line, i) => fade(line, lit ? phase(t, 1200 + i * 60, 1300 + i * 60) * shown : 0));
    const pop = lit ? ease(phase(t, 1450, 1650)) : 0;
    view.check.setAttribute("transform", `translate(${mix(30, 53, p).toFixed(2)} ${mix(21, 12, p).toFixed(2)}) scale(${(pop * Math.min(1, p)).toFixed(3)})`);
    fade(view.check, pop > 0 ? shown * Math.min(1, p * 1.4) : 0);
  },
};

/* =====================================================================
   C — Research: a paper fills with lines, a drug mention and a reaction
   mention are marked, a candidate link forms, and a review mark appears.
   It illustrates the workflow only; the link is a reported co-mention to
   be checked, not a verified causal relationship.
   ===================================================================== */
const researchIcon = {
  caption: "Text lines appear; a drug mention and a reaction mention are marked and linked as a candidate, then flagged for review. Not a causal claim.",
  hold: 1600,
  widths: [15, 13, 16, 9],
  create() {
    return { lift: new Spring(0, { stiffness: 160, damping: 14 }), badge: new Spring(0, { stiffness: 220, damping: 15 }) };
  },

  bind(root) {
    let live = root.querySelector(".c-live");
    if (!live) {
      // Inside the paper group, above the text, so marks tilt with the page.
      live = svg("g", { class: "c-live" }, root.querySelector(".c-paper"));
      const drug = svg("rect", { class: "c-drug", x: 25.5, y: 13.4, width: 8, height: 3.6, rx: 1.2, fill: SOFT, "fill-opacity": 0.6, stroke: SAGE, "stroke-width": 1, opacity: 0 }, live);
      const reaction = svg("rect", { class: "c-reaction", x: 27.5, y: 23.4, width: 9.5, height: 3.6, rx: 1.2, fill: WASH, "fill-opacity": 0.45, stroke: INK, "stroke-width": 1, "stroke-dasharray": "1.6 1.2", opacity: 0 }, live);
      const link = svg("path", { class: "c-link", d: "M34 15.2 C 42 15.5, 43 24.5, 37.5 25.2", fill: "none", stroke: SAGE, "stroke-width": 1, "stroke-linecap": "round", opacity: 0 }, live);
      const badge = svg("g", { class: "c-badge", opacity: 0 }, live);
      svg("circle", { r: 5, fill: PAPER, stroke: SAGE, "stroke-width": 1.5 }, badge);
      svg("path", { d: "M-2.2 0.1 l1.5 1.6 l3 -3.3", fill: "none", stroke: SAGE, "stroke-width": 1.3, "stroke-linecap": "round", "stroke-linejoin": "round" }, badge);
      void drug, reaction, link;
    }
    return {
      paper: root.querySelector(".c-paper"),
      faint: Array.from(root.querySelectorAll(".c-faint")),
      text: Array.from(root.querySelectorAll(".c-text")),
      drug: root.querySelector(".c-drug"),
      reaction: root.querySelector(".c-reaction"),
      link: root.querySelector(".c-link"),
      badge: root.querySelector(".c-badge"),
    };
  },

  light(state) {
    state.lift.to(1);
    state.badge.set(0);
  },
  dim(state) {
    state.lift.to(0);
    state.badge.to(0);
  },
  step(state, dt, t, lit) {
    if (lit && t > 1300) state.badge.to(1);
    const a = state.lift.step(dt);
    const b = state.badge.step(dt);
    return a || b || (lit && t < 1800);
  },

  still: 1900,

  render(view, state, t, lit, level) {
    const lift = state.lift.value;
    view.paper.setAttribute(
      "transform",
      `translate(30 21) rotate(${mix(0, -3, lift).toFixed(2)}) translate(-30 ${mix(-21, -22, lift).toFixed(2)})`,
    );
    view.text.forEach((line, i) => {
      const grow = lit ? ease(phase(t, 60 + i * 110, 360 + i * 110)) : 0;
      set(line, { width: this.widths[i] * grow });
      fade(line, grow > 0.02 ? level : 0);
    });
    view.faint.forEach((line) => fade(line, 1 - (lit ? phase(t, 0, 300) : 0) * level));
    const drug = lit ? ease(phase(t, 560, 760)) : 0;
    const reaction = lit ? ease(phase(t, 760, 960)) : 0;
    fade(view.drug, drug * level);
    fade(view.reaction, reaction * level);
    const link = lit ? ease(phase(t, 960, 1300)) : 0;
    if (!view.linkLength) view.linkLength = view.link.getTotalLength() || 14;
    set(view.link, { "stroke-dasharray": `${view.linkLength * link} ${view.linkLength}` });
    fade(view.link, link > 0.02 ? level : 0);
    const badge = Math.max(0, state.badge.value);
    view.badge.setAttribute("transform", `translate(44 33.5) scale(${badge.toFixed(3)})`);
    fade(view.badge, badge > 0.01 ? Math.min(1, badge) * level : 0);
  },
};

const DEFINITIONS = { ai: aiIcon, software: softwareIcon, research: researchIcon };

/* ===================================================================== */

class HeroIcon {
  constructor(link, def, figure) {
    this.link = link;
    this.def = def;
    this.figure = figure;
    this.svg = link.querySelector("svg");
    this.state = def.create();
    this.views = [def.bind.call(def, this.svg)];
    this.lit = false;
    this.t = 0;
    this.level = new Spring(0, { stiffness: 220, damping: 26 });
    this.loop = frameLoop((dt) => this.frame(dt));
    this.render();
  }

  light(source) {
    if (this.lit) return;
    this.lit = true;
    this.source = source;
    this.t = 0;
    this.state.since = 0;
    this.link.classList.add("is-lit");
    this.def.light(this.state);
    this.level.to(1);
    if (this.figure) this.figure.show(this);
    if (reducedMotion()) {
      this.snapToStill();
      return;
    }
    this.loop.start();
  }

  dim() {
    if (!this.lit) return;
    this.lit = false;
    this.link.classList.remove("is-lit");
    this.state.since = 0;
    this.def.dim(this.state);
    this.level.to(0);
    if (this.figure) this.figure.hide(this);
    if (reducedMotion()) {
      this.reset();
      return;
    }
    this.loop.start();
  }

  /** Reduced motion: settle every spring at once and draw one still frame. */
  snapToStill() {
    const step = 16;
    for (let elapsed = 0; elapsed < this.def.still; elapsed += step) {
      this.t = elapsed;
      this.def.step(this.state, step, this.t, true);
    }
    const settle = (s) => s instanceof Spring && s.set(s.target);
    Object.values(this.state).forEach((v) => (Array.isArray(v) ? v.forEach(settle) : settle(v)));
    this.level.set(1);
    this.render();
  }

  reset() {
    this.state = this.def.create();
    this.level.set(0);
    this.t = 0;
    this.render();
  }

  addView(root) {
    const view = this.def.bind.call(this.def, root);
    this.views.push(view);
    this.render();
    return () => {
      this.views = this.views.filter((v) => v !== view);
    };
  }

  frame(dt) {
    this.t += dt;
    const moving = this.def.step(this.state, dt, this.t, this.lit);
    const fading = this.level.step(dt);
    this.render();
    return moving || fading || (this.lit && this.t < (this.def.hold || 0) + 1200);
  }

  render() {
    for (const view of this.views) this.def.render(view, this.state, this.t, this.lit, this.level.value);
  }
}

/**
 * The enlarged copy of the lit icon. It springs out of the icon itself (a
 * FLIP from the icon's box to the card's box) and goes back into it on exit.
 *
 * Placement: only in the right margin beside the text column, level with
 * the icon, and only when it fits inside the viewport without touching the
 * heading, any paragraph, the notebook illustration or another icon. When it
 * does not fit (medium widths, phones) there is no card: the inline icon
 * animates in place.
 */
class PopCard {
  constructor(host, protectedEls) {
    this.host = host;
    this.protected = protectedEls;
    this.node = document.createElement("div");
    this.node.className = "hero-pop";
    this.node.setAttribute("aria-hidden", "true");
    host.appendChild(this.node);
    this.owner = null;
    this.detach = null;
    // Slightly underdamped: a small, soft overshoot, settling in ~450 ms.
    this.p = new Spring(0, { stiffness: 230, damping: 19 });
    this.loop = frameLoop((dt) => this.frame(dt));
    this.from = null;
  }

  get usable() {
    return window.matchMedia("(min-width: 720px)").matches;
  }

  /** Returns false (and shows nothing) when the right margin has no room. */
  place(icon) {
    const host = this.host.getBoundingClientRect();
    const r = icon.link.querySelector(".hero-icon").getBoundingClientRect();
    const column = icon.link.closest(".bio").getBoundingClientRect();
    const edge = document.documentElement.clientWidth - 16;
    const w = 176;
    const h = Math.round(((w - 20) * 42) / 60) + 20;
    const gap = 14;
    const chosen = { side: "right", x: column.right + 24, y: r.top + r.height / 2 - h / 2 };
    const blocked = this.protected
      .flatMap((el) => (el.matches(".bio") ? Array.from(el.children) : [el]))
      .map((el) => el.getBoundingClientRect())
      .concat(
        Array.from(document.querySelectorAll(".hero-link .hero-icon"))
          .filter((el) => el !== icon.link.querySelector(".hero-icon"))
          .map((el) => el.getBoundingClientRect()),
      );
    const hits = blocked.some(
      (b) => chosen.x < b.right + 6 && chosen.x + w > b.left - 6 && chosen.y < b.bottom + 6 && chosen.y + h > b.top - 6,
    );
    if (hits || chosen.x + w > edge || chosen.y < 0) return false;
    this.side = chosen.side;
    this.box = { x: chosen.x - host.left, y: chosen.y - host.top, w, h };
    this.from = { x: r.left - host.left, y: r.top - host.top, w: r.width, h: r.height };
    Object.assign(this.node.style, { left: `${this.box.x}px`, top: `${this.box.y}px`, width: `${w}px`, height: `${h}px` });
    this.node.dataset.side = chosen.side;
    return true;
  }

  show(icon) {
    if (!this.usable || !this.place(icon)) return;
    if (this.detach) this.detach();
    this.owner = icon;
    const clone = icon.svg.cloneNode(true);
    clone.removeAttribute("class");
    clone.classList.add("hero-pop-svg");
    clone.querySelectorAll(".a-live, .a-signals, .b-live, .c-live").forEach((node) => node.remove());
    this.node.replaceChildren(clone);
    this.detach = icon.addView(clone);
    this.node.classList.add("is-showing");
    if (reducedMotion()) {
      this.p.set(1);
      this.apply();
      return;
    }
    if (this.p.value < 0.02) this.p.set(0);
    this.p.to(1);
    this.loop.start();
  }

  hide(icon) {
    if (this.owner !== icon) return;
    if (reducedMotion()) {
      this.p.set(0);
      this.finish();
      return;
    }
    this.p.to(0);
    this.loop.start();
  }

  finish() {
    this.apply();
    this.node.classList.remove("is-showing");
    if (this.detach) this.detach();
    this.detach = null;
    this.owner = null;
  }

  /** Map p = 0 (the icon's box) .. 1 (the card's box) to one transform. */
  apply() {
    if (!this.box) return;
    const p = this.p.value;
    const { x, y, w, h } = this.box;
    const f = this.from;
    const sx = f.w / w + (1 - f.w / w) * p;
    const sy = f.h / h + (1 - f.h / h) * p;
    const tx = (f.x - x) * (1 - p);
    const ty = (f.y - y) * (1 - p);
    this.node.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
    this.node.style.opacity = Math.min(1, Math.max(0, p * 2.2)).toFixed(3);
    this.node.style.setProperty("--content", Math.min(1, Math.max(0, (p - 0.35) / 0.5)).toFixed(3));
  }

  frame(dt) {
    const moving = this.p.step(dt);
    this.apply();
    if (!moving && this.p.target === 0) this.finish();
    return moving;
  }
}

export function initHeroIcons(root = document) {
  const links = Array.from(root.querySelectorAll("[data-hero-icon]"));
  if (!links.length) return [];
  const intro = links[0].closest(".intro");
  const protectedEls = [intro.querySelector(".intro-art"), intro.querySelector(".bio")].filter(Boolean);
  const figure = new PopCard(intro, protectedEls);
  const icons = links
    .map((link) => {
      const def = DEFINITIONS[link.dataset.heroIcon];
      return def ? new HeroIcon(link, def, figure) : null;
    })
    .filter(Boolean);

  icons.forEach((icon) => {
    const { link } = icon;
    link.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      icons.forEach((other) => other !== icon && other.dim());
      icon.light("hover");
    });
    link.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "touch") return;
      if (icon.source === "hover") icon.dim();
    });
    link.addEventListener("focus", () => {
      icons.forEach((other) => other !== icon && other.dim());
      icon.light("focus");
    });
    link.addEventListener("blur", () => {
      if (icon.source === "focus") icon.dim();
    });
  });

  // Touch screens cannot hover: play each icon once, staggered, the first
  // time the introduction is on screen. Taps on the links navigate normally.
  if (coarsePointer() && !reducedMotion()) {
    const lede = links[0].closest("p") || links[0];
    let played = false;
    const stop = watchVisibility(lede, (visible) => {
      if (!visible || played) return;
      played = true;
      stop();
      icons.forEach((icon, i) => {
        setTimeout(() => {
          icon.light("tour");
          setTimeout(() => icon.source === "tour" && icon.dim(), 2300);
        }, 500 + i * 900);
      });
    });
  }
  return icons;
}
