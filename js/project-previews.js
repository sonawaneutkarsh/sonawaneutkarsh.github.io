// Homepage project previews.
//
// Each `.project-media[data-preview]` frame shows its original illustration
// at rest. Hovering the project row (mouse or pen), focusing a link inside it
// with the keyboard, or pressing the frame's "Play preview" button swaps the
// illustration for either an existing demo video (Nytr, Clage) or an animated
// architecture diagram (Talks, Devvy).
//
// Rules: only one preview runs at a time; videos are muted, created on first
// use, never preloaded, and pause when the pointer leaves, the frame scrolls
// away, or the tab is hidden. With reduced motion, hover and focus do nothing
// and the button shows a still frame of the diagram (videos play only when the
// visitor presses the button). Without JavaScript the illustration stays.

import { reducedMotion, frameLoop, watchVisibility } from "./motion.js";
import { diagrams, clageNetwork } from "./preview-diagrams.js";

const HOVER_INTENT_MS = 140;
const NETWORK_MIN_MS = 1100;

let current = null;

const saveData = () => Boolean(navigator.connection && navigator.connection.saveData);

class Preview {
  constructor(media) {
    this.media = media;
    this.row = media.closest(".project-row") || media.parentElement;
    this.kind = media.dataset.preview;
    this.name = media.dataset.name || "project";
    this.active = false;
    this.source = null;
    this.built = false;
    this.elapsed = 0;

    this.stage = document.createElement("div");
    this.stage.className = "preview-stage";
    this.stage.setAttribute("aria-hidden", "true");

    this.caption = document.createElement("span");
    this.caption.className = "preview-caption";
    this.caption.setAttribute("aria-hidden", "true");
    this.caption.textContent = media.dataset.caption || "";

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.className = "preview-toggle";
    this.button.setAttribute("aria-pressed", "false");
    this.button.innerHTML = '<span class="preview-chip"><span class="preview-icon" aria-hidden="true"></span><span class="preview-text">Preview</span></span>';
    this.setButtonLabel();

    media.append(this.stage, this.caption, this.button);
    media.classList.add("is-enhanced");

    this.loop = frameLoop((dt) => this.tick(dt));
    this.bind();
  }

  setButtonLabel() {
    const verb = this.active ? "Pause" : "Play";
    const what = this.kind === "video" ? "demo preview" : "animated diagram";
    this.button.setAttribute("aria-label", `${verb} ${this.name} ${what}`);
    this.button.querySelector(".preview-text").textContent = this.active ? "Pause" : "Preview";
  }

  bind() {
    let intent = 0;
    this.row.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch" || reducedMotion()) return;
      clearTimeout(intent);
      intent = setTimeout(() => this.start("hover"), HOVER_INTENT_MS);
    });
    this.row.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "touch") return;
      clearTimeout(intent);
      if (this.source === "hover") this.stop();
    });

    this.row.addEventListener("focusin", (event) => {
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
      if (this.source === "focus" && !this.row.contains(event.relatedTarget)) this.stop();
    });

    // The button always does what its label says: Pause stops, Preview plays.
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
    if (this.built) return;
    this.built = true;
    if (this.kind === "video") {
      const video = document.createElement("video");
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "none";
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("disablepictureinpicture", "");
      video.setAttribute("tabindex", "-1");
      if (this.media.dataset.poster) video.poster = this.media.dataset.poster;
      const source = document.createElement("source");
      source.src = this.media.dataset.video;
      source.type = "video/mp4";
      video.append(source);
      video.addEventListener("playing", () => {
        this.media.classList.add("is-playing");
        if (!this.loop.running) this.media.classList.remove("is-network");
      });
      video.addEventListener("error", () => this.media.classList.add("is-video-failed"), true);
      this.video = video;
      this.stage.append(video);
      if (this.media.dataset.overlay === "network") {
        this.network = clageNetwork();
        this.network.svg.classList.add("preview-network");
        this.stage.append(this.network.svg);
      }
    } else {
      const make = diagrams[this.media.dataset.diagram];
      if (!make) return;
      this.diagram = make();
      this.stage.append(this.diagram.svg);
    }
  }

  start(source) {
    if (current && current !== this) current.stop();
    current = this;
    this.build();
    if (this.active) return;
    this.source = source;
    this.active = true;
    this.elapsed = 0;
    this.media.classList.add("is-active");
    this.button.setAttribute("aria-pressed", "true");
    this.setButtonLabel();

    const still = reducedMotion();
    if (this.video) {
      if (source === "hover" && saveData()) {
        this.media.classList.add("is-poster-only");
        return;
      }
      if (this.network) {
        this.media.classList.add("is-network");
        this.network.render(still ? 0.99 : 0);
      }
      const playing = this.video.play();
      if (playing && playing.catch) {
        playing.catch(() => this.media.classList.add("is-poster-only"));
      }
      if (this.network && !still) this.loop.start();
    } else if (this.diagram) {
      if (still) this.diagram.render(this.diagram.still ?? 0.99);
      else this.loop.start();
    }
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    this.source = null;
    if (current === this) current = null;
    this.media.classList.remove("is-active", "is-network", "is-poster-only");
    this.button.setAttribute("aria-pressed", "false");
    this.setButtonLabel();
    if (this.video) this.video.pause();
    // Let the stage fade out before the loop sleeps.
    setTimeout(() => {
      if (!this.active) this.loop.stop();
    }, 260);
  }

  tick(dt) {
    this.elapsed += dt;
    if (this.diagram) {
      if (!this.active) return false;
      this.diagram.render((this.elapsed % this.diagram.cycle) / this.diagram.cycle);
      return true;
    }
    if (this.network) {
      const t = Math.min(this.elapsed / this.network.cycle, 0.999);
      this.network.render(t);
      const ready = this.media.classList.contains("is-playing") && this.elapsed > NETWORK_MIN_MS;
      if (ready || !this.active) {
        this.media.classList.remove("is-network");
        return false;
      }
      return true;
    }
    return false;
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
