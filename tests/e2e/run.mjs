#!/usr/bin/env node
// Portfolio V3 browser regression tests. Zero dependencies (Node 22+ and a
// local Chrome/Chromium). Usage:
//
//   node tests/e2e/run.mjs                # all suites
//   node tests/e2e/run.mjs home explore   # selected suites
//   CHROME_PATH=/path/to/chrome node tests/e2e/run.mjs
//   SCREENSHOTS=1 node tests/e2e/run.mjs  # also write docs/portfolio-v3/screenshots/
//
// Exit code 1 if any check fails.

import { mkdirSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "./lib/browser.mjs";
import { serve } from "./lib/server.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SHOTS = join(ROOT, "docs", "portfolio-v3", "screenshots");
const WIDTHS = [1440, 1024, 768, 390, 320];

const results = [];
let failures = 0;
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failures += 1;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const server = await serve(ROOT);
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const page = await launch();
const requests = [];
page.on("Network.requestWillBeSent", (p) => requests.push(p.request.url));

async function open(path, { width = 1440, height = 900, touch = false, reduced = false } = {}) {
  await page.viewport(width, height, { mobile: touch, touch });
  await page.media({ "prefers-reduced-motion": reduced ? "reduce" : "no-preference" });
  requests.length = 0;
  await page.goto(`${ORIGIN}${path}`);
}
const until = async (fn, timeout = 3000, ...args) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await page.eval(fn, ...args)) return true;
    await page.wait(50);
  }
  return false;
};
async function shot(name, full = false) {
  if (!process.env.SCREENSHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(join(SHOTS, `${name}.png`), await page.screenshot(full));
}
const overflow = () =>
  page.eval(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/* ------------------------------------------------------------------ */
const suites = {
  async routes() {
    const pages = [
      "/", "/explore/", "/notebook/", "/notebook/adr-extraction-demo/", "/blog/", "/404.html",
      ...readdirSync(join(ROOT, "projects")).map((p) => `/projects/${p}/`),
      ...readdirSync(join(ROOT, "blog"))
        .filter((p) => existsSync(join(ROOT, "blog", p, "index.html")) && p !== "hello-world")
        .map((p) => `/blog/${p}/`),
    ];
    for (const path of pages) {
      for (const width of WIDTHS) {
        await open(path, { width, touch: width < 720 });
        const over = await overflow();
        if (width === 1440 || over > 0) check(`${path} @${width}: no horizontal overflow`, over <= 0, `${over}px`);
        if (page.errors.length) check(`${path} @${width}: no console errors`, false, page.errors.join("; "));
      }
      check(`${path}: loads without console errors`, page.errors.length === 0, page.errors.join("; "));
    }
    // Ordinary pages must not load the V3 homepage or explorer modules.
    await open("/blog/80-percent-sleep/");
    check("blog post loads no V3 interaction modules", !requests.some((u) => /\/js\/(home|explore|hero-icons|project-previews)/.test(u)));
    await open("/projects/clage/");
    check("case study keeps its own video with controls and preload=none", await page.eval(() => {
      const v = document.querySelector("video.project-video");
      return Boolean(v && v.controls && v.preload === "none");
    }));
  },

  async home() {
    await open("/");
    await shot("home-desktop-1440");
    check("homepage: no console errors", page.errors.length === 0, page.errors.join("; "));
    const facts = await page.eval(() => {
      const text = document.body.innerText;
      return {
        availability: text.includes("Looking for Summer 2027 software engineering and AI/ML internships."),
        pennState: text.includes("Computer science · Penn State · Class of 2028"),
        noPausedLabel: !/Development paused/.test(document.querySelector("#projects").innerText),
        nytrLessons: Boolean(document.querySelector('#projects a[href="/blog/why-i-stopped-working-on-nytr-problems-and-lessons/"]')),
        threePosts: document.querySelectorAll("#blog .post-row").length === 3 && Boolean(document.querySelector('#blog a[href="/blog/"]')),
        noPreviewCaptions: !document.querySelector(".preview-caption") && !/Diagram, not|muted/.test(document.querySelector("#projects").innerText),
        pyopt: text.includes("13 of the 40 test prompts leaked from training"),
        contacts: ["mailto:utkarshsonawane@psu.edu", "https://github.com/sonawaneutkarsh", "https://www.linkedin.com/in/sonawaneutkarsh/", "/resume.pdf"].every((h) =>
          document.querySelector(`a[href="${h}"]`),
        ),
        ids: ["hero", "updates", "projects", "research", "experience", "blog"].every((id) => document.getElementById(id)),
        explore: Boolean(document.querySelector('#projects a[href="/explore/"]')),
        demo: Boolean(document.querySelector('#research a[href="/notebook/adr-extraction-demo/"]')),
      };
    });
    for (const [key, ok] of Object.entries(facts)) check(`homepage keeps ${key}`, ok);

    const icons = await page.eval(() =>
      Array.from(document.querySelectorAll("[data-hero-icon]")).map((a) => [a.dataset.heroIcon, a.getAttribute("href"), a.textContent.trim()]),
    );
    check("three hero icon links with real destinations", icons.length === 3 && icons.every(([, href]) => href && href !== "#"), JSON.stringify(icons));

    check("homepage requests no demo video", !requests.some((u) => u.endsWith(".mp4")));

    // Hero icon: hover lights it, the margin figure shows, the text does not move.
    const before = await page.eval(() => {
      const r = document.querySelector(".hero-lede").getBoundingClientRect();
      return [r.top, r.height, document.querySelector(".bio").getBoundingClientRect().height];
    });
    await page.hover('[data-hero-icon="ai"] .hero-word');
    check("AI icon lights on hover", await until(() => document.querySelector('[data-hero-icon="ai"]').classList.contains("is-lit")));
    check("pop card shows the lit icon", await until(() => document.querySelector(".hero-pop").classList.contains("is-showing")));
    await page.wait(900);
    const pop = await page.eval(() => {
      const card = document.querySelector(".hero-pop").getBoundingClientRect();
      const art = document.querySelector(".intro-art").getBoundingClientRect();
      const bio = document.querySelector(".bio").getBoundingClientRect();
      const icons = Array.from(document.querySelectorAll(".hero-link:not(.is-lit) .hero-icon")).map((e) => e.getBoundingClientRect());
      const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      return { side: document.querySelector(".hero-pop").dataset.side, coversArt: hit(card, art), coversIcon: icons.some((i) => hit(card, i)), rightOfText: card.left >= bio.right, inView: card.right <= document.documentElement.clientWidth };
    });
    check("pop card opens to the right of the text at 1440 and covers neither the notebook nor other icons", pop.side === "right" && pop.rightOfText && !pop.coversArt && !pop.coversIcon && pop.inView, JSON.stringify(pop));
    const during = await page.eval(() => {
      const r = document.querySelector(".hero-lede").getBoundingClientRect();
      return [r.top, r.height, document.querySelector(".bio").getBoundingClientRect().height];
    });
    check("hero text does not shift while an icon animates", JSON.stringify(before) === JSON.stringify(during), `${before} vs ${during}`);
    await shot("home-icon-ai-mid");
    check("AI icon reorganizes into the agent loop", await until(() => Number(document.querySelector('[data-hero-icon="ai"] .a-loop').getAttribute("opacity")) > 0.8, 2500));
    await shot("home-icon-ai-final");
    await page.mouseMove(5, 880);
    check("AI icon dims when the pointer leaves", await until(() => !document.querySelector('[data-hero-icon="ai"]').classList.contains("is-lit")));
    check("pop card springs back into the icon and hides", await until(() => !document.querySelector(".hero-pop").classList.contains("is-showing"), 2000));
    check("animation loop goes idle after settling", await until(() => Number(document.querySelector('[data-hero-icon="ai"] .a-loop').getAttribute("opacity")) === 0, 3000));

    await page.hover('[data-hero-icon="software"] .hero-word');
    check("software icon shows the confirmation mark", await until(() => Number(document.querySelector('[data-hero-icon="software"] .b-check').getAttribute("opacity")) > 0.5, 2500));
    await shot("home-icon-software");
    check("software icon returns to rest by itself", await until(() => Number(document.querySelector('[data-hero-icon="software"] .b-phone').getAttribute("opacity")) < 0.05, 4000));
    await page.hover('[data-hero-icon="research"] .hero-word');
    check("research icon shows the review mark", await until(() => Number(document.querySelector('[data-hero-icon="research"] .c-badge').getAttribute("opacity")) > 0.5, 2500));
    await shot("home-icon-research");
    await page.mouseMove(5, 880);

    // Keyboard focus lights an icon and shows a focus ring.
    await page.eval(() => document.querySelector('[data-hero-icon="software"]').focus());
    check("keyboard focus lights the software icon", await until(() => document.querySelector('[data-hero-icon="software"]').classList.contains("is-lit")));
    await page.eval(() => document.activeElement.blur());

    // Project previews.
    await page.hover(".project-row:nth-of-type(3) h3 a");
    check("Talks preview activates on row hover", await until(() => document.querySelector('[data-name="Talks"]').classList.contains("is-active")));
    check("Talks diagram is drawn", await page.eval(() => Boolean(document.querySelector('[data-name="Talks"] .preview-diagram'))));
    await page.wait(1800);
    await shot("home-preview-talks");
    await page.hover(".project-row:nth-of-type(4) h3 a");
    check("moving to Devvy deactivates Talks (one preview at a time)", await until(() => !document.querySelector('[data-name="Talks"]').classList.contains("is-active") && document.querySelector('[data-name="Devvy"]').classList.contains("is-active")));
    await page.wait(1200);
    await shot("home-preview-devvy");
    for (const [n, name] of [[1, "Nytr"], [2, "Clage"]]) {
      await page.hover(`.project-row:nth-of-type(${n}) h3 a`);
      check(`${name} hover animates its drawing (no video)`, await until((nm) => {
        const m = document.querySelector(`[data-name="${nm}"]`);
        return m.classList.contains("is-active") && m.querySelector(".preview-diagram") && !m.querySelector("video");
      }, 2000, name));
      await page.wait(1600);
      await shot(`home-preview-${name.toLowerCase()}`);
    }
    check("Nytr drawing fills its ring", await page.eval(() => parseFloat(document.querySelector('[data-name="Nytr"] .n-ring').getAttribute("stroke-dasharray")) >= 0));
    await page.mouseMove(5, 5);
    check("frame springs settle back to rest after the pointer leaves", await until(() => {
      const m = document.querySelector('[data-name="Clage"]');
      return !m.classList.contains("is-active") && Number(m.style.getPropertyValue("--p")) === 0 && Number(m.style.getPropertyValue("--lift")) === 0;
    }, 3000));
    await page.click('[data-name="Clage"] .preview-toggle');
    check("Clage button toggles aria-pressed", await until(() => document.querySelector('[data-name="Clage"] .preview-toggle').getAttribute("aria-pressed") === "true"));
    await page.click('[data-name="Clage"] .preview-toggle');
    check("second press stops Clage", await until(() => !document.querySelector('[data-name="Clage"]').classList.contains("is-active")));

    // Reduced motion: no hover autoplay; icons snap to a still.
    await open("/", { reduced: true });
    await page.hover(".project-row:nth-of-type(1) h3 a");
    await page.wait(500);
    check("reduced motion: hover does not start an animation", await page.eval(() => !document.querySelector('[data-name="Nytr"]').classList.contains("is-active")));
    await page.hover('[data-hero-icon="ai"] .hero-word');
    check("reduced motion: icon jumps straight to its final still", await until(() => Number(document.querySelector('[data-hero-icon="ai"] .a-loop').getAttribute("opacity")) > 0.9, 150));
    check("reduced motion: section reveal does not hide content", await page.eval(() => !document.querySelector(".is-pending")));

    // Mobile/touch.
    for (const width of [390, 320]) {
      await open("/", { width, height: 844, touch: true });
      await shot(`home-mobile-${width}`);
      check(`mobile ${width}: no overflow`, (await overflow()) <= 0);
      check(`mobile ${width}: no pop card`, await page.eval(() => getComputedStyle(document.querySelector(".hero-pop")).display === "none"));
    }
    await open("/", { width: 390, height: 844, touch: true });
    check("touch: hero icons play a one-time tour", await until(() => document.querySelector(".hero-link.is-lit"), 2500));
    check("touch: preview chip is visible without hover", await page.eval(() => getComputedStyle(document.querySelector(".preview-chip")).opacity === "1"));
    await page.tap('[data-name="Talks"] .preview-toggle');
    check("touch: tapping a preview frame starts it", await until(() => document.querySelector('[data-name="Talks"]').classList.contains("is-active")));
    await page.tap('[data-hero-icon="research"] .hero-word');
    check("touch: a single tap on a hero link navigates", await until(() => location.hash === "#research"));

    await open("/", { width: 1440, height: 900 });
    await shot("home-full-desktop", true);
  },

  async explore() {
    await open("/explore/");
    await page.eval(() => document.getElementById("bench").scrollIntoView({ behavior: "instant" }));
    await page.wait(200);
    await shot("explore-desktop-overview");
    check("explore: no console errors", page.errors.length === 0, page.errors.join("; "));
    const state = await page.eval(() => ({
      ready: document.body.classList.contains("bench-ready"),
      items: document.querySelectorAll(".bench-item").length,
      links: document.querySelectorAll(".bench-link").length,
      panelHidden: document.getElementById("bench-panel").hidden,
    }));
    check("explore: workbench enhances with all 8 entries and connections", state.ready && state.items === 8 && state.links >= 4, JSON.stringify(state));
    check("explore: all project objects are inside the initial view", await page.eval(() => {
      const frame = document.querySelector(".bench-viewport").getBoundingClientRect();
      return Array.from(document.querySelectorAll(".bench-object")).every((b) => {
        const r = b.getBoundingClientRect();
        return r.left >= frame.left - 1 && r.right <= frame.right + 1 && r.top >= frame.top - 1 && r.bottom <= frame.bottom + 1;
      });
    }));

    await page.click("#clage .bench-object");
    check("explore: selecting opens the detail panel", await until(() => !document.getElementById("bench-panel").hidden));
    const panel = await page.eval(() => ({
      title: document.querySelector("#bench-panel .bench-title").textContent.trim(),
      hash: location.hash,
      focus: document.activeElement.id,
      expanded: document.querySelector("#clage .bench-object").getAttribute("aria-expanded"),
      caseStudy: Boolean(document.querySelector('#bench-panel a[href="/projects/clage/"]')),
      evidence: document.querySelector("#bench-panel").innerText.includes("sine 0/5 with minimal initialization"),
    }));
    check("explore: panel shows Clage facts and case-study link", panel.title === "Clage" && panel.caseStudy && panel.evidence, JSON.stringify(panel));
    check("explore: selection updates the URL hash and aria-expanded", panel.hash === "#clage" && panel.expanded === "true");
    check("explore: focus moves to the panel", panel.focus === "bench-panel");
    await page.wait(700);
    await shot("explore-desktop-selected");
    await page.click('#bench-panel [data-step="1"]');
    check("explore: Next moves to the following project", await until(() => document.querySelector("#bench-panel .bench-title").textContent.trim() === "PyOpt"));
    check("explore: PyOpt caveat travels with it", await page.eval(() => document.getElementById("bench-panel").innerText.includes("not a clean held-out result")));
    await page.key("Escape");
    check("explore: Esc closes the panel and restores focus", await until(() => document.getElementById("bench-panel").hidden && document.activeElement === document.querySelector("#pyopt .bench-object")));
    check("explore: closing clears the hash", await page.eval(() => location.hash === ""));

    await page.click('[data-filter="ai"]');
    const filtered = await page.eval(() => ({
      shown: Array.from(document.querySelectorAll(".bench-item:not(.is-muted)")).map((i) => i.id).sort(),
      inert: Array.from(document.querySelectorAll(".bench-item.is-muted")).every((i) => i.inert),
      query: location.search,
    }));
    check("explore: AI filter shows Clage, MedClarity and PyOpt", JSON.stringify(filtered.shown) === JSON.stringify(["clage", "medclarity", "pyopt"]), JSON.stringify(filtered));
    check("explore: filtered-out entries leave the tab order", filtered.inert);
    check("explore: filter is reflected in the URL", filtered.query === "?filter=ai");
    await page.wait(600);
    await shot("explore-desktop-filter-ai");
    await page.click('[data-filter="all"]');
    await page.wait(1200);

    const transform = () => page.eval(() => document.querySelector(".bench-plane").style.transform);
    const t0 = await transform();
    await page.click('[data-zoom="in"]');
    await page.wait(900);
    const t1 = await transform();
    check("explore: zoom in changes scale", t0 !== t1 && /scale\(/.test(t1), `${t0} → ${t1}`);
    await page.click('[data-zoom="reset"]');
    await page.wait(900);
    const nums = (t) => (t.match(/-?\d+(\.\d+)?/g) || []).map(Number);
    const t2 = await transform();
    check("explore: reset returns to the overview", nums(t2).every((n, i) => Math.abs(n - nums(t0)[i]) < 0.5), `${t2} vs ${t0}`);

    const frame = await page.box(".bench-viewport");
    await page.drag({ x: frame.x - 200, y: frame.y + 220 }, { x: frame.x - 60, y: frame.y + 170 });
    await page.wait(100);
    check("explore: dragging the background pans", (await transform()) !== t0);
    check("explore: a drag does not open a project", await page.eval(() => document.getElementById("bench-panel").hidden));

    const scrollBefore = await page.eval(() => scrollY);
    await page.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: frame.x, y: frame.y, deltaX: 0, deltaY: 300 });
    await page.wait(400);
    check("explore: a plain wheel still scrolls the page", (await page.eval(() => scrollY)) > scrollBefore);

    // Keyboard-only path.
    await page.eval(() => document.querySelector('[data-filter="all"]').focus());
    let reached = false;
    for (let i = 0; i < 20 && !reached; i++) {
      await page.key("Tab");
      reached = await page.eval(() => document.activeElement && document.activeElement.closest("#devvy") !== null);
    }
    check("explore: Tab reaches project objects", reached);
    await page.key("Enter");
    check("explore: Enter opens the focused project", await until(() => document.querySelector("#bench-panel .bench-title")?.textContent.trim() === "Devvy"));
    await page.key("Escape");

    await open("/explore/?filter=ai#pyopt");
    await page.wait(900); // let the fragment's smooth scroll finish
    check("explore: deep link opens the filtered project", await until(() => !document.getElementById("bench-panel").hidden && document.querySelector("#bench-panel .bench-title").textContent.trim() === "PyOpt"));

    await page.click('[data-mode="list"]');
    check("explore: list view shows every detail inline", await until(() => document.querySelectorAll(".bench-item > .bench-detail").length === 8 && document.getElementById("bench").classList.contains("is-list")));

    for (const width of [1024, 900, 768]) {
      await open("/explore/", { width });
      check(`explore ${width}: no overflow`, (await overflow()) <= 0);
      await page.eval(() => document.getElementById("bench").scrollIntoView({ behavior: "instant" }));
      await shot(`explore-${width}`);
    }
    for (const width of [390, 320]) {
      await open("/explore/", { width, height: 844, touch: true });
      check(`explore ${width}: starts in list view`, await page.eval(() => document.getElementById("bench").classList.contains("is-list")));
      check(`explore ${width}: no overflow`, (await overflow()) <= 0);
      await shot(`explore-mobile-${width}`);
    }
  },

  /* Back/Forward: every user-visible state is one history entry, popstate
     replays it, and nothing pushes during replay. */
  async history() {
    const st = () =>
      page.eval(() => ({
        len: history.length,
        url: location.pathname + location.search + location.hash,
        open: Boolean(document.getElementById("bench-panel") && !document.getElementById("bench-panel").hidden),
        title: document.querySelector("#bench-panel .bench-title")?.textContent.trim() || null,
        filter: document.querySelector('[data-filter][aria-pressed="true"]')?.dataset.filter || null,
        list: Boolean(document.getElementById("bench")?.classList.contains("is-list")),
      }));
    const back = async () => {
      await page.eval(() => history.back());
      await page.wait(350);
      return st();
    };
    const fwd = async () => {
      await page.eval(() => history.forward());
      await page.wait(350);
      return st();
    };

    // Arrive from another page, so Back can also leave the explorer.
    await open("/");
    await page.navigateBy(() => {
      location.href = "/explore/";
    });
    const start = await st();
    check("history: initial load adds no extra entry", start.url === "/explore/" && !start.open, JSON.stringify(start));

    await page.click("#clage .bench-object");
    await page.wait(200);
    const opened = await st();
    check("history: opening a project pushes one entry", opened.len === start.len + 1 && opened.url === "/explore/#clage", JSON.stringify(opened));
    await page.click('#bench-panel [data-step="1"]');
    await page.wait(200);
    await page.click('#bench-panel [data-step="1"]');
    await page.wait(200);
    const browsed = await st();
    check("history: Previous/Next replace the entry instead of stacking", browsed.len === opened.len && browsed.title === "Nytr" && browsed.url === "/explore/#nytr", JSON.stringify(browsed));
    let s1 = await back();
    check("history: Back from a browsed project returns to the overview", !s1.open && s1.url === "/explore/", JSON.stringify(s1));
    check("history: Back returns focus to the last project, not the body", await page.eval(() => document.activeElement && document.activeElement.classList.contains("bench-object")));
    s1 = await fwd();
    check("history: Forward reopens the same project", s1.open && s1.url === `/explore/#${browsed.url.split("#")[1]}`, JSON.stringify(s1));
    await page.key("Escape");
    await page.wait(350);
    const closed = await st();
    check("history: Esc on a pushed entry goes Back (no new entry)", !closed.open && closed.url === "/explore/" && closed.len === opened.len, JSON.stringify(closed));
    const afterClose = await fwd();
    check("history: Forward after Esc reopens it", afterClose.open, JSON.stringify(afterClose));
    await page.click(".bench-close");
    await page.wait(350);

    await page.click('[data-filter="apps"]');
    await page.wait(200);
    await page.click('[data-filter="systems"]');
    await page.wait(200);
    const filtered = await st();
    check("history: filters push entries", filtered.url === "/explore/?filter=systems" && filtered.filter === "systems");
    let f = await back();
    check("history: Back restores the previous filter", f.filter === "apps" && f.url === "/explore/?filter=apps", JSON.stringify(f));
    check("history: restored filter re-mutes entries", await page.eval(() => document.querySelector("#devvy").classList.contains("is-muted") && !document.querySelector("#nytr").classList.contains("is-muted")));
    f = await back();
    check("history: Back again restores All", f.filter === "all" && f.url === "/explore/", JSON.stringify(f));
    f = await fwd();
    check("history: Forward restores the filter", f.filter === "apps", JSON.stringify(f));

    await page.click("#talks .bench-object");
    await page.wait(200);
    await page.click('[data-filter="ai"]');
    await page.wait(300);
    const hidden = await st();
    check("history: a filter that hides the open project closes it", !hidden.open && hidden.url === "/explore/?filter=ai", JSON.stringify(hidden));
    f = await back();
    check("history: Back brings the project and its filter back together", f.open && f.title === "Talks" && f.filter === "apps", JSON.stringify(f));
    await page.click(".bench-close");
    await page.wait(350);

    await page.click('[data-mode="list"]');
    await page.wait(200);
    const listed = await st();
    check("history: switching to list view pushes an entry", listed.list && listed.url.includes("view=list"), JSON.stringify(listed));
    f = await back();
    check("history: Back returns to the workbench", !f.list && !f.url.includes("view="), JSON.stringify(f));
    check("history: workbench redraws its connectors after list view", await page.eval(() => document.querySelectorAll(".bench-link").length === 4));
    f = await fwd();
    check("history: Forward returns to list view", f.list, JSON.stringify(f));

    // Replay must not create entries: walk all the way back and forward.
    const top = await st();
    for (let i = 0; i < 2; i++) await back();
    const bottom = await st();
    for (let i = 0; i < 2; i++) await fwd();
    const again = await st();
    check("history: Back/Forward replay creates no entries (no loops)", again.len === top.len && again.url === top.url && bottom.url === "/explore/", `${top.url} → ${bottom.url} → ${again.url}, len ${top.len}/${again.len}`);

    // Leaving: from the first explorer entry, Back leaves the page.
    await open("/");
    await page.navigateBy(() => {
      location.href = "/explore/";
    });
    await page.click("#nytr .bench-object");
    await page.wait(200);
    await back();
    await page.navigateBy(() => history.back());
    check("history: Back from the overview leaves for the previous page", await page.eval(() => location.pathname === "/"));

    // Deep link: Close replaces (there is no explorer entry to go back to).
    await open("/");
    await page.navigateBy(() => {
      location.href = "/explore/?filter=ai#pyopt";
    });
    const deep = await st();
    check("history: deep link opens the filtered project", deep.open && deep.title === "PyOpt" && deep.filter === "ai", JSON.stringify(deep));
    await page.click(".bench-close");
    await page.wait(300);
    const deepClosed = await st();
    check("history: closing a deep link replaces it (same length, hash cleared)", !deepClosed.open && deepClosed.len === deep.len && deepClosed.url === "/explore/?filter=ai", JSON.stringify(deepClosed));
    await page.navigateBy(() => history.back());
    check("history: Back after closing a deep link leaves the page", await page.eval(() => location.pathname === "/"));
    await page.navigateBy(() => history.forward());
    check("history: Forward into the explorer restores its closed, filtered state", await page.eval(() => location.search === "?filter=ai" && document.getElementById("bench-panel").hidden));

    await open("/explore/?filter=nonsense#not-a-project");
    check("history: unknown filter and hash are normalized without an entry", await page.eval(() => location.search === "" && location.hash === "" && document.querySelector('[data-filter="all"]').getAttribute("aria-pressed") === "true"));
    check("history: no console errors during history replay", page.errors.length === 0, page.errors.join("; "));
  },

  /* Real touch gestures through Chrome's input pipeline (touch emulation on). */
  async touch() {
    await open("/explore/", { width: 390, height: 844, touch: true });
    check("touch: phone starts in list view", await page.eval(() => document.getElementById("bench").classList.contains("is-list")));
    const scroll0 = await page.eval(() => scrollY);
    await page.touchGesture([[{ x: 200, y: 700 }, { x: 205, y: 300 }]]);
    await page.wait(600);
    check("touch: list view scrolls the page with a vertical swipe", (await page.eval(() => scrollY)) > scroll0 + 100);

    await page.tap('[data-mode="bench"]');
    await page.wait(300);
    check("touch: hint describes touch gestures", await page.eval(() => /pinch with two fingers/.test(document.querySelector(".bench-hint").textContent)));
    await page.eval(() => document.getElementById("bench").scrollIntoView({ block: "center", behavior: "instant" }));
    await page.wait(200);
    const frame = await page.eval(() => document.querySelector(".bench-viewport").getBoundingClientRect().toJSON());
    const c = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
    const t = () => page.eval(() => document.querySelector(".bench-plane").style.transform);
    const nums = (v) => (v.match(/-?\d+(\.\d+)?/g) || []).map(Number);
    const offscreen = () =>
      page.eval(() => {
        const f = document.querySelector(".bench-viewport").getBoundingClientRect();
        const r = document.querySelector("#talks .bench-object").getBoundingClientRect();
        return r.right > f.right;
      });
    check("touch: Talks starts (at least partly) off to the right on a phone", await offscreen());

    const before = nums(await t());
    const y0 = await page.eval(() => scrollY);
    await page.touchGesture([[{ x: c.x + 120, y: c.y }, { x: c.x - 120, y: c.y + 6 }]]);
    await page.wait(300);
    const after = nums(await t());
    check("touch: one-finger sideways swipe pans the bench", after[0] < before[0] - 150, `${before} → ${after}`);
    check("touch: sideways swipe does not scroll the page", (await page.eval(() => scrollY)) === y0);

    // Swipe down (page scrolls up): there is always room above the bench.
    const yBefore = await page.eval(() => scrollY);
    const tBefore = await t();
    await page.touchGesture([[{ x: c.x, y: c.y - 160 }, { x: c.x + 4, y: c.y + 160 }]]);
    await page.wait(600);
    check("touch: vertical swipe over the bench scrolls the page", (await page.eval(() => scrollY)) < yBefore - 80, `${yBefore} → ${await page.eval(() => scrollY)}`);
    check("touch: vertical swipe leaves the bench where it was", (await t()) === tBefore, `${tBefore} vs ${await t()}`);

    await page.eval(() => document.getElementById("bench").scrollIntoView({ block: "center", behavior: "instant" }));
    await page.wait(200);
    const f2 = await page.eval(() => document.querySelector(".bench-viewport").getBoundingClientRect().toJSON());
    const c2 = { x: f2.x + f2.width / 2, y: f2.y + f2.height / 2 };
    const s0 = nums(await t())[2];
    await page.touchGesture([
      [{ x: c2.x - 30, y: c2.y }, { x: c2.x - 100, y: c2.y }],
      [{ x: c2.x + 30, y: c2.y }, { x: c2.x + 100, y: c2.y }],
    ]);
    await page.wait(300);
    const s1 = nums(await t())[2];
    check("touch: two-finger pinch out zooms the bench in", s1 > s0 * 2.5, `${s0} → ${s1}`);
    check("touch: pinch does not zoom the page itself", await page.eval(() => !window.visualViewport || window.visualViewport.scale === 1));
    check("touch: pinch does not open a project", await page.eval(() => document.getElementById("bench-panel").hidden));
    await page.touchGesture([
      [{ x: c2.x - 120, y: c2.y }, { x: c2.x - 20, y: c2.y }],
      [{ x: c2.x + 120, y: c2.y }, { x: c2.x + 20, y: c2.y }],
    ]);
    await page.wait(300);
    const s2 = nums(await t())[2];
    check("touch: pinch in zooms out, bounded at 0.25", s2 < s1 && s2 >= 0.25 - 1e-6, `${s1} → ${s2}`);

    await page.tap('[data-zoom="reset"]');
    await page.wait(900);
    await page.eval(() => document.getElementById("bench").scrollIntoView({ block: "center", behavior: "instant" }));
    await page.wait(200);
    const f3 = await page.eval(() => document.querySelector(".bench-viewport").getBoundingClientRect().toJSON());
    const c3 = { x: f3.x + f3.width / 2, y: f3.y + f3.height / 2 };
    // Swipe until Talks is fully in view, like a visitor would, then tap it.
    for (let i = 0; i < 4 && (await offscreen()); i++) {
      await page.touchGesture([[{ x: c3.x + 60, y: c3.y }, { x: c3.x - 60, y: c3.y }]]);
      await page.wait(200);
    }
    check("touch: swiping brings Talks fully into view", !(await offscreen()));
    const talks = await page.eval(() => {
      const r = document.querySelector("#talks .bench-object").getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await page.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [talks] });
    await page.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    check("touch: tapping a project after panning opens it", await until(() => !document.getElementById("bench-panel").hidden && document.querySelector("#bench-panel .bench-title").textContent.trim() === "Talks"));
    await page.wait(500);
    await shot("explore-mobile-bench-panel");
    const sheet = await page.eval(() => {
      const p = document.getElementById("bench-panel").getBoundingClientRect();
      const f = document.querySelector(".bench-viewport").getBoundingClientRect();
      return p.left >= f.left && p.right <= f.right + 1 && p.bottom <= f.bottom + 1;
    });
    check("touch: the panel is a bottom sheet inside the bench", sheet);
    check("touch: the selected card is visible above the bottom sheet", await page.eval(() => {
      const f = document.querySelector(".bench-viewport").getBoundingClientRect();
      const p = document.getElementById("bench-panel").getBoundingClientRect();
      const r = document.querySelector("#talks .bench-object").getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      return cx > f.left && cx < f.right && cy > f.top && cy < p.top;
    }));
    check("touch: no console errors", page.errors.length === 0, page.errors.join("; "));
  },

  /* Does each non-ASCII glyph the pages use actually render in the page's own
     fonts? A glyph is "missing" when it rasterizes exactly like a code point no
     font has (U+10FFFD). Set REQUIRE_GLYPHS=1 to fail on missing glyphs (CI,
     where the runner has DejaVu fonts); otherwise they are reported only. */
  async glyphs() {
    const GLYPHS = ["←", "→", "↗", "−", "·", "—", "–", "×", "’", "“", "”", "é"];
    for (const [path, selector] of [["/explore/", ".bench-toolbar button"], ["/explore/", ".back-link"], ["/notebook/adr-extraction-demo/", ".adr-explanations p"], ["/", ".hero-lede"]]) {
      await open(path);
      const missing = await page.eval(
        (sel, glyphs) => {
          const el = document.querySelector(sel);
          const font = getComputedStyle(el).font;
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 48;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          const draw = (ch) => {
            ctx.clearRect(0, 0, 48, 48);
            ctx.font = font.replace(/\d+(\.\d+)?px/, "32px");
            ctx.fillText(ch, 4, 36);
            return Array.from(ctx.getImageData(0, 0, 48, 48).data).join(",");
          };
          const none = draw("\u{10FFFD}");
          return glyphs.filter((g) => draw(g) === none);
        },
        selector,
        GLYPHS,
      );
      const label = `glyphs on ${path} (${selector}): ${missing.length ? `missing ${missing.join(" ")}` : "all render"}`;
      if (process.env.REQUIRE_GLYPHS) check(label, missing.length === 0);
      else console.log(`  info ${label}`);
    }
  },

  /* Overlap audit: connector labels, cards, zone captions, panel and icons. */
  async layout() {
    const audit = () =>
      page.eval(() => {
        const box = (el) => el.getBoundingClientRect();
        const hit = (a, b, pad = 0) => a.left < b.right + pad && a.right + pad > b.left && a.top < b.bottom + pad && a.bottom + pad > b.top;
        const name = (el) => el.textContent.trim().slice(0, 24);
        const visible = (el) => getComputedStyle(el.closest(".bench-link, .bench-zone, .bench-item") || el).opacity !== "0";
        const labels = Array.from(document.querySelectorAll(".bench-link text")).filter(visible);
        const cards = Array.from(document.querySelectorAll(".bench-object"));
        const captions = Array.from(document.querySelectorAll(".bench-zone span"));
        const problems = [];
        labels.forEach((l, i) => {
          cards.forEach((c) => hit(box(l), box(c)) && problems.push(`label "${name(l)}" × card ${name(c.querySelector(".bench-label"))}`));
          captions.forEach((c) => hit(box(l), box(c)) && problems.push(`label "${name(l)}" × caption ${name(c)}`));
          labels.slice(i + 1).forEach((o) => hit(box(l), box(o)) && problems.push(`label "${name(l)}" × label "${name(o)}"`));
        });
        cards.forEach((c, i) =>
          cards.slice(i + 1).forEach((o) => hit(box(c), box(o)) && problems.push(`card ${name(c.querySelector(".bench-label"))} × card ${name(o.querySelector(".bench-label"))}`)),
        );
        cards.forEach((c) => {
          const zone = c.closest(".bench-plane").querySelector(`.bench-zone[data-zone="${c.closest(".bench-item").dataset.categories.split(" ")[0]}"]`);
          const z = box(zone);
          const r = box(c);
          if (r.left < z.left || r.right > z.right || r.top < z.top || r.bottom > z.bottom) problems.push(`card ${name(c.querySelector(".bench-label"))} outside its zone`);
          captions.forEach((cap) => hit(r, box(cap)) && problems.push(`card ${name(c.querySelector(".bench-label"))} × caption ${name(cap)}`));
          const label = c.querySelector(".bench-label");
          const note = c.querySelector(".bench-note");
          if (note.scrollWidth > note.clientWidth + 1 || label.scrollWidth > label.clientWidth + 1) problems.push(`card ${name(label)} text overflows`);
        });
        return problems;
      });

    for (const [width, height] of [[1440, 900], [1280, 800], [1024, 768], [900, 1000], [768, 1024]]) {
      await open("/explore/", { width, height });
      const p = await audit();
      check(`layout ${width}: no connector, card or caption overlaps on the workbench`, p.length === 0, p.join("; "));
      for (const filter of ["ai", "apps"]) {
        await page.click(`[data-filter="${filter}"]`);
        await page.wait(900);
        const q = await audit();
        check(`layout ${width} filter=${filter}: no overlaps`, q.length === 0, q.join("; "));
      }
      await page.click('[data-filter="all"]');
      await page.wait(300);
      // Every panel at this width: text stays inside the panel, nothing scrolls sideways.
      const panelProblems = [];
      for (const id of ["clage", "pyopt", "nytr", "talks", "medclarity", "devvy", "adr-research", "scholarai"]) {
        await page.eval((i) => document.querySelector(`#${i} .bench-object`).click(), id);
        await page.wait(80);
        const bad = await page.eval(() => {
          const p = document.getElementById("bench-panel");
          const body = p.querySelector(".bench-panel-body");
          const pr = p.getBoundingClientRect();
          const out = Array.from(body.querySelectorAll("*")).filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width && (r.right > pr.right + 1 || r.left < pr.left - 1);
          });
          return [body.scrollWidth > body.clientWidth + 1, out.length, pr.right <= document.querySelector(".bench-viewport").getBoundingClientRect().right + 1];
        });
        if (bad[0] || bad[1] || !bad[2]) panelProblems.push(`${id}: ${JSON.stringify(bad)}`);
      }
      await page.key("Escape");
      check(`layout ${width}: every detail panel fits without sideways overflow`, panelProblems.length === 0, panelProblems.join("; "));
    }

    // Preview frames and hero icons: drawings stay inside their frames.
    for (const width of [1440, 1280, 1024, 900, 768, 390, 320]) {
      await open("/", { width, height: 900, touch: width < 720 });
      if ([1024, 900, 768].includes(width)) await shot(`home-${width}`);
      const p = await page.eval(() => {
        const out = [];
        document.querySelectorAll(".hero-link").forEach((a) => {
          const icon = a.querySelector(".hero-icon").getBoundingClientRect();
          const word = a.querySelector(".hero-word").getBoundingClientRect();
          if (icon.top > word.bottom || icon.bottom < word.top) out.push(`${a.dataset.heroIcon} icon split from its word`);
          if (icon.right > word.left + 1 && icon.top === word.top) out.push(`${a.dataset.heroIcon} icon overlaps word`);
        });
        const lede = document.querySelector(".hero-lede").getBoundingClientRect();
        if (lede.right > document.documentElement.clientWidth) out.push("lede overflows");
        return out;
      });
      check(`layout ${width}: hero icons stay with their words and inside the column`, p.length === 0, p.join("; "));
      if (width >= 720) {
        for (const icon of ["software", "ai", "research"]) {
          await page.hover(`[data-hero-icon="${icon}"] .hero-word`);
          await page.wait(700);
          const q = await page.eval((ic) => {
            const pop = document.querySelector(".hero-pop");
            const shown = pop.classList.contains("is-showing");
            const card = pop.getBoundingClientRect();
            const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
            const blocked = [
              document.querySelector(".intro-art"),
              ...document.querySelectorAll(".bio > *"),
              ...[...document.querySelectorAll(".hero-link .hero-icon")].filter((el) => !el.closest(`[data-hero-icon="${ic}"]`)),
            ];
            return {
              shown,
              side: pop.dataset.side || null,
              covers: shown ? blocked.filter((el) => hit(card, el.getBoundingClientRect())).map((el) => el.tagName + "." + el.className).slice(0, 3) : [],
              out: shown && (card.right > document.documentElement.clientWidth || card.left < 0),
              iconLit: document.querySelector(`[data-hero-icon="${ic}"]`).classList.contains("is-lit"),
              // The 176px card plus its 24px gap must fit right of the text column.
              room: document.documentElement.clientWidth - 16 - document.querySelector(".bio").getBoundingClientRect().right - 24 >= 176,
            };
          }, icon);
          const wide = q.room;
          check(
            `layout ${width}: ${icon} ${wide ? "card opens in the right margin" : "has no card (inline icon only)"} and covers nothing`,
            q.iconLit && (wide ? q.shown && q.side === "right" : !q.shown) && q.covers.length === 0 && !q.out,
            JSON.stringify(q),
          );
          await page.mouseMove(2, 880);
          await page.wait(500);
        }
      }
      for (const name of ["Nytr", "Clage", "Talks", "Devvy"]) {
        await page.eval((n) => document.querySelector(`[data-name="${n}"] .preview-toggle`).click(), name);
        await page.wait(1600);
        const fit = await page.eval((n) => {
          const frame = document.querySelector(`[data-name="${n}"]`).getBoundingClientRect();
          const svg = document.querySelector(`[data-name="${n}"] .preview-diagram`);
          const texts = Array.from(svg.querySelectorAll("text")).map((t) => t.getBoundingClientRect());
          const chip = document.querySelector(`[data-name="${n}"] .preview-chip`).getBoundingClientRect();
          const overlapsCaption = 0;
          const overlapsChip = texts.filter((r) => r.width && r.left < chip.right && r.right > chip.left && r.top < chip.bottom && r.bottom > chip.top).length;
          const outside = texts.filter((r) => r.width && (r.left < frame.left - 1 || r.right > frame.right + 1)).length;
          return { overlapsCaption, overlapsChip, outside };
        }, name);
        check(`layout ${width}: ${name} diagram labels clear the button and frame`, !fit.overlapsCaption && !fit.overlapsChip && !fit.outside, JSON.stringify(fit));
        await page.eval((n) => document.querySelector(`[data-name="${n}"] .preview-toggle`).click(), name);
      }
    }
  },

  /* Illustrated self-portrait: the static drawing, the hover sequence, bounded
     tracking, return to rest, no snapping, idle frames, reduced motion,
     touch, and its place in the layout at every width. Every transform the
     script writes is recorded with a MutationObserver, so nothing here adds a
     frame loop of its own. */
  async portrait() {
    // Count frame requests, allow freezing a frame for a screenshot, and log
    // every transform/opacity write on the drawing from the first moment.
    const { identifier } = await page.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `window.__raf = 0; window.__freeze = false; window.__pt = []; window.__t0 = 0;
        { const r = window.requestAnimationFrame.bind(window);
          window.requestAnimationFrame = (cb) => (window.__raf++, window.__freeze ? 0 : r(cb)); }
        document.addEventListener("DOMContentLoaded", () => {
          const svg = document.querySelector("svg.portrait");
          if (!svg) return;
          new MutationObserver((list) => {
            for (const m of list) window.__pt.push([performance.now() - window.__t0, m.target.getAttribute("class").split(" ")[0], m.attributeName, m.target.getAttribute(m.attributeName)]);
          }).observe(svg, { attributes: true, subtree: true, attributeFilter: ["transform", "opacity"] });
        });`,
    });
    const frames = async (ms) => {
      const before = await page.eval(() => window.__raf);
      await page.wait(ms);
      return (await page.eval(() => window.__raf)) - before;
    };
    const record = () => page.eval(() => ((window.__pt = []), (window.__t0 = performance.now()), true));
    const writes = async (part, attr = "transform") => (await page.eval(() => window.__pt)).filter((w) => w[1] === part && w[2] === attr);
    const num = (re) => (w) => Number((re.exec(w[3] || "") || [])[1] || 0);
    const angle = num(/rotate\((-?[\d.]+)/);
    const shiftX = num(/translate\((-?[\d.]+)/);
    const shiftY = num(/translate\(-?[\d.]+ (-?[\d.]+)\)/);
    const rest = () =>
      page.eval(() =>
        Array.from(document.querySelectorAll("svg.portrait [class]"))
          .filter((el) => /^pt-(head|hair|features|pupil|lid|lash|brow|glint)/.test(el.getAttribute("class")))
          .map((el) => `${el.getAttribute("class")}|${el.getAttribute("transform")}|${el.getAttribute("opacity")}`)
          .join(";"),
      );
    const portraitShot = async (name, known = null, pad = 24) => {
      if (!process.env.SCREENSHOTS) return;
      const r = known || (await page.eval(() => document.querySelector("svg.portrait").getBoundingClientRect().toJSON()));
      const { data } = await page.send("Page.captureScreenshot", { format: "png", clip: { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.width + pad * 2, height: r.height + pad * 2, scale: 2 } });
      mkdirSync(SHOTS, { recursive: true });
      writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(data, "base64"));
    };

    // The drawing: inline SVG with named parts, not a picture or a control.
    await open("/");
    const drawing = await page.eval(() => {
      const svg = document.querySelector(".intro-art > svg.portrait");
      const parts = ["head", "hair", "face", "beard", "eyes", "pupil", "lid", "brow", "glasses", "glint", "body"];
      return {
        exists: Boolean(svg),
        name: svg?.getAttribute("role") === "img" && /portrait of Utkarsh Sonawane/.test(svg.getAttribute("aria-label") || ""),
        parts: parts.filter((p) => !svg?.querySelector(`.pt-${p}`)),
        pairs: ["pupil", "lid", "brow", "lash"].every((p) => svg.querySelectorAll(`.pt-${p}`).length === 2),
        vector: !svg.querySelector("image, foreignObject") && svg.querySelectorAll("path, circle, use").length > 30,
        notFocusable: svg.tabIndex < 0 && !svg.closest("a, button") && svg.getAttribute("focusable") === "false",
        bytes: svg.outerHTML.length,
      };
    });
    check("portrait: inline SVG named as an image, with every animated part as its own group", drawing.exists && drawing.name && drawing.parts.length === 0 && drawing.pairs, JSON.stringify(drawing));
    check("portrait: vector shapes only (no embedded raster) and not a focus stop", drawing.vector && drawing.notFocusable);
    check("portrait: markup stays small (< 12 KB before compression)", drawing.bytes < 12000, `${drawing.bytes} bytes`);
    check("portrait: no requests made for it (drawing is in the page)", !requests.some((u) => /portrait/.test(u) && !u.endsWith("/js/portrait.js")), requests.filter((u) => /portrait/.test(u)).join(", "));
    const atLoad = await rest();
    check("portrait: no frames requested while idle after load", (await frames(1000)) === 0);

    // Without JavaScript it is the same drawing, pixel for pixel.
    const clip = await page.eval(() => document.querySelector("svg.portrait").getBoundingClientRect().toJSON());
    const grab = async () => (await page.send("Page.captureScreenshot", { format: "png", clip: { x: clip.x, y: clip.y, width: clip.width, height: clip.height, scale: 1 } })).data;
    const withJs = await grab();
    await page.send("Emulation.setScriptExecutionDisabled", { value: true });
    await page.goto(`${ORIGIN}/`);
    const withoutJs = await grab();
    await portraitShot("portrait-no-js", clip);
    await page.send("Emulation.setScriptExecutionDisabled", { value: false });
    check("portrait: renders identically without JavaScript", withJs === withoutJs);

    // Hover: notice, look, tilt, hair lag, blink, glint.
    await open("/");
    await shot("portrait-intro-1440");
    await portraitShot("portrait-rest");
    await record();
    const box = await page.box("svg.portrait");
    const lede = () => page.eval(() => [document.querySelector(".bio").getBoundingClientRect().toJSON(), document.querySelector(".hero-lede").getBoundingClientRect().toJSON()].map((r) => [r.x, r.y, r.width, r.height].join()).join("|"));
    const before = await lede();
    const right = { x: box.x + box.width * 0.44, y: box.y - box.height * 0.12 };
    await page.mouseMove(right.x, right.y);
    await page.wait(205);
    await page.eval(() => (window.__freeze = true));
    await page.wait(40);
    await portraitShot("portrait-hover-notice");
    await page.eval(() => (window.__freeze = false));
    await page.mouseMove(right.x - 1, right.y);
    await page.wait(900);
    await portraitShot("portrait-hover-looking");
    const during = await lede();
    check("portrait: the text does not move while it animates", before === during, `${before} vs ${during}`);
    const heads = await writes("pt-head");
    const tilts = heads.map(angle);
    const peak = Math.max(...tilts);
    check("portrait: hover tilts the head toward the pointer by 2–4°", peak >= 2 && peak <= 4 && tilts.every((a) => a >= -0.01), `peak ${peak.toFixed(2)}°`);
    const pupils = await writes("pt-pupil");
    check("portrait: pupils turn toward the pointer", pupils.length > 0 && shiftX(pupils.at(-1)) > 0.8 && shiftY(pupils.at(-1)) < 0, pupils.at(-1)?.[3]);
    const firstHead = heads.find((w) => angle(w) > 0.05)?.[0] ?? Infinity;
    const firstPupil = pupils.find((w) => shiftX(w) > 0.05)?.[0] ?? Infinity;
    check("portrait: the eyes move first and the head follows", firstPupil < firstHead, `pupils ${firstPupil.toFixed(0)} ms, head ${firstHead.toFixed(0)} ms`);
    const hair = (await writes("pt-hair")).map(angle);
    check("portrait: the hair lags behind the head, then follows", Math.min(...hair) < -0.15 && hair.at(-1) > -0.15, `lag ${Math.min(...hair).toFixed(2)}°, last ${hair.at(-1)?.toFixed(2)}°`);
    const lids = (await writes("pt-lid")).map(shiftY);
    check("portrait: it blinks once (the lids close and reopen)", lids.some((y) => y > -0.8) && lids.at(-1) <= -7.3, `lid y ${lids.map((y) => y.toFixed(1)).join(" ")}`);
    const glint = (await writes("pt-glint", "opacity")).map((w) => Number(w[3]));
    check("portrait: a brief glint crosses the glasses, then fades", Math.max(0, ...glint) > 0.2 && Math.max(0, ...glint) <= 0.5 && glint.at(-1) === 0, `max ${Math.max(0, ...glint)}`);
    // (The next idle blink is at least 4 s after the pointer arrived.)
    check("portrait: once settled under a still pointer, no frames are requested", (await frames(1000)) < 40 && (await frames(600)) === 0);

    // Bounded tracking: the pupils stay in the eye and the tilt under 4°.
    await page.mouseMove(box.x - box.width * 0.4, box.y + box.height * 0.2);
    await page.wait(700);
    await portraitShot("portrait-hover-left");
    for (const [dx, dy] of [[-0.49, -0.49], [0.49, -0.49], [-0.49, 0.49], [0.49, 0.49]]) {
      await page.mouseMove(box.x + dx * box.width, box.y + dy * box.height);
      await page.wait(450);
    }
    const tracked = await writes("pt-pupil");
    const maxX = Math.max(...tracked.map((w) => Math.abs(shiftX(w))));
    const maxY = Math.max(...tracked.map((w) => Math.abs(shiftY(w))));
    const maxTilt = Math.max(...(await writes("pt-head")).map((w) => Math.abs(angle(w))));
    check("portrait: pupil tracking stays inside the eye (≤ 2.4 × 1.2 units)", maxX <= 2.4 && maxY <= 1.2 && maxX > 1.2, `max ${maxX} × ${maxY}`);
    check("portrait: the head never tilts more than 4°", maxTilt <= 4, `${maxTilt}°`);

    // Leaving: back to the exact rest drawing, then the loop sleeps.
    const away = { x: box.x - box.width * 1.1, y: box.y };
    await page.mouseMove(away.x, away.y);
    check("portrait: returns to the rest drawing after the pointer leaves", await until((s) => {
      const now = Array.from(document.querySelectorAll("svg.portrait [class]"))
        .filter((el) => /^pt-(head|hair|features|pupil|lid|lash|brow|glint)/.test(el.getAttribute("class")))
        .map((el) => `${el.getAttribute("class")}|${el.getAttribute("transform")}|${el.getAttribute("opacity")}`)
        .join(";");
      return now === s;
    }, 3000, atLoad));
    check("portrait: no frames requested after it settles", (await frames(1000)) === 0);

    // Rapid in and out while the head is still moving: the springs keep their
    // velocity, so it turns around instead of snapping back.
    await record();
    const marks = [];
    for (let i = 0; i < 3; i++) {
      await page.mouseMove(right.x, right.y);
      await page.wait(260);
      marks.push(await page.eval(() => performance.now() - window.__t0));
      await page.mouseMove(away.x, away.y);
      await page.wait(140);
    }
    await page.wait(1800);
    const quick = (await writes("pt-head")).map((w) => [w[0], angle(w)]);
    const fastest = (series) => {
      let top = 0;
      for (let i = 1; i < series.length; i++) top = Math.max(top, Math.abs(series[i][1] - series[i - 1][1]) / Math.max(8, series[i][0] - series[i - 1][0]));
      return top;
    };
    const rate = fastest(quick);
    const eyeRate = fastest((await writes("pt-pupil")).map((w) => [w[0], shiftX(w)]));
    const atLeave = marks.map((t) => {
      const last = quick.filter((w) => w[0] <= t).at(-1);
      const next = quick.find((w) => w[0] > t);
      return last && next ? Math.abs(next[1] - last[1]) : 0;
    });
    check(
      "portrait: quick enter/exit turns around smoothly (no jumps)",
      Math.max(...quick.map((w) => w[1])) > 1 && rate < 0.15 && eyeRate < 0.15 && Math.max(...atLeave) < 0.6,
      `head ${(rate * 1000).toFixed(0)}°/s, pupils ${(eyeRate * 1000).toFixed(0)} units/s, step at leave ${atLeave.map((d) => d.toFixed(2)).join("/")}°`,
    );
    check("portrait: settles back to rest after quick passes", (await rest()) === atLoad);
    check("portrait: no console errors", page.errors.length === 0, page.errors.join("; "));

    // Hero icons still animate next to it, and their card never covers it.
    await page.hover('[data-hero-icon="ai"] .hero-word');
    check("portrait: hero icon still lights beside the portrait", await until(() => document.querySelector('[data-hero-icon="ai"]').classList.contains("is-lit")));
    await page.wait(700);
    check("portrait: the hero card does not cover the portrait", await page.eval(() => {
      const a = document.querySelector(".hero-pop").getBoundingClientRect();
      const b = document.querySelector("svg.portrait").getBoundingClientRect();
      return !(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    }));
    await page.mouseMove(5, 880);

    // Reduced motion: hovering changes nothing and requests no frames.
    await open("/", { reduced: true });
    await record();
    const still = await page.box("svg.portrait");
    await page.mouseMove(still.x + still.width * 0.4, still.y);
    await page.wait(200);
    await page.mouseMove(still.x - still.width * 0.4, still.y + 20);
    const reducedFrames = await frames(600);
    check("reduced motion: hovering the portrait moves nothing", (await page.eval(() => window.__pt.length)) === 0 && reducedFrames === 0, `${await page.eval(() => window.__pt.length)} writes, ${reducedFrames} frames`);

    // Touch: one greeting when first seen; swipes scroll; a tap greets again.
    await open("/", { width: 390, height: 844, touch: true });
    check("touch: the portrait greets once when it comes into view", await until(() => window.__pt.some((w) => w[1] === "pt-lid" && /translate\(0 -?0(\.\d+)?\)/.test(w[3] || "")), 2500));
    check("touch: the greeting ends at the rest drawing", await until((s) => {
      const now = Array.from(document.querySelectorAll("svg.portrait [class]"))
        .filter((el) => /^pt-(head|hair|features|pupil|lid|lash|brow|glint)/.test(el.getAttribute("class")))
        .map((el) => `${el.getAttribute("class")}|${el.getAttribute("transform")}|${el.getAttribute("opacity")}`)
        .join(";");
      return now === s;
    }, 4000, atLoad));
    await shot("portrait-mobile-390");
    const touchBox = await page.eval(() => document.querySelector("svg.portrait").getBoundingClientRect().toJSON());
    const y0 = await page.eval(() => scrollY);
    const startAt = { x: touchBox.x + touchBox.width / 2, y: touchBox.y + touchBox.height * 0.6 };
    await page.touchGesture([[startAt, { x: startAt.x + 3, y: startAt.y - 200 }]]);
    await page.wait(500);
    check("touch: a swipe that starts on the portrait still scrolls the page", (await page.eval(() => scrollY)) > y0 + 100);
    // Let the swipe's fling finish: a touch during a fling only stops it and
    // never becomes a click.
    for (let last = -1, i = 0; i < 40; i++) {
      const now = await page.eval(() => scrollY);
      if (now === last) break;
      last = now;
      await page.wait(150);
    }
    await record();
    const href = await page.eval(() => location.href);
    await page.tap("svg.portrait");
    check("touch: tapping the portrait plays the greeting and does not navigate", await until(() => window.__pt.some((w) => w[1] === "pt-pupil"), 1500) && (await page.eval(() => location.href)) === href);
    check("touch: no console errors", page.errors.length === 0, page.errors.join("; "));

    // Layout at every width: visible, inside the page, clear of the text, the
    // icons and the notebook; on phones the biography starts only a little lower.
    for (const width of [1440, 1280, 1024, 900, 768, 390, 320]) {
      await open("/", { width, height: width < 720 ? 844 : 900, touch: width < 720 });
      if (width < 720) await shot(`portrait-mobile-${width}`);
      const l = await page.eval(() => {
        const box = (el) => el.getBoundingClientRect();
        const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        const svg = box(document.querySelector("svg.portrait"));
        const notebook = box(document.querySelector(".intro-art > .illustration"));
        const text = Array.from(document.querySelectorAll(".bio > *")).map(box);
        const icons = Array.from(document.querySelectorAll(".hero-link .hero-icon")).map(box);
        const intro = box(document.querySelector(".intro"));
        return {
          width: Math.round(svg.width),
          ratio: +(svg.height / svg.width).toFixed(3),
          inside: svg.left >= 0 && svg.right <= document.documentElement.clientWidth,
          text: text.filter((r) => hit(svg, r)).length,
          icons: icons.filter((r) => hit(svg, r)).length,
          notebook: Math.round(notebook.width),
          notebookClear: !hit(notebook, svg) && text.every((r) => !hit(notebook, r)),
          notebookLast: notebook.top >= box(document.querySelector(".contact-row")).bottom,
          ledeOffset: Math.round(box(document.querySelector(".hero-lede")).top - intro.top),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      const phone = width < 720;
      check(
        `portrait ${width}: ${phone ? "byline beside the name" : "leads the left column"}, clear of text, icons and notebook`,
        l.width === (phone ? 92 : 180) && Math.abs(l.ratio - 1.06) < 0.01 && l.inside && !l.text && !l.icons && l.notebookClear && l.overflow <= 0,
        JSON.stringify(l),
      );
      if (phone) check(`portrait ${width}: the lede starts within 120px of the intro; the notebook stays after the links`, l.ledeOffset <= 120 && l.notebookLast && l.notebook === 112, JSON.stringify(l));
      else check(`portrait ${width}: the notebook is the smaller drawing beneath it`, l.notebook === 120);
    }
    await page.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
  },

  async demo() {
    await open("/notebook/adr-extraction-demo/");
    check("demo: no console errors", page.errors.length === 0, page.errors.join("; "));
    check("demo: identified as a synthetic illustration", await page.eval(() => /Illustration only: the posts and drug names are invented, and no real\s+data, models, or results are used\./.test(document.body.innerText) && !document.querySelector(".adr-notice")));
    const stepIs = (n) => until((k) => document.querySelector(".adr-demo").dataset.step === String(k), 1000, n);
    check("demo: starts at step 1", await stepIs(1));
    check("demo: drug highlight hidden at step 1", await page.eval(() => getComputedStyle(document.querySelector('.adr-example:not([hidden]) mark[data-kind="drug"]')).backgroundColor === "rgba(0, 0, 0, 0)"));
    await page.click('[data-move="1"]');
    check("demo: Next goes to step 2", await stepIs(2));
    {
      // Scroll so the controls sit low on screen, then step through every
      // state of every example: the controls must not move.
      await page.eval(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
      await page.wait(100);
      const log = [];
      const pos = async () => {
        const v = await page.eval(() => [Math.round(document.querySelector('[data-move="1"]').getBoundingClientRect().top), Math.round(scrollY), document.documentElement.scrollHeight, document.querySelector(".adr-demo").dataset.step]);
        log.push(v.join("/"));
        return v[0];
      };
      const y0 = await pos();
      const seen = new Set([y0]);
      for (const ex of ["0", "1", "2"]) {
        await page.eval((e) => document.querySelector(`[data-example="${e}"]`).click(), ex);
        seen.add(await pos());
        for (let k = 0; k < 6; k++) {
          await page.eval(() => document.querySelector('[data-move="1"]').click());
          await page.wait(60);
          seen.add(await pos());
        }
        for (let k = 0; k < 6; k++) {
          await page.eval(() => document.querySelector('[data-move="-1"]').click());
          await page.wait(60);
          seen.add(await pos());
        }
      }
      check("demo: Next/Previous controls never move while stepping (any example)", seen.size === 1, seen.size === 1 ? "" : log.join(" "));
      await page.eval(() => {
        document.querySelector('[data-example="0"]').click();
        document.querySelector('[data-goto="2"]').click();
        window.scrollTo({ top: 0, behavior: "instant" });
      });
    }
    check("demo: drug mentions highlighted at step 2", await until(() => getComputedStyle(document.querySelector('.adr-example:not([hidden]) mark[data-kind="drug"]')).backgroundColor !== "rgba(0, 0, 0, 0)"));
    await page.click('[data-move="1"]');
    await page.click('[data-move="1"]');
    check("demo: step 4 shows candidate pairs with connectors", await stepIs(4) && (await page.eval(() => document.querySelectorAll(".adr-example:not([hidden]) .adr-link").length === 1)));
    await page.eval(() => document.querySelector('[data-move="1"]').focus());
    await page.key("ArrowRight");
    check("demo: ArrowRight advances to review", await stepIs(5));
    check("demo: review shows a verdict and reason", await page.eval(() => getComputedStyle(document.querySelector(".adr-example:not([hidden]) .adr-reason")).display === "block"));
    await page.click('[data-example="1"]');
    check("demo: switching examples restarts at step 1", await stepIs(1));
    await page.click('[data-goto="5"]');
    check("demo: example 2 contains a contradicted candidate", await page.eval(() => Boolean(document.querySelector('.adr-example:not([hidden]) [data-verdict="rejected"]'))));
    await page.wait(800);
    for (const ex of ["0", "1", "2"]) {
      await page.click(`[data-example="${ex}"]`);
      await page.click('[data-goto="5"]');
      await page.wait(300);
      const problems = await page.eval(() => {
        const out = [];
        const example = document.querySelector(".adr-example:not([hidden])");
        const badges = Array.from(example.querySelectorAll(".adr-link-badge")).map((b) => b.getBoundingClientRect());
        badges.forEach((a, i) => badges.slice(i + 1).forEach((b, j) => {
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) out.push(`badges ${i + 1}/${i + j + 2} overlap`);
        }));
        Array.from(example.querySelectorAll(".adr-link path")).forEach((path, i) => {
          const pair = example.querySelectorAll(".adr-pairs > li")[i];
          const len = path.getTotalLength();
          const ends = [path.getPointAtLength(0), path.getPointAtLength(len)];
          const svg = path.ownerSVGElement.getBoundingClientRect();
          const near = (pt, id) => {
            const m = example.querySelector(`mark[data-id="${id}"]`);
            return Array.from(m.getClientRects()).some((r) => r.width > 2 && svg.left + pt.x >= r.left - 2 && svg.left + pt.x <= r.right + 2 && Math.abs(svg.top + pt.y - r.top) < 8 || Math.abs(svg.top + pt.y - r.bottom) < 8 && svg.left + pt.x >= r.left - 2 && svg.left + pt.x <= r.right + 2);
          };
          const ok = (near(ends[0], pair.dataset.from) && near(ends[1], pair.dataset.to)) || (near(ends[0], pair.dataset.to) && near(ends[1], pair.dataset.from));
          if (!ok) out.push(`connector ${i + 1} does not attach to its marks`);
        });
        return out;
      });
      check(`demo example ${Number(ex) + 1}: connectors attach to their marks and badges do not collide`, problems.length === 0, problems.join("; "));
    }
    await page.click('[data-example="1"]');
    await page.click('[data-goto="5"]');
    await page.wait(800);
    await shot("demo-desktop-review", true);
    await page.click('[data-goto="6"]');
    check("demo: final step explains reports are not causation", await page.eval(() => /does not\s+show the drug caused it/.test(document.querySelector('.adr-explanations li[data-for="6"]').innerText)));
    await page.click('[data-move="reset"]');
    check("demo: Reset returns to step 1 and example 1", await stepIs(1) && (await page.eval(() => document.querySelector('[data-example="0"]').getAttribute("aria-pressed") === "true")));
    check("demo: only same-origin static requests", requests.every((u) => u.startsWith(ORIGIN) || u.startsWith("data:")), requests.filter((u) => !u.startsWith(ORIGIN)).join(", "));

    await open("/notebook/adr-extraction-demo/", { reduced: true });
    await page.click('[data-goto="4"]');
    check("demo reduced motion: connectors drawn immediately", await page.eval(() => getComputedStyle(document.querySelector(".adr-link path")).strokeDashoffset === "0px" || getComputedStyle(document.querySelector(".adr-link path")).strokeDashoffset === "0"));

    for (const width of [390, 320]) {
      await open("/notebook/adr-extraction-demo/", { width, height: 844, touch: true });
      await page.tap('[data-goto="5"]');
      await page.wait(500);
      check(`demo ${width}: no overflow`, (await overflow()) <= 0);
      await shot(`demo-mobile-${width}`, true);
    }
  },
};

const selected = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(suites);
try {
  for (const name of selected) {
    console.log(`\n# ${name}`);
    const limit = Number(process.env.SUITE_TIMEOUT_MS || 240000);
    let timer;
    await Promise.race([
      suites[name](),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`suite "${name}" exceeded ${limit} ms`)), limit);
      }),
    ]).finally(() => clearTimeout(timer));
  }
} catch (error) {
  check("suite crashed", false, error.stack || String(error));
} finally {
  await page.close();
  server.close();
}
console.log(`\n${results.length - failures}/${results.length} checks passed.`);
process.exit(failures ? 1 : 0);
