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
        paused: /Development paused/.test(document.querySelector("#projects").innerText),
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

    check("no demo video is requested before interaction", !requests.some((u) => u.endsWith(".mp4")));
    check("no <video> exists on the homepage before interaction", await page.eval(() => !document.querySelector("#projects video")));

    // Hero icon: hover lights it, the margin figure shows, the text does not move.
    const before = await page.eval(() => {
      const r = document.querySelector(".hero-lede").getBoundingClientRect();
      return [r.top, r.height, document.querySelector(".bio").getBoundingClientRect().height];
    });
    await page.hover('[data-hero-icon="ai"] .hero-word');
    check("AI icon lights on hover", await until(() => document.querySelector('[data-hero-icon="ai"]').classList.contains("is-lit")));
    check("margin figure shows the lit icon", await until(() => document.querySelector(".hero-figure").classList.contains("is-showing")));
    await page.wait(900);
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
    await page.hover(".project-row:nth-of-type(1) h3 a");
    check("Nytr preview creates a muted inline video on intent", await until(() => {
      const v = document.querySelector('[data-name="Nytr"] video');
      return Boolean(v && v.muted && v.playsInline && v.loop && !v.controls);
    }));
    check("Nytr video starts playing", await until(() => {
      const v = document.querySelector('[data-name="Nytr"] video');
      return v && !v.paused && v.currentTime > 0;
    }, 5000));
    await shot("home-preview-nytr");
    await page.mouseMove(5, 5);
    check("Nytr video pauses when the pointer leaves", await until(() => document.querySelector('[data-name="Nytr"] video').paused));

    await page.click('[data-name="Clage"] .preview-toggle');
    check("Clage preview button toggles aria-pressed", await until(() => document.querySelector('[data-name="Clage"] .preview-toggle').getAttribute("aria-pressed") === "true"));
    check("Clage overlay network renders while the video loads", await page.eval(() => Boolean(document.querySelector('[data-name="Clage"] .preview-network'))));
    await page.wait(1600);
    await shot("home-preview-clage");
    await page.click('[data-name="Clage"] .preview-toggle');
    check("second press pauses Clage", await until(() => document.querySelector('[data-name="Clage"] video').paused));

    check("only demo videos were fetched, not other media", requests.filter((u) => u.endsWith(".mp4")).every((u) => /nytr-demo|clage-studio-demo/.test(u)));

    // Reduced motion: no hover autoplay; icons snap to a still.
    await open("/", { reduced: true });
    await page.hover(".project-row:nth-of-type(1) h3 a");
    await page.wait(500);
    check("reduced motion: hover does not start a video", await page.eval(() => !document.querySelector('[data-name="Nytr"]').classList.contains("is-active")));
    await page.hover('[data-hero-icon="ai"] .hero-word');
    check("reduced motion: icon jumps straight to its final still", await until(() => Number(document.querySelector('[data-hero-icon="ai"] .a-loop').getAttribute("opacity")) > 0.9, 150));
    check("reduced motion: section reveal does not hide content", await page.eval(() => !document.querySelector(".is-pending")));

    // Mobile/touch.
    for (const width of [390, 320]) {
      await open("/", { width, height: 844, touch: true });
      await shot(`home-mobile-${width}`);
      check(`mobile ${width}: no overflow`, (await overflow()) <= 0);
      check(`mobile ${width}: margin figure hidden`, await page.eval(() => getComputedStyle(document.querySelector(".hero-figure")).display === "none"));
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

    for (const width of [1024, 768]) {
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
    await open("/explore/", { width: 390, height: 844, touch: true });
    await page.tap('[data-mode="bench"]');
    await page.wait(300);
    await page.tap("#talks .bench-object");
    check("explore touch: workbench mode opens a project on tap", await until(() => !document.getElementById("bench-panel").hidden));
    await page.wait(500);
    await shot("explore-mobile-bench-panel");
  },

  async demo() {
    await open("/notebook/adr-extraction-demo/");
    check("demo: no console errors", page.errors.length === 0, page.errors.join("; "));
    check("demo: identified as a synthetic illustration", await page.eval(() => /Educational illustration, synthetic examples/.test(document.body.innerText) && /not real\s+medications/.test(document.body.innerText)));
    const stepIs = (n) => until((k) => document.querySelector(".adr-demo").dataset.step === String(k), 1000, n);
    check("demo: starts at step 1", await stepIs(1));
    check("demo: drug highlight hidden at step 1", await page.eval(() => getComputedStyle(document.querySelector('.adr-example:not([hidden]) mark[data-kind="drug"]')).backgroundColor === "rgba(0, 0, 0, 0)"));
    await page.click('[data-move="1"]');
    check("demo: Next goes to step 2", await stepIs(2));
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
    await suites[name]();
  }
} catch (error) {
  check("suite crashed", false, error.stack || String(error));
} finally {
  await page.close();
  server.close();
}
console.log(`\n${results.length - failures}/${results.length} checks passed.`);
process.exit(failures ? 1 : 0);
