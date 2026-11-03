// Homepage project previews.
//
// Each `.project-media[data-preview]` frame shows its original illustration
// at rest. Hovering the project row (mouse or pen), focusing a link inside it
// with the keyboard, or pressing the frame's button swaps the illustration for
// an animated SVG drawing of the project (js/preview-diagrams.js). The demo
// videos stay on the case studies; the homepage plays none.
//
// Motion: two damped springs per frame drive CSS custom properties:
//   --lift  0..1  the frame rises and gains a soft shadow on hover/focus;
//   --p     0..1  the illustration shrinks away and the drawing grows in.
// Velocity carries across reversals, so a quick in-and-out turns around
// smoothly instead of snapping. Only transform and opacity change.
//
// Rules: one preview at a time; the drawing pauses when the frame scrolls
// away or the tab is hidden; the frame loop sleeps when everything settles.
// Reduced motion: hover/focus do nothing and the button shows a still frame.
// Without JavaScript the illustration stays.

import { Spring, reducedMotion, frameLoop, watchVisibility } from "./motion.js";
import { diagrams } from "./preview-diagrams.js";

const HOVER_INTENT_MS = 120;
const SPRING = { stiffness: 210, damping: 20 };

let current = null;

class Preview {
  constructor(media) {
    this.media = media;
    this.row = media.closest(".project-row") || media.parentElement;
    this.name = media.dataset.name || "project";
    this.active = false;
    this.hovered = false;
    this.source = null;
    this.elapsed = 0;
    this.lift = new Spring(0, SPRING);
    this.p = new Spring(0, SPRING);

    this.stage = document.createElement("div");
    this.stage.className = "preview-stage";
    this.stage.setAttribute("aria-hidden", "true");

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.className = "preview-toggle";
    this.button.setAttribute("aria-pressed", "false");
    this.button.innerHTML = '<span class="preview-chip"><span class="preview-icon" aria-hidden="true"></span></span>';
    this.setButtonLabel();

    media.append(this.stage, this.button);
    media.classList.add("is-enhanced");

    this.loop = frameLoop((dt) => this.tick(dt));
    this.bind();
  }

  setButtonLabel() {
    this.button.setAttribute("aria-label", `${this.active ? "Pause" : "Play"} ${this.name} animation`);
  }

  bind() {
    let intent = 0;
    this.row.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      this.setHover(true);
      if (reducedMotion()) return;
      clearTimeout(intent);
      intent = setTimeout(() => this.start("hover"), HOVER_INTENT_MS);
    });
    this.row.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "touch") return;
      clearTimeout(intent);
      this.setHover(false);
      if (this.source === "hover") this.stop();
    });

    this.row.addEventListener("focusin", (event) => {
      this.setHover(true);
      if (event.target === this.button || reducedMotion()) return;
      let keyboard = true;
      try {
        keyboard = event.target.matches(":focus-visible");
      } catch {
        /* older browsers: treat as keyboard focus */
      }
      if (keyboard && !this.active) this.start("focus");
    });
    this.row.addEventListener("focusout", (event) => {
      if (this.row.contains(event.relatedTarget)) return;
      this.setHover(false);
      if (this.source === "focus") this.stop();
    });

    // The button always does what its label says.
    this.button.addEventListener("click", () => {
      clearTimeout(intent);
      if (this.active) this.stop();
      else this.start("button");
    });

    watchVisibility(this.media, (visible) => {
      if (!visible && this.active) this.stop();
    });
  }

  build() {
    if (this.diagram) return;
    const make = diagrams[this.media.dataset.diagram];
    if (!make) return;
    this.diagram = make();
    this.stage.append(this.diagram.svg);
  }

  setHover(on) {
    this.hovered = on;
    this.lift.to(on ? 1 : 0);
    this.wake();
  }

  wake() {
    if (reducedMotion()) {
      this.lift.set(this.lift.target);
      this.p.set(this.p.target);
      this.apply();
      return;
    }
    this.loop.start();
  }

  start(source) {
    if (current && current !== this) current.stop();
    current = this;
    this.build();
    if (!this.diagram || this.active) return;
    this.active = true;
    this.source = source;
    this.elapsed = 0;
    this.media.classList.add("is-active");
    this.button.setAttribute("aria-pressed", "true");
    this.setButtonLabel();
    this.p.to(1);
    if (reducedMotion()) this.diagram.render(this.diagram.still ?? 0.99);
    else this.diagram.render(0);
    this.wake();
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    this.source = null;
    if (current === this) current = null;
    this.media.classList.remove("is-active");
    this.button.setAttribute("aria-pressed", "false");
    this.setButtonLabel();
    this.p.to(0);
    this.wake();
  }

  apply() {
    this.media.style.setProperty("--lift", this.lift.value.toFixed(4));
    this.media.style.setProperty("--p", this.p.value.toFixed(4));
  }

  tick(dt) {
    const a = this.lift.step(dt);
    const b = this.p.step(dt);
    this.apply();
    if (this.active && this.diagram) {
      this.elapsed += dt;
      const { cycle, once } = this.diagram;
      this.diagram.render(once ? this.elapsed / cycle : (this.elapsed % cycle) / cycle);
      return true;
    }
    return a || b;
  }
}

export function initProjectPreviews(root = document) {
  const frames = Array.from(root.querySelectorAll(".project-media[data-preview]"));
  const instances = frames.map((media) => new Preview(media));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && current) current.stop();
  });
  return instances;
}
