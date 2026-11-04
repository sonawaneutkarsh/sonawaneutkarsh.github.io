// Shared motion helpers for the V3 interactions: a damped spring, a frame
// loop that sleeps when nothing moves, and a live reduced-motion flag.
// No dependencies. Everything here is an enhancement; pages work without it.

const query =
  typeof matchMedia === "function"
    ? matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener() {} };

/** True while the visitor asks for reduced motion. Re-read on every use. */
export function reducedMotion() {
  return query.matches;
}

/** Call `fn(matches)` whenever the reduced-motion preference changes. */
export function onReducedMotionChange(fn) {
  query.addEventListener("change", (event) => fn(event.matches));
}

/** True on touch-first devices: the primary pointer is a finger and cannot hover. */
export function coarsePointer() {
  return typeof matchMedia === "function" && matchMedia("(hover: none) and (pointer: coarse)").matches;
}

/**
 * A one-dimensional damped harmonic spring.
 *
 * Integrated with semi-implicit Euler in fixed 4 ms substeps so the result does
 * not depend on the display's refresh rate. Velocity is kept when the target
 * changes, so reversing mid-flight turns around smoothly instead of snapping.
 */
export class Spring {
  constructor(value = 0, { stiffness = 170, damping = 20, mass = 1, precision = 0.001 } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
    this.precision = precision;
  }

  to(target) {
    this.target = target;
    return this;
  }

  set(value) {
    this.value = this.target = value;
    this.velocity = 0;
    return this;
  }

  get resting() {
    return (
      Math.abs(this.velocity) < this.precision * 10 &&
      Math.abs(this.target - this.value) < this.precision
    );
  }

  /** Advance by `ms` milliseconds; returns true while still moving. */
  step(ms) {
    if (this.resting) {
      this.value = this.target;
      this.velocity = 0;
      return false;
    }
    const h = 0.004;
    let remaining = Math.min(ms, 64) / 1000;
    while (remaining > 0) {
      const dt = Math.min(h, remaining);
      const force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
      this.velocity += (force / this.mass) * dt;
      this.value += this.velocity * dt;
      remaining -= dt;
    }
    return true;
  }
}

/**
 * requestAnimationFrame loop that runs only while `step(dt, now)` returns
 * true. `start()` is idempotent, so callers can wake it on every input event.
 */
export function frameLoop(step) {
  let handle = 0;
  let last = 0;
  function tick(now) {
    const dt = Math.max(0, Math.min(now - last, 64));
    last = now;
    handle = 0;
    if (step(dt, now) && !handle) handle = requestAnimationFrame(tick);
  }
  return {
    start() {
      if (handle) return;
      last = performance.now();
      handle = requestAnimationFrame(tick);
    },
    stop() {
      cancelAnimationFrame(handle);
      handle = 0;
    },
    get running() {
      return handle !== 0;
    },
  };
}

/** Clamp `t` into [0, 1]. */
export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Map `value` from [a, b] onto [0, 1], clamped. Useful for staging one spring into phases. */
export const phase = (value, a, b) => clamp01((value - a) / (b - a));

/** Linear interpolation. */
export const mix = (a, b, t) => a + (b - a) * t;

/** Smoothstep easing for derived phases. */
export const ease = (t) => t * t * (3 - 2 * t);

/** Point at fraction `t` along an SVG geometry element. */
export function pointAt(path, t) {
  const length = path.getTotalLength();
  return path.getPointAtLength(clamp01(t) * length);
}

/**
 * Observe whether `element` is on screen; calls `fn(visible)` on change.
 * Falls back to "always visible" when IntersectionObserver is unavailable.
 */
export function watchVisibility(element, fn, rootMargin = "0px") {
  if (!("IntersectionObserver" in window)) {
    fn(true);
    return () => {};
  }
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => fn(entry.isIntersecting)),
    { rootMargin },
  );
  observer.observe(element);
  return () => observer.disconnect();
}

export const SVG_NS = "http://www.w3.org/2000/svg";

/** Create an SVG element with attributes. */
export function svg(tag, attrs = {}, parent) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (parent) parent.appendChild(node);
  return node;
}
