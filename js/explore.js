// "Explore my work": an optional workbench view of the published projects.
//
// The HTML is the data source: every project is an <li class="bench-item">
// with its full detail already in the page, so without JavaScript the page is
// a plain, filter-free list. This module adds a fixed (deterministic) 2D
// layout, pan and zoom, category filters, and a detail panel.
//
// State and history
//   The URL is the single source of truth: ?filter=<area>&view=<list|bench>
//   and #<project-id>. `render(state)` only draws; it never touches history.
//   User actions call `navigate()`, which writes one history entry and then
//   renders. `popstate` reads the URL and renders, so Back/Forward replay the
//   same states without creating new entries (no loops).
//     - Opening a project from the overview pushes an entry; Back closes it.
//     - Previous/Next or picking another project while one is open replaces
//       the entry, so a long browse is one Back away from the overview.
//     - Close/Esc on an entry this page pushed goes Back; on a deep link (or
//       any other entry) it replaces, so Back still leaves the page.
//     - Filter and view changes push entries.
//
// Input
//   - Mouse/pen: drag the background to pan; Ctrl/⌘ + wheel zooms around the
//     pointer (Chromium and Firefox also deliver trackpad pinch this way). A
//     plain wheel is never captured, so page scrolling keeps working.
//   - Touch: one-finger sideways drags pan, vertical swipes scroll the page
//     (touch-action: pan-y), two fingers pinch-zoom around their midpoint.
//     Narrow screens start in the list view.
//   - Keyboard: every project is a normal button in reading order; focusing
//     one brings it into view, Enter opens it, Esc closes the panel and
//     returns focus. Zoom and reset are ordinary buttons.

import { Spring, frameLoop, reducedMotion } from "./motion.js";

const PLANE = { width: 1200, height: 820 };
// Users can zoom out to see the whole bench on a phone; automatic fits stop
// at FIT_MIN so labels stay legible and the visitor pans for the rest.
const MIN_SCALE = 0.25;
const FIT_MIN = 0.4;
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
const overlaps = (a, b, pad = 0) =>
  a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

function init() {
  const bench = document.getElementById("bench");
  if (!bench) return;
  const viewport = bench.querySelector(".bench-viewport");
  const plane = bench.querySelector(".bench-plane");
  const panel = document.getElementById("bench-panel");
  const panelBody = panel.querySelector(".bench-panel-body");
  const panelTitle = panel.querySelector(".bench-panel-kicker");
  const status = document.getElementById("bench-status");
  const hint = bench.querySelector(".bench-hint");
  const linkLayer = bench.querySelector(".bench-links");
  const items = Array.from(bench.querySelectorAll(".bench-item"));
  const zones = Array.from(bench.querySelectorAll(".bench-zone"));
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
  const touchFirst = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  document.body.classList.add("bench-ready");
  document.querySelector(".bench-view-controls").hidden = false;
  hint.textContent = touchFirst
    ? "Swipe sideways to move around · pinch with two fingers or use + and − to zoom"
    : "Drag to move around · Ctrl or Cmd + scroll, or the + and − buttons, zoom · Esc closes a project";

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

  // Fragment navigation and keyboard focus can scroll an overflow:hidden box.
  // The view is positioned by transform only, so keep the box itself at 0,0.
  viewport.addEventListener("scroll", () => {
    viewport.scrollTop = 0;
    viewport.scrollLeft = 0;
  });

  const centerOf = (item) => ({
    x: item.offsetLeft + item.offsetWidth / 2,
    y: item.offsetTop + item.button.offsetHeight * 0.42,
  });
  const rectOf = (item) => ({ x: item.offsetLeft, y: item.offsetTop, w: item.offsetWidth, h: item.button.offsetHeight });
  // Zone captions sit on the zone's top border.
  const zoneCaption = (zone) => {
    const span = zone.querySelector("span");
    return { x: zone.offsetLeft + span.offsetLeft, y: zone.offsetTop + span.offsetTop, w: span.offsetWidth, h: span.offsetHeight };
  };

  const SVG_NS = "http://www.w3.org/2000/svg";
  const connections = [];
  /**
   * Draw connector curves. Lines run from card centre to card centre and are
   * hidden under the (opaque) cards; each label is placed at the first point
   * along its curve where its box clears every card, every zone caption and
   * every label already placed.
   */
  function drawLinks() {
    linkLayer.replaceChildren();
    connections.length = 0;
    const obstacles = [...items.map(rectOf), ...zones.map(zoneCaption)];
    const placed = [];
    const tries = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.2, 0.8];
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
          const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 36 };
          const group = document.createElementNS(SVG_NS, "g");
          group.setAttribute("class", "bench-link");
          const path = document.createElementNS(SVG_NS, "path");
          path.setAttribute("d", `M${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`);
          const text = document.createElementNS(SVG_NS, "text");
          text.setAttribute("text-anchor", "middle");
          text.setAttribute("dominant-baseline", "central");
          text.textContent = label;
          group.append(path, text);
          linkLayer.append(group);
          const at = (t) => ({
            x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
            y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
          });
          // Try one line, then the label split over two lines, at each point.
          const words = label.split(" ");
          const layouts = [[label]];
          if (words.length > 1) {
            const half = Math.ceil(words.length / 2);
            layouts.push([words.slice(0, half).join(" "), words.slice(half).join(" ")]);
          }
          const setLines = (lines, x, y) => {
            text.replaceChildren();
            lines.forEach((line, i) => {
              const span = document.createElementNS(SVG_NS, "tspan");
              span.setAttribute("x", x.toFixed(1));
              span.setAttribute("y", (y + (i - (lines.length - 1) / 2) * 14).toFixed(1));
              span.textContent = line;
              text.append(span);
            });
          };
          let chosen = null;
          for (const lines of layouts) {
            setLines(lines, 0, 0);
            const box = text.getBBox();
            const w = box.width + 8;
            const h = box.height + 4;
            for (const t of tries) {
              const p = at(t);
              const r = { x: p.x - w / 2, y: p.y - h / 2, w, h };
              if (!obstacles.some((o) => overlaps(r, o, 4)) && !placed.some((o) => overlaps(r, o, 4))) {
                chosen = { lines, p, r };
                break;
              }
            }
            if (chosen) break;
          }
          if (!chosen) {
            setLines([label], 0, 0);
            const box = text.getBBox();
            const p = at(0.5);
            chosen = { lines: [label], p, r: { x: p.x - box.width / 2, y: p.y - box.height / 2, w: box.width, h: box.height } };
          }
          setLines(chosen.lines, chosen.p.x, chosen.p.y);
          placed.push(chosen.r);
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
    // Keep the viewport's centre over the plane, so the bench can never be
    // lost but any point on it (even a corner card on a phone) can be centred.
    const { w, h } = size();
    return {
      x: clamp(x, w / 2 - PLANE.width * s, w / 2),
      y: clamp(y, h / 2 - PLANE.height * s, h / 2),
      s,
    };
  }

  function setNow(next) {
    view.x.set(next.x);
    view.y.set(next.y);
    view.s.set(next.s);
    apply();
  }

  function moveTo(target, { instant = false } = {}) {
    const next = bounded(target.x, target.y, clamp(target.s, MIN_SCALE, MAX_SCALE));
    if (instant || reducedMotion()) {
      setNow(next);
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
    const s = clamp(Math.min((w - pad * 2) / box.w, (h - pad * 2) / box.h), FIT_MIN, 1.25);
    moveTo({ x: (w - box.w * s) / 2 - box.x * s, y: (h - box.h * s) / 2 - box.y * s, s }, options);
  }

  function visibleBox() {
    if (current.filter === "all") return { x: 20, y: 20, w: PLANE.width - 40, h: PLANE.height - 40 };
    const shown = items.filter((item) => !item.classList.contains("is-muted"));
    const list = shown.length ? shown : items;
    const xs = list.flatMap((item) => [item.offsetLeft, item.offsetLeft + item.offsetWidth]);
    const ys = list.flatMap((item) => [item.offsetTop, item.offsetTop + item.offsetHeight]);
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

  /* ---------------- drawing a state (no history writes) ---------------- */
  let current = { filter: null, mode: null, id: null };
  let selected = null;

  const announce = (message) => {
    status.textContent = message;
  };
  const matches = (item, key) => key === "all" || item.categories.includes(key);
  const defaultMode = () => (window.matchMedia("(max-width: 719px)").matches ? "list" : "bench");

  function applyMode(mode) {
    listMode = mode === "list";
    bench.classList.toggle("is-list", listMode);
    modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    document.querySelector(".bench-zoom").hidden = listMode;
    hint.hidden = listMode;
    apply();
    if (!listMode) drawLinks();
  }

  function applyFilter(key) {
    filterButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === key)));
    items.forEach((item) => {
      const match = matches(item, key);
      item.classList.toggle("is-muted", !match);
      item.inert = !match;
    });
    zones.forEach((zone) => zone.classList.toggle("is-muted", key !== "all" && zone.dataset.zone !== key));
    connections.forEach(({ group, a, b }) =>
      group.classList.toggle("is-muted", key !== "all" && !(matches(byId.get(a), key) && matches(byId.get(b), key))),
    );
  }

  function openPanel(item, { focus, instant }) {
    if (selected && selected !== item) selected.appendChild(selected.detail);
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
    panelBody.scrollTop = 0;
    const c = centerOf(item);
    const s = clamp(Math.max(view.s.target, 1), FIT_MIN, 1.15);
    moveTo({ x: usableWidth() / 2 - c.x * s, y: usableHeight() / 2 - c.y * s, s }, { instant });
    if (focus) panel.focus({ preventScroll: true });
  }

  function closePanel({ focus }) {
    if (!selected) return;
    const item = selected;
    // If focus is inside the panel it would be lost when the panel hides.
    const hadFocus = panel.contains(document.activeElement);
    item.appendChild(item.detail);
    selected = null;
    panel.hidden = true;
    bench.classList.remove("has-panel");
    items.forEach((other) => {
      other.classList.remove("is-selected");
      other.button.setAttribute("aria-expanded", "false");
    });
    connections.forEach(({ group }) => group.classList.remove("is-lit"));
    if ((focus || hadFocus) && !listMode) item.button.focus({ preventScroll: true });
  }

  /** Bring the page to `next`. Idempotent: rendering the same state twice is a no-op. */
  function render(next, { focus = false, instant = false } = {}) {
    const modeChanged = next.mode !== current.mode;
    const filterChanged = next.filter !== current.filter;
    if (modeChanged) applyMode(next.mode);
    if (filterChanged || modeChanged) applyFilter(next.filter);
    const target = !listMode && next.id ? byId.get(next.id) : null;
    const wasOpen = Boolean(selected);
    current = next;
    if (target) {
      if (selected !== target || modeChanged) openPanel(target, { focus, instant });
    } else {
      if (selected) closePanel({ focus });
      if (!listMode && (wasOpen || filterChanged || modeChanged)) fitTo(visibleBox(), { instant });
    }
  }

  /* ---------------- URL <-> state ---------------- */
  function readURL() {
    const params = new URLSearchParams(location.search);
    const filter = LABELS[params.get("filter")] ? params.get("filter") : "all";
    const view = params.get("view");
    const mode = view === "list" || view === "bench" ? view : defaultMode();
    const item = byId.get(decodeURIComponent(location.hash.slice(1)));
    return normalize({ filter, mode, id: item ? item.id : null });
  }

  // A project hidden by the filter cannot stay selected.
  const normalize = (s) => (s.id && !matches(byId.get(s.id), s.filter) ? { ...s, id: null } : s);

  function urlFor(s) {
    const params = new URLSearchParams(location.search);
    if (s.filter === "all") params.delete("filter");
    else params.set("filter", s.filter);
    if (s.mode === defaultMode()) params.delete("view");
    else params.set("view", s.mode);
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ""}${s.id ? `#${s.id}` : ""}`;
  }
  const here = () => `${location.pathname}${location.search}${location.hash}`;

  function navigate(patch, { replace = false, focus = true } = {}) {
    const next = normalize({ ...current, ...patch });
    const url = urlFor(next);
    if (url !== here()) {
      if (replace) history.replaceState({ ...(history.state || {}), explore: true }, "", url);
      else history.pushState({ explore: true, opened: Boolean(next.id && !current.id) }, "", url);
    }
    render(next, { focus });
  }

  function requestClose() {
    if (!selected) return;
    if (history.state && history.state.explore && history.state.opened) {
      // This page pushed the "open" entry: undo it instead of stacking another.
      history.back();
      return;
    }
    navigate({ id: null }, { replace: true });
    announce("Back to the overview.");
  }

  window.addEventListener("popstate", () => {
    const next = readURL();
    const was = current;
    render(next, { focus: false });
    if (next.id && next.id !== was.id && !listMode) announce(`Showing ${byId.get(next.id).querySelector(".bench-label").textContent}.`);
    else if (!next.id && was.id) announce("Back to the overview.");
    else if (next.filter !== was.filter) announce(next.filter === "all" ? "Showing all areas." : `Showing ${LABELS[next.filter]}.`);
    else if (next.mode !== was.mode) announce(next.mode === "list" ? "List view." : "Workbench view.");
  });

  /* ---------------- actions ---------------- */
  function choose(item) {
    if (listMode) return;
    if (selected === item) {
      requestClose();
      return;
    }
    navigate({ id: item.id }, { replace: Boolean(selected) });
    announce(`Showing ${item.querySelector(".bench-label").textContent}.`);
  }

  function step(direction) {
    const shown = items.filter((item) => !item.classList.contains("is-muted"));
    if (!shown.length) return;
    const index = shown.indexOf(selected);
    choose(shown[(index + direction + shown.length) % shown.length]);
  }

  /* ---------------- input ---------------- */
  let suppressClick = false;
  items.forEach((item) => {
    item.button.addEventListener("click", (event) => {
      if (suppressClick) {
        event.preventDefault();
        suppressClick = false;
        return;
      }
      choose(item);
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

  panel.querySelector(".bench-close").addEventListener("click", () => requestClose());
  panel.querySelectorAll("[data-step]").forEach((button) =>
    button.addEventListener("click", () => step(Number(button.dataset.step))),
  );
  filterButtons.forEach((button) =>
    button.addEventListener("click", () => {
      const key = button.dataset.filter;
      navigate({ filter: key }, { focus: false });
      const count = items.filter((item) => matches(item, key)).length;
      announce(key === "all" ? `Showing all ${count} entries.` : `Showing ${count} in ${LABELS[key]}.`);
    }),
  );
  modeButtons.forEach((button) =>
    button.addEventListener("click", () => {
      navigate({ mode: button.dataset.mode }, { focus: false });
      announce(button.dataset.mode === "list" ? "List view." : "Workbench view.");
    }),
  );
  document.querySelectorAll("[data-zoom]").forEach((button) =>
    button.addEventListener("click", () => {
      const kind = button.dataset.zoom;
      if (kind === "in") zoomBy(1.25);
      else if (kind === "out") zoomBy(0.8);
      else if (selected) requestClose();
      else {
        fitTo(visibleBox());
        announce("View reset.");
      }
    }),
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && selected) {
      event.preventDefault();
      requestClose();
    }
  });

  // Ctrl/⌘ + wheel zooms; a plain wheel scrolls the page.
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

  // One pointer drags; two touch/pen pointers pinch. A gesture that moved
  // suppresses the click it would otherwise end with.
  const pointers = new Map();
  let gesture = null;
  const local = (event) => {
    const frame = viewport.getBoundingClientRect();
    return { x: event.clientX - frame.left, y: event.clientY - frame.top };
  };
  function startPinch() {
    const [p, q] = Array.from(pointers.values());
    gesture = {
      type: "pinch",
      d0: Math.max(1, Math.hypot(q.x - p.x, q.y - p.y)),
      m0: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 },
      s0: view.s.value,
      x0: view.x.value,
      y0: view.y.value,
    };
    pointers.forEach((_, id) => {
      try {
        viewport.setPointerCapture(id);
      } catch {
        /* pointer already gone */
      }
    });
    viewport.classList.add("is-dragging");
    suppressClick = true;
  }
  viewport.addEventListener("pointerdown", (event) => {
    if (listMode || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (event.target.closest(".bench-detail")) return;
    pointers.set(event.pointerId, local(event));
    if (pointers.size === 1) {
      gesture = { type: "drag", id: event.pointerId, start: local(event), x0: view.x.value, y0: view.y.value, moved: false };
    } else if (pointers.size === 2 && event.pointerType !== "mouse") {
      startPinch();
    }
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, local(event));
    if (gesture.type === "drag") {
      if (event.pointerId !== gesture.id) return;
      const p = local(event);
      const dx = p.x - gesture.start.x;
      const dy = p.y - gesture.start.y;
      if (!gesture.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!gesture.moved) {
        gesture.moved = true;
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add("is-dragging");
      }
      setNow(bounded(gesture.x0 + dx, gesture.y0 + dy, view.s.value));
    } else if (pointers.size >= 2) {
      const [p, q] = Array.from(pointers.values());
      const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
      const s = clamp((gesture.s0 * Math.hypot(q.x - p.x, q.y - p.y)) / gesture.d0, MIN_SCALE, MAX_SCALE);
      // Keep the plane point that was under the starting midpoint under the fingers.
      const px = (gesture.m0.x - gesture.x0) / gesture.s0;
      const py = (gesture.m0.y - gesture.y0) / gesture.s0;
      setNow(bounded(m.x - px * s, m.y - py * s, s));
    }
  });
  const endPointer = (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    if (!gesture) return;
    // pointercancel on a one-finger drag means the browser took the gesture
    // as a vertical page scroll: undo the few pixels panned before it did.
    if (event.type === "pointercancel" && gesture.type === "drag" && gesture.moved) {
      setNow(bounded(gesture.x0, gesture.y0, view.s.value));
    }
    if (gesture.type === "drag" && event.pointerId === gesture.id) {
      if (gesture.moved) suppressClick = true;
      gesture = null;
    } else if (gesture.type === "pinch" && pointers.size < 2) {
      // Do not turn the remaining finger into a drag: that would jump.
      gesture = null;
    }
    if (!gesture) {
      viewport.classList.remove("is-dragging");
      setTimeout(() => (suppressClick = false), 0);
    }
  };
  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (listMode) return;
      if (selected) openPanel(selected, { focus: false, instant: true });
      else fitTo(visibleBox(), { instant: true });
    }, 120);
  });

  /* ---------------- initial state from the URL ---------------- */
  const initial = readURL();
  render(initial, { instant: true });
  // Normalize the address (drop unknown filters or a hidden project) without a new entry.
  if (urlFor(initial) !== here()) history.replaceState({ explore: true, opened: false }, "", urlFor(initial));
  else if (!history.state || !history.state.explore) history.replaceState({ ...(history.state || {}), explore: true }, "", here());
  bench.classList.add("is-ready");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
