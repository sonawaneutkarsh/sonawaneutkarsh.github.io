// Zero-dependency browser automation over the Chrome DevTools Protocol.
//
// The site has no package.json or build step, so the regression tests drive
// a locally installed Chrome/Chromium directly instead of pulling in a test
// framework. Requires Node 22+ (global WebSocket and fetch).

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANDIDATES = [
  process.env.CHROME_PATH,
  "/inner_container/opt/playwright/chromium_headless_shell-1232/chrome-headless-shell-linux64/chrome-headless-shell",
  "/usr/local/bin/chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].filter(Boolean);

export function findChrome() {
  const found = CANDIDATES.find((path) => existsSync(path));
  if (!found) throw new Error("No Chrome found. Set CHROME_PATH to a Chrome or Chromium binary.");
  return found;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Launch Chrome headless, or attach to CDP_URL (http://host:port) if set. */
export async function launch() {
  let child = null;
  let base = process.env.CDP_URL;
  if (!base) {
    const port = 9300 + Math.floor(Math.random() * 500);
    const profile = mkdtempSync(join(tmpdir(), "v3-chrome-"));
    child = spawn(
      findChrome(),
      [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-crash-reporter",
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--mute-audio",
        "--autoplay-policy=no-user-gesture-required",
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${profile}`,
        "about:blank",
      ],
      { stdio: "ignore" },
    );
    base = `http://127.0.0.1:${port}`;
  }
  let up = false;
  for (let i = 0; i < 100 && !up; i++) {
    try {
      up = (await fetch(`${base}/json/version`)).ok;
    } catch {
      await sleep(100);
    }
  }
  if (!up) throw new Error(`Browser did not expose DevTools at ${base}. Set CHROME_PATH or CDP_URL.`);
  const target = await (await fetch(`${base}/json/new?about:blank`, { method: "PUT" })).json();
  const page = new Page(target.webSocketDebuggerUrl);
  await page.open();
  page.close = async () => {
    try {
      await fetch(`${base}/json/close/${target.id}`);
    } catch {
      /* ignore */
    }
    page.ws.close();
    if (child) child.kill();
  };
  return page;
}

export class Page {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.errors = [];
  }

  open() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => this.receive(JSON.parse(event.data));
      this.ws.onopen = async () => {
        await Promise.all([
          this.send("Page.enable"),
          this.send("Runtime.enable"),
          this.send("Log.enable"),
          this.send("Network.enable"),
        ]);
        this.on("Runtime.exceptionThrown", (p) =>
          this.errors.push(`exception: ${p.exceptionDetails?.exception?.description || p.exceptionDetails?.text}`),
        );
        this.on("Runtime.consoleAPICalled", (p) => {
          if (p.type === "error") this.errors.push(`console.error: ${p.args.map((a) => a.value ?? a.description).join(" ")}`);
        });
        this.on("Log.entryAdded", (p) => {
          if (p.entry.level === "error") this.errors.push(`log: ${p.entry.text} ${p.entry.url || ""}`);
        });
        resolve();
      };
    });
  }

  receive(message) {
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message} ${message.error.data || ""}`));
      else resolve(message.result);
      return;
    }
    (this.listeners.get(message.method) || []).forEach((fn) => fn(message.params));
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
  }

  once(method) {
    return new Promise((resolve) => {
      const fn = (params) => {
        const list = this.listeners.get(method);
        list.splice(list.indexOf(fn), 1);
        resolve(params);
      };
      this.on(method, fn);
    });
  }

  async goto(url) {
    this.errors = [];
    const loaded = this.once("Page.loadEventFired");
    await this.send("Page.navigate", { url });
    await loaded;
    await sleep(150);
  }

  async viewport(width, height = 900, { mobile = false, touch = false } = {}) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
    await this.send("Emulation.setTouchEmulationEnabled", touch ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    await this.send("Emulation.setEmitTouchEventsForMouse", { enabled: false });
  }

  async media(features) {
    await this.send("Emulation.setEmulatedMedia", {
      features: Object.entries(features).map(([name, value]) => ({ name, value })),
    });
  }

  async eval(fnOrExpression, ...args) {
    const expression =
      typeof fnOrExpression === "function"
        ? `(${fnOrExpression.toString()})(...${JSON.stringify(args)})`
        : fnOrExpression;
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result.value;
  }

  async box(selector) {
    const box = await this.eval((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, width: r.width, height: r.height };
    }, selector);
    if (!box) throw new Error(`No element for ${selector}`);
    return box;
  }

  async mouseMove(x, y) {
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, pointerType: "mouse" });
  }

  async hover(selector) {
    const { x, y } = await this.box(selector);
    await this.mouseMove(x, y);
    return { x, y };
  }

  async click(selector) {
    const { x, y } = await this.hover(selector);
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  }

  async drag(from, to, steps = 8) {
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: from.x, y: from.y, button: "left", clickCount: 1 });
    for (let i = 1; i <= steps; i++) {
      await this.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
        button: "left",
        buttons: 1,
      });
    }
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: to.x, y: to.y, button: "left", clickCount: 1 });
  }

  async tap(selector) {
    const { x, y } = await this.box(selector);
    await this.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await this.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }

  async key(key, { shift = false } = {}) {
    const codes = {
      Tab: 9, Enter: 13, Escape: 27, Space: 32, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40,
      Home: 36, End: 35, "+": 187, "-": 189, "0": 48,
    };
    const code = codes[key] ?? key.charCodeAt(0);
    const text = key === "Enter" ? "\r" : key === "Space" ? " " : key.length === 1 ? key : undefined;
    const base = {
      key: key === "Space" ? " " : key,
      code: key === "Space" ? "Space" : key.length === 1 ? undefined : key,
      windowsVirtualKeyCode: code,
      nativeVirtualKeyCode: code,
      modifiers: shift ? 8 : 0,
    };
    await this.send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", text, ...base });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
  }

  async screenshot(fullPage = false) {
    const params = { format: "png", captureBeyondViewport: fullPage };
    if (fullPage) {
      const size = await this.eval(() => ({
        width: document.documentElement.clientWidth,
        height: document.documentElement.scrollHeight,
      }));
      params.clip = { x: 0, y: 0, width: size.width, height: size.height, scale: 1 };
    }
    const { data } = await this.send("Page.captureScreenshot", params);
    return Buffer.from(data, "base64");
  }

  wait(ms) {
    return sleep(ms);
  }
}
