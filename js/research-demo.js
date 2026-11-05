// Step-through for the synthetic ADR extraction illustration.
//
// All examples, highlights and verdicts are fixed in the HTML; this script
// only reveals them one stage at a time and draws the connector lines. It
// makes no network requests. Without JavaScript every stage is shown at once.

import { reducedMotion } from "./motion.js";

const STEPS = 6;
const TITLES = ["Original text", "Drug mentions", "Reaction mentions", "Candidate pairs", "Review", "Not causation"];
const SVG_NS = "http://www.w3.org/2000/svg";

function init() {
  const demo = document.querySelector(".adr-demo");
  if (!demo) return;
  const examples = Array.from(demo.querySelectorAll(".adr-example"));
  const exampleButtons = Array.from(demo.querySelectorAll("[data-example]"));
  const stepButtons = Array.from(demo.querySelectorAll("[data-goto]"));
  const explanations = Array.from(demo.querySelectorAll(".adr-explanations > li"));
  const controls = demo.querySelector(".adr-controls");
  const progress = document.getElementById("adr-progress");
  const prev = demo.querySelector('[data-move="-1"]');
  const next = demo.querySelector('[data-move="1"]');

  let step = 1;
  let current = 0;

  controls.hidden = false;
  demo.classList.add("is-enhanced");

  function drawLinks(example) {
    const post = example.querySelector(".adr-post");
    const layer = post.querySelector(".adr-links");
    const frame = post.getBoundingClientRect();
    layer.setAttribute("viewBox", `0 0 ${frame.width} ${frame.height}`);
    layer.setAttribute("width", String(frame.width));
    layer.setAttribute("height", String(frame.height));
    layer.replaceChildren();
    const box = (id) => {
      const mark = post.querySelector(`mark[data-id="${id}"]`);
      // A mark that starts at a line break has an empty fragment at the end of
      // the previous line; anchor on the first fragment with real width.
      const rects = Array.from(mark.getClientRects());
      const r = rects.find((rect) => rect.width > 2) || rects[0];
      return { x: r.left + r.width / 2 - frame.left, top: r.top - frame.top - 2, bottom: r.bottom - frame.top + 2 };
    };
    const pairs = Array.from(example.querySelectorAll(".adr-pairs > li"));
    // Same-line arches nest: wider spans go higher, so arches never cross.
    const spans = pairs.map((pair) => {
      const from = box(pair.dataset.from);
      const to = box(pair.dataset.to);
      return { from, to, same: Math.abs(from.top - to.top) < 8, width: Math.abs(from.x - to.x) };
    });
    const sameLine = spans.filter((sp) => sp.same).sort((a, b) => a.width - b.width);
    pairs.forEach((pair, index) => {
      const { from, to } = spans[index];
      const group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("class", "adr-link");
      group.dataset.verdict = pair.dataset.verdict;
      const path = document.createElementNS(SVG_NS, "path");
      let mx;
      let my;
      if (Math.abs(from.top - to.top) < 8) {
        // Same line: an arch above the text, higher for each extra pair.
        const lift = 16 + sameLine.indexOf(spans[index]) * 14;
        const top = Math.min(from.top, to.top) - lift;
        path.setAttribute("d", `M${from.x} ${from.top} C ${from.x} ${top}, ${to.x} ${top}, ${to.x} ${to.top}`);
        mx = (from.x + to.x) / 2;
        my = 0.25 * from.top + 0.75 * top;
      } else {
        // Different lines: an S-curve through the gap between them.
        const [upper, lower] = from.top < to.top ? [from, to] : [to, from];
        const gap = (upper.bottom + lower.top) / 2;
        path.setAttribute("d", `M${upper.x} ${upper.bottom} C ${upper.x} ${gap}, ${lower.x} ${gap}, ${lower.x} ${lower.top}`);
        mx = (upper.x + lower.x) / 2;
        my = gap;
      }
      path.setAttribute("pathLength", "1");
      const badge = document.createElementNS(SVG_NS, "g");
      badge.setAttribute("class", "adr-link-badge");
      badge.setAttribute("transform", `translate(${mx} ${my})`);
      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("r", "8");
      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dy", "3.5");
      text.textContent = String(index + 1);
      badge.append(circle, text);
      group.append(path, badge);
      layer.append(group);
      pair.dataset.number = String(index + 1);
    });
  }

  function render({ announce = true, quiet = false } = {}) {
    demo.dataset.step = String(step);
    demo.classList.toggle("show-drugs", step >= 2);
    demo.classList.toggle("show-reactions", step >= 3);
    demo.classList.toggle("show-pairs", step >= 4);
    demo.classList.toggle("show-review", step >= 5);
    demo.classList.toggle("show-caution", step >= 6);
    examples.forEach((example, i) => {
      example.hidden = i !== current;
    });
    exampleButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === current)));
    stepButtons.forEach((button) => {
      const n = Number(button.dataset.goto);
      button.closest("li").classList.toggle("is-done", n < step);
      if (n === step) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    explanations.forEach((li) => {
      li.hidden = Number(li.dataset.for) !== step;
    });
    prev.disabled = step === 1;
    next.disabled = step === STEPS;
    if (quiet) return;
    drawLinks(examples[current]);
    if (announce) progress.textContent = `Step ${step} of ${STEPS}: ${TITLES[step - 1]}`;
    else progress.textContent = `Step ${step} of ${STEPS}`;
  }

  function go(target) {
    const nextStep = Math.min(STEPS, Math.max(1, target));
    const drawing = nextStep >= 4 && step < 4;
    step = nextStep;
    render();
    if (drawing && !reducedMotion()) {
      demo.classList.add("is-drawing");
      requestAnimationFrame(() => requestAnimationFrame(() => demo.classList.remove("is-drawing")));
    }
  }

  stepButtons.forEach((button) => button.addEventListener("click", () => go(Number(button.dataset.goto))));
  prev.addEventListener("click", () => go(step - 1));
  next.addEventListener("click", () => go(step + 1));
  demo.querySelector('[data-move="reset"]').addEventListener("click", () => {
    current = 0;
    go(1);
    exampleButtons[0].focus();
  });
  exampleButtons.forEach((button, i) =>
    button.addEventListener("click", () => {
      current = i;
      go(1);
    }),
  );

  // Arrow keys step through the pipeline while focus is inside the demo
  // (but never while a text field or other key-handling control has focus).
  demo.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(step + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(step - 1);
    }
  });

  // Size the illustration to the visible example and step. Keeping the
  // maximum height of all 18 states created a large blank area before
  // the Key on short steps; the controls already sit above changing content.
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      drawLinks(examples[current]);
    }, 100);
  });
  // Fonts settling can move the marks; redraw once everything has loaded.
  window.addEventListener("load", () => {
    drawLinks(examples[current]);
  });

  // First render without transitions, so the fully annotated no-JS state
  // does not visibly animate away on load.
  step = 1;
  demo.classList.add("is-settling");
  render({ announce: false });
  requestAnimationFrame(() => requestAnimationFrame(() => demo.classList.remove("is-settling")));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
