// Illustrated self-portrait in the homepage introduction.
//
// The drawing is inline SVG in index.html, so it shows without JavaScript
// and costs no extra request. This module adds a little life on top of it:
//
//   Mouse or pen hover   The character notices the pointer: the pupils turn
//                        toward it, the head tilts 2–3°, the hair follows a
//                        beat later, it blinks once and a glint crosses the
//                        glasses. While the pointer moves over the drawing
//                        the eyes follow it, within the eye.
//   Pointer leaves       Everything springs back to the rest drawing.
//   Touch screens        One short greeting the first time the portrait is
//                        on screen, and again on a tap. No touch listeners
//                        that could hold up scrolling.
//   Reduced motion       Nothing moves.
//
// Every moving part is a separate SVG group (head, hair, features, pupils,
// lids, lashes, brows, glint) moved by transforms only, from the damped
// springs in motion.js. Velocity carries over when a target changes, so a
// quick in-and-out turns around instead of snapping. Blinks and the glint
// are short timed curves. The frame loop stops once everything settles, and
// the last frame puts back the drawing's own transforms.

import { Spring, frameLoop, reducedMotion, onReducedMotionChange, coarsePointer, watchVisibility, mix, ease } from "./motion.js";

// Geometry, in viewBox units (see the drawing in index.html).
const NECK = "100 158"; // the head tilts around the top of the neck
const SCALP = "100 72"; // the hair sways around the crown
const EYES = { x: 100, y: 105.3 }; // between the pupils
const LASH_X = [81.5, 118.5]; // eye centres, for flattening the lash line
const LASH_Y = 101.6;
const LID_DROP = 7.4; // how far a lid travels to close its eye

// Motion limits.
const PUPIL = { x: 2.4, y: 1.2 }; // inside the eye white
const FEATURES = { x: 1.2, y: 0.6 }; // features drift with the gaze: a hint of a turn
const HEAD = { x: 0.8, y: 0.5 }; // the head leans a touch toward the pointer
const TILT = { min: 2, max: 3 }; // degrees; spring overshoot stays under 4°
const BROW = [1.5, 1.1]; // raise of the left and right brow when noticing
const REACH = 0.42; // pointer distance (× drawing width) that counts as "far"

const BLINK = { close: 75, hold: 40, open: 140 };
const BLINK_MS = BLINK.close + BLINK.hold + BLINK.open;
const GLINT = { ms: 560, from: 50, to: 152, y: 110, opacity: 0.5 };
const HEAD_LAG = 70; // the eyes move first, the head follows...
const HAIR_LAG = 90; // ...and the hair a beat after the head

function lidAt(ms) {
  if (ms <= 0 || ms >= BLINK_MS) return 0;
  if (ms < BLINK.close) return ease(ms / BLINK.close);
  if (ms < BLINK.close + BLINK.hold) return 1;
  return 1 - ease((ms - BLINK.close - BLINK.hold) / BLINK.open);
}

const f2 = (n) => (Math.abs(n) < 0.005 ? "0" : n.toFixed(2));

class Portrait {
  constructor(svg) {
    this.svg = svg;
    const all = (selector) => Array.from(svg.querySelectorAll(selector));
    this.head = svg.querySelector(".pt-head");
    this.hair = svg.querySelector(".pt-hair");
    this.features = svg.querySelector(".pt-features");
    this.pupils = all(".pt-pupil");
    this.lids = all(".pt-lid");
    this.lashes = all(".pt-lash");
    this.brows = all(".pt-brow");
    this.glint = svg.querySelector(".pt-glint");
    this.moving = [this.head, this.hair, this.features, ...this.pupils, ...this.lids, ...this.lashes, ...this.brows, this.glint];
    // The drawing's own transforms (the lids sit above the eyes), restored at rest.
    this.initial = new Map(this.moving.map((el) => [el, el.getAttribute("transform")]));
    this.written = new Map();
    const box = svg.viewBox.baseVal;
    this.view = { x: box.x, y: box.y, w: box.width || 200 };

    // Precision is in each spring's own unit, chosen so the last step is far
    // below a pixel (0.01° of tilt moves the hair by about 0.01 px).
    const look = { stiffness: 240, damping: 24, precision: 0.002 };
    this.lookX = new Spring(0, look);
    this.lookY = new Spring(0, look);
    this.tilt = new Spring(0, { stiffness: 120, damping: 14, precision: 0.01 });
    // Hair: a softer, underdamped spring that chases the same tilt a beat
    // later, so it trails the head and swings slightly past before settling.
    this.sway = new Spring(0, { stiffness: 70, damping: 7.5, precision: 0.01 });
    this.brow = new Spring(0, { stiffness: 190, damping: 17, precision: 0.004 });
    this.springs = [this.lookX, this.lookY, this.tilt, this.sway, this.brow];

    this.side = 1;
    this.hovered = false;
    this.noticedAt = -Infinity;
    this.blinkAt = -Infinity;
    this.glintAt = -Infinity;
    this.greetedAt = -Infinity;
    this.pendingTilt = null;
    this.pendingSway = null;
    this.loop = frameLoop((dt, now) => this.frame(dt, now));
  }

  /** Normalized gaze target for a pointer position: a vector of length ≤ 1. */
  lookAt(clientX, clientY) {
    const r = this.svg.getBoundingClientRect();
    const scale = r.width / this.view.w;
    const reach = r.width * REACH;
    let x = (clientX - (r.left + (EYES.x - this.view.x) * scale)) / reach;
    let y = (clientY - (r.top + (EYES.y - this.view.y) * scale)) / reach;
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    return { x, y };
  }

  aim({ x, y }, now = performance.now()) {
    this.lookX.to(x);
    this.lookY.to(y);
    // Lean toward the side the pointer is on; a dead zone keeps the head from
    // flipping back and forth while the pointer crosses the middle.
    if (x > 0.2) this.side = 1;
    else if (x < -0.2) this.side = -1;
    const tilt = this.side * mix(TILT.min, TILT.max, Math.min(1, Math.abs(x)));
    if (now - this.noticedAt < HEAD_LAG) this.pendingTilt = tilt;
    else this.tiltTo(tilt);
  }

  tiltTo(degrees) {
    this.pendingTilt = null;
    this.tilt.to(degrees);
    this.pendingSway = degrees;
  }

  notice(target) {
    const now = performance.now();
    this.side = target.x < 0 ? -1 : 1;
    this.noticedAt = now;
    this.aim(target, now);
    this.brow.to(1);
    if (now - this.blinkAt > 1400) this.blinkAt = now + 120;
    if (now - this.glintAt > 2400) this.glintAt = now + 80;
    this.loop.start();
  }

  rest() {
    this.pendingTilt = null;
    this.lookX.to(0);
    this.lookY.to(0);
    this.tiltTo(0);
    this.brow.to(0);
    this.loop.start();
  }

  /** Touch: glance at the name, blink, then settle. Also used for a tap. */
  greet() {
    const now = performance.now();
    if (reducedMotion() || this.hovered || now - this.greetedAt < 1600) return;
    this.greetedAt = now;
    const name = document.querySelector(".bio h1");
    let target = { x: 0.7, y: -0.2 };
    if (name) {
      const r = name.getBoundingClientRect();
      const toward = this.lookAt(r.left + Math.min(r.width, 160) / 2, r.top + r.height / 2);
      const length = Math.hypot(toward.x, toward.y) || 1;
      target = { x: (toward.x / length) * 0.75, y: (toward.y / length) * 0.75 };
    }
    this.notice(target);
    clearTimeout(this.greetEnd);
    this.greetEnd = setTimeout(() => this.hovered || this.rest(), 1150);
  }

  /** While hovered, blink again now and then (a timer, not a frame loop). */
  scheduleBlink() {
    clearTimeout(this.idleBlink);
    this.idleBlink = setTimeout(() => {
      if (!this.hovered || reducedMotion()) return;
      this.blinkAt = performance.now();
      this.loop.start();
      this.scheduleBlink();
    }, 4000 + Math.random() * 2500);
  }

  /** Reduced motion switched on: drop straight back to the rest drawing. */
  halt() {
    this.hovered = false;
    clearTimeout(this.idleBlink);
    clearTimeout(this.greetEnd);
    this.springs.forEach((s) => s.set(0));
    this.blinkAt = this.glintAt = -Infinity;
    this.pendingTilt = this.pendingSway = null;
    this.loop.stop();
    this.restore();
  }

  frame(dt, now) {
    if (this.pendingTilt !== null && now - this.noticedAt >= HEAD_LAG) this.tiltTo(this.pendingTilt);
    if (this.pendingSway !== null && now - this.noticedAt >= HEAD_LAG + HAIR_LAG) {
      this.sway.to(this.pendingSway);
      this.pendingSway = null;
    }
    // After the first surprise, the brows relax to a small attentive lift.
    if (this.brow.target === 1 && now - this.noticedAt > 520) this.brow.to(this.hovered ? 0.35 : 0);
    let moving = false;
    for (const spring of this.springs) moving = spring.step(dt) || moving;
    const timed =
      now < this.blinkAt + BLINK_MS ||
      now < this.glintAt + GLINT.ms ||
      this.pendingTilt !== null ||
      this.pendingSway !== null ||
      this.brow.target === 1;
    if (moving || timed) {
      this.render(now);
      return true;
    }
    // Settled: hold the pose while hovered, or put the drawing back exactly.
    if (this.springs.every((s) => s.value === 0)) this.restore();
    else this.render(now);
    return false;
  }

  write(el, attr, value) {
    const key = attr === "transform" ? el : `${attr}:${this.moving.indexOf(el)}`;
    if (this.written.get(key) === value) return;
    this.written.set(key, value);
    if (value === null) el.removeAttribute(attr);
    else el.setAttribute(attr, value);
  }

  render(now) {
    const x = this.lookX.value;
    const y = this.lookY.value;
    const tilt = this.tilt.value;
    const lift = this.brow.value;
    this.write(this.head, "transform", `translate(${f2(x * HEAD.x)} ${f2(y * HEAD.y - lift * 0.5)}) rotate(${f2(tilt)} ${NECK})`);
    this.write(this.hair, "transform", `translate(${f2(-x * 0.5)} ${f2(-lift * 0.9)}) rotate(${f2(this.sway.value - tilt)} ${SCALP})`);
    this.write(this.features, "transform", `translate(${f2(x * FEATURES.x)} ${f2(y * FEATURES.y)})`);
    const pupil = `translate(${f2(x * PUPIL.x)} ${f2(y * PUPIL.y)})`;
    this.pupils.forEach((el) => this.write(el, "transform", pupil));
    this.brows.forEach((el, i) => this.write(el, "transform", `translate(0 ${f2(-lift * BROW[i])})`));

    const lid = lidAt(now - this.blinkAt);
    this.lids.forEach((el) => this.write(el, "transform", `translate(0 ${f2(-LID_DROP * (1 - lid))})`));
    this.lashes.forEach((el, i) =>
      this.write(
        el,
        "transform",
        lid > 0.001
          ? `translate(${LASH_X[i]} ${f2(LASH_Y + 4.8 * lid)}) scale(1 ${(1 - 0.72 * lid).toFixed(3)}) translate(${-LASH_X[i]} ${-LASH_Y})`
          : null,
      ),
    );

    const u = (now - this.glintAt) / GLINT.ms;
    const shine = u > 0 && u < 1;
    this.write(this.glint, "transform", shine ? `translate(${f2(mix(GLINT.from, GLINT.to, ease(u)))} ${GLINT.y})` : null);
    this.write(this.glint, "opacity", shine ? (Math.sin(Math.PI * u) * GLINT.opacity).toFixed(3) : "0");
  }

  /** Put back the drawing exactly as it is in the HTML. */
  restore() {
    for (const el of this.moving) this.write(el, "transform", this.initial.get(el));
    this.write(this.glint, "opacity", "0");
  }

  bind() {
    const svg = this.svg;
    svg.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch" || reducedMotion()) return;
      this.hovered = true;
      clearTimeout(this.greetEnd);
      this.notice(this.lookAt(event.clientX, event.clientY));
      this.scheduleBlink();
    });
    svg.addEventListener("pointermove", (event) => {
      if (!this.hovered || event.pointerType === "touch") return;
      this.aim(this.lookAt(event.clientX, event.clientY));
      this.loop.start();
    });
    svg.addEventListener("pointerleave", (event) => {
      if (!this.hovered || event.pointerType === "touch") return;
      this.hovered = false;
      clearTimeout(this.idleBlink);
      this.rest();
    });
    // A tap is a click whose pointer was a finger; scrolling never fires one.
    let lastPointer = "";
    svg.addEventListener("pointerdown", (event) => (lastPointer = event.pointerType));
    svg.addEventListener("click", () => lastPointer === "touch" && this.greet());
    onReducedMotionChange((reduce) => reduce && this.halt());
  }
}

export function initPortrait(root = document) {
  const svg = root.querySelector("svg.portrait");
  if (!svg) return null;
  const portrait = new Portrait(svg);
  portrait.bind();
  // Touch-first screens cannot hover: greet once, the first time it is seen.
  if (coarsePointer() && !reducedMotion()) {
    let seen = false;
    let stop = null;
    stop = watchVisibility(svg, (visible) => {
      if (!visible || seen) return;
      seen = true;
      if (stop) stop();
      // Early, so its glance and blink come before the hero icons' tour (500 ms).
      setTimeout(() => portrait.greet(), 200);
    });
    if (seen && stop) stop();
  }
  return portrait;
}
