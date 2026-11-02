// "Explore my work": an optional workbench view of the published projects.
//
// The HTML is the data source: every project is an <li class="bench-item">
// with its full detail already in the page, so without JavaScript the page is
// a plain, filter-free list. This module adds a fixed (deterministic) 2D
// layout, pan and zoom, category filters, and a detail panel.
//
// Input model:
//   - Mouse/pen: drag the background to pan; Ctrl/⌘ + wheel (and trackpad
//     pinch, which browsers report the same way) zooms around the pointer.
//     A plain wheel is never captured, so page scrolling keeps working.
//   - Touch: horizontal drags pan (vertical swipes still scroll the page);
//     narrow screens start in the list view.
//   - Keyboard: every project is a normal button in reading order; focusing
//     one brings it into view, Enter opens it, Esc closes the panel and
//     returns focus. Zoom and reset are ordinary buttons.

import { Spring, frameLoop, reducedMotion } from "./motion.js";

const PLANE = { width: 1200, height: 820 };
const MIN_SCALE = 0.4;
const MAX_SCALE = 1.8;
const DRAG_THRESHOLD = 5;
const LABELS = {
  all: "all areas",
  ai: "AI & machine learning",
  apps: "Applications",
  systems: "Systems & developer tools",
  research: "Research",
  other: "Other experiments",
};

const numbers = (value) => value.trim().split(/\s+/).map(Number);
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

function init() {
  const bench = document.getElementById("bench");
  if (!bench) return;
  const viewport = bench.querySelector(".bench-viewport");
  const plane = bench.querySelector(".bench-plane");
  const panel = document.getElementById("bench-panel");
  const panelBody = panel.querySelector(".bench-panel-body");
  const panelTitle = panel.querySelector(".bench-panel-kicker");
  const status = document.getElementById("bench-status");
  const linkLayer = bench.querySelector(".bench-links");
  const items = Array.from(bench.querySelectorAll(".bench-item"));
  const zones = Array.from(bench.querySelectorAll(".bench-zone"));
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));

  document.body.classList.add("bench-ready");
  document.querySelector(".bench-view-controls").hidden = false;
  bench.querySelector(".bench-hint").hidden = false;

  /* ---------------- layout ---------------- */
  const byId = new Map(items.map((item) => [item.id, item]));
  items.forEach((item) => {
    const [x, y] = numbers(item.dataset.pos);
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;
    item.detail = item.querySelector(".bench-detail");
    item.button = item.querySelector(".bench-object");
    item.categories = item.dataset.categories.split(/\s+/);
  });
  zones.forEach((zone) => {
    const [x, y, w, h] = numbers(zone.dataset.box);
    Object.assign(zone.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  });

  const centerOf = (item) => ({
    x: item.offsetLeft + item.offsetWidth / 2,
    y: item.offsetTop + item.button.offsetHeight * 0.42,
  });

  const SVG_NS = "http://www.w3.org/2000/svg";
  const connections = [];
  function drawLinks() {
    linkLayer.replaceChildren();
    connections.length = 0;
    items.forEach((item) => {
      (item.dataset.links || "")
        .split("|")
        .filter(Boolean)
        .forEach((spec) => {
          const [id, label] = spec.split(":");
          const other = byId.get(id);
          if (!other) return;
          const a = centerOf(item);
          const b = centerOf(other);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2 - 36;
          const group = document.createElementNS(SVG_NS, "g");
          group.setAttribute("class", "bench-link");
          const path = document.createElementNS(SVG_NS, "path");
          path.setAttribute("d", `M${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`);
          const text = document.createElementNS(SVG_NS, "text");
          // Label at the curve's midpoint (t = 0.5 on the quadratic).
          text.setAttribute("x", String((a.x + 2 * mx + b.x) / 4));
          text.setAttribute("y", String((a.y + 2 * my + b.y) / 4 - 6));
          text.setAttribute("text-anchor", "middle");
          text.textContent = label;
          group.append(path, text);
          linkLayer.append(group);
          connections.push({ group, a: item.id, b: other.id });
        });
    });
  }

  /* ---------------- view transform ---------------- */
  const motion = { stiffness: 120, damping: 20 };
  const view = { x: new Spring(0, motion), y: new Spring(0, motion), s: new Spring(1, motion) };
  let listMode = false;

  function apply() {
    plane.style.transform = listMode
      ? ""
      : `translate(${view.x.value.toFixed(2)}px, ${view.y.value.toFixed(2)}px) scale(${view.s.value.toFixed(4)})`;
  }
  const loop = frameLoop((dt) => {
    let moving = false;
    for (const spring of Object.values(view)) moving = spring.step(dt) || moving;
    apply();
    return moving;
  });

  const size = () => ({ w: viewport.clientWidth, h: viewport.clientHeight });
  const panelOpen = () => !panel.hidden;
  const sidePanel = () => window.matchMedia("(min-width: 900px)").matches;
  const usableWidth = () => size().w - (panelOpen() && sidePanel() ? panel.offsetWidth + 24 : 0);
  const usableHeight = () => size().h - (panelOpen() && !sidePanel() ? panel.offsetHeight : 0);

  function bounded(x, y, s) {
    // Keep the plane's centre inside the viewport so it can never be lost.
    const { w, h } = size();
    const cx = clamp(x + (PLANE.width * s) / 2, 0, w);
    const cy = clamp(y + (PLANE.height * s) / 2, 0, h);
    return { x: cx - (PLANE.width * s) / 2, y: cy - (PLANE.height * s) / 2, s };
  }

  function moveTo(target, { instant = false } = {}) {
    const next = bounded(target.x, target.y, clamp(target.s, MIN_SCALE, MAX_SCALE));
    if (instant || reducedMotion()) {
      view.x.set(next.x);
      view.y.set(next.y);
      view.s.set(next.s);
      apply();
      return;
    }
    view.x.to(next.x);
    view.y.to(next.y);
    view.s.to(next.s);
    loop.start();
  }

  function fitTo(box, options) {
    const w = usableWidth();
    const h = usableHeight();
    const pad = 28;
    const s = clamp(Math.min((w - pad * 2) / box.w, (h - pad * 2) / box.h), MIN_SCALE, 1.25);
    moveTo({ x: (w - box.w * s) / 2 - box.x * s, y: (h - box.h * s) / 2 - box.y * s, s }, options);
  }

  function visibleBox() {
    const shown = items.filter((item) => !item.classList.contains("is-muted"));
    const list = shown.length ? shown : items;
    const xs = list.flatMap((item) => [item.offsetLeft, item.offsetLeft + item.offsetWidth]);
    const ys = list.flatMap((item) => [item.offsetTop, item.offsetTop + item.offsetHeight]);
    if (activeFilter === "all") return { x: 20, y: 20, w: PLANE.width - 40, h: PLANE.height - 40 };
    const x = Math.min(...xs) - 40;
    const y = Math.min(...ys) - 50;
    return { x, y, w: Math.max(...xs) + 40 - x, h: Math.max(...ys) + 30 - y };
  }

  function zoomBy(factor, px = size().w / 2, py = size().h / 2) {
    const s0 = view.s.target;
    const s1 = clamp(s0 * factor, MIN_SCALE, MAX_SCALE);
    const ratio = s1 / s0;
    moveTo({ x: px - (px - view.x.target) * ratio, y: py - (py - view.y.target) * ratio, s: s1 });
  }

  /* ---------------- selection ---------------- */
  let selected = null;

  function announce(message) {
    status.textContent = message;
  }

  function select(item, { focus = true, instant = false } = {}) {
    if (listMode) return;
    if (selected && selected !== item) restoreDetail(selected);
    selected = item;
    items.forEach((other) => {
      const on = other === item;
      other.classList.toggle("is-selected", on);
      other.button.setAttribute("aria-expanded", String(on));
    });
    panelBody.replaceChildren(item.detail);
    panelTitle.textContent = item.querySelector(".bench-label").textContent;
    panel.hidden = false;
    bench.classList.add("has-panel");
    connections.forEach(({ group, a, b }) => group.classList.toggle("is-lit", a === item.id || b === item.id));
    panel.querySelector(".bench-panel-body").scrollTop = 0;

    const c = centerOf(item);
    const s = clamp(Math.max(view.s.target, 1), MIN_SCALE, 1.15);
    moveTo({ x: usableWidth() / 2 - c.x * s, y: usableHeight() / 2 - c.y * s, s }, { instant });
    history.replaceState(null, "", `${location.pathname}${location.search}#${item.id}`);
    announce(`Showing ${panelTitle.textContent}.`);
    if (focus) panel.focus({ preventScroll: true });
  }

  function restoreDetail(item) {
    item.appendChild(item.detail);
  }

  function close({ focus = true } = {}) {
    if (!selected) return;
    const item = selected;
    restoreDetail(item);
    selected = null;
    panel.hidden = true;
    bench.classList.remove("has-panel");
    items.forEach((other) => {
      other.classList.remove("is-selected");
      other.button.setAttribute("aria-expanded", "false");
    });
    connections.forEach(({ group }) => group.classList.remove("is-lit"));
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    fitTo(visibleBox());
    announce("Back to the overview.");
    if (focus) item.button.focus({ preventScroll: true });
  }

  function step(direction) {
    const shown = items.filter((item) => !item.classList.contains("is-muted"));
    if (!shown.length) return;
    const index = shown.indexOf(selected);
    const next = shown[(index + direction + shown.length) % shown.length];
    select(next);
  }

  /* ---------------- filters and modes ---------------- */
  let activeFilter = "all";

  function filter(key, { instant = false, quiet = false } = {}) {
    if (!LABELS[key]) key = "all";
    activeFilter = key;
    filterButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === key)));
    let count = 0;
    items.forEach((item) => {
      const match = key === "all" || item.categories.includes(key);
      item.classList.toggle("is-muted", !match);
      item.inert = !match;
      if (match) count += 1;
    });
    zones.forEach((zone) => zone.classList.toggle("is-muted", key !== "all" && zone.dataset.zone !== key));
    connections.forEach(({ group, a, b }) =>
      group.classList.toggle("is-muted", key !== "all" && !(byId.get(a).categories.includes(key) && byId.get(b).categories.includes(key))),
    );
    const params = new URLSearchParams(location.search);
    if (key === "all") params.delete("filter");
    else params.set("filter", key);
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
    if (selected && selected.classList.contains("is-muted")) close({ focus: false });
    if (!listMode && !selected) fitTo(visibleBox(), { instant });
    if (!quiet) announce(key === "all" ? `Showing all ${count} entries.` : `Showing ${count} in ${LABELS[key]}.`);
  }

  function setMode(mode, { instant = false } = {}) {
    listMode = mode === "list";
    if (listMode) close({ focus: false });
    bench.classList.toggle("is-list", listMode);
    modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    document.querySelector(".bench-zoom").hidden = listMode;
    bench.querySelector(".bench-hint").hidden = listMode;
    items.forEach((item) => item.button.setAttribute("aria-expanded", "false"));
    apply();
    if (!listMode) {
      drawLinks();
      filter(activeFilter, { instant: true, quiet: true });
      fitTo(visibleBox(), { instant });
    }
  }

  /* ---------------- input ---------------- */
  items.forEach((item) => {
    item.button.addEventListener("click", (event) => {
      if (suppressClick) {
        event.preventDefault();
        suppressClick = false;
        return;
      }
      if (listMode) return;
      if (selected === item) close();
      else select(item);
    });
    item.button.addEventListener("focus", () => {
      if (listMode || selected) return;
      // Bring a keyboard-focused object into view without opening it.
      const rect = item.button.getBoundingClientRect();
      const frame = viewport.getBoundingClientRect();
      const inside = rect.left >= frame.left && rect.right <= frame.right && rect.top >= frame.top && rect.bottom <= frame.bottom;
      if (!inside) {
        const c = centerOf(item);
        const s = view.s.target;
        moveTo({ x: size().w / 2 - c.x * s, y: size().h / 2 - c.y * s, s });
      }
    });
  });

  panel.querySelector(".bench-close").addEventListener("click", () => close());
  panel.querySelectorAll("[data-step]").forEach((button) =>
    button.addEventListener("click", () => step(Number(button.dataset.step))),
  );
  filterButtons.forEach((button) => button.addEventListener("click", () => filter(button.dataset.filter)));
  modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  document.querySelectorAll("[data-zoom]").forEach((button) =>
    button.addEventListener("click", () => {
      const kind = button.dataset.zoom;
      if (kind === "in") zoomBy(1.25);
      else if (kind === "out") zoomBy(0.8);
      else {
        if (selected) close({ focus: false });
        fitTo(visibleBox());
        announce("View reset.");
      }
    }),
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && selected) {
      event.preventDefault();
      close();
    }
  });

  // Ctrl/⌘ + wheel (and trackpad pinch) zooms; a plain wheel scrolls the page.
  viewport.addEventListener(
    "wheel",
    (event) => {
      if (listMode || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const frame = viewport.getBoundingClientRect();
      zoomBy(Math.exp(-event.deltaY * 0.0022), event.clientX - frame.left, event.clientY - frame.top);
    },
    { passive: false },
  );

  let drag = null;
  let suppressClick = false;
  viewport.addEventListener("pointerdown", (event) => {
    if (listMode || event.button !== 0) return;
    if (event.target.closest(".bench-detail")) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, vx: view.x.value, vy: view.y.value, moved: false };
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add("is-dragging");
    }
    const next = bounded(drag.vx + dx, drag.vy + dy, view.s.value);
    view.x.set(next.x);
    view.y.set(next.y);
    view.s.set(view.s.value);
    apply();
  });
  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    if (drag.moved) suppressClick = true;
    drag = null;
    viewport.classList.remove("is-dragging");
    setTimeout(() => (suppressClick = false), 0);
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (listMode) return;
      if (selected) select(selected, { focus: false, instant: true });
      else fitTo(visibleBox(), { instant: true });
    }, 120);
  });

  /* ---------------- initial state from the URL ---------------- */
  const params = new URLSearchParams(location.search);
  const startMode = window.matchMedia("(max-width: 719px)").matches ? "list" : "bench";
  activeFilter = LABELS[params.get("filter")] ? params.get("filter") : "all";
  setMode(startMode, { instant: true });
  filter(activeFilter, { instant: true, quiet: true });
  const fromHash = byId.get(decodeURIComponent(location.hash.slice(1)));
  if (fromHash && !listMode && !fromHash.classList.contains("is-muted")) {
    select(fromHash, { focus: false, instant: true });
  }
  bench.classList.add("is-ready");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
