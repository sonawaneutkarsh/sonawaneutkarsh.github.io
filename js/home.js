// Homepage entry point (ES module, deferred by default).
// Loaded only on `/`; blog posts and case studies never fetch these files.

import { reducedMotion } from "./motion.js";
import { initProjectPreviews } from "./project-previews.js";

function initReveal() {
  if (reducedMotion() || !("IntersectionObserver" in window)) return;
  const targets = Array.from(document.querySelectorAll("[data-reveal]"));
  // Only hide what is still below the fold, so nothing visible ever blinks out,
  // and never when the page was opened at a fragment (e.g. /#research).
  if (window.location.hash) return;
  const fold = window.innerHeight * 0.92;
  const pending = targets.filter((el) => el.getBoundingClientRect().top > fold);
  if (!pending.length) return;
  document.documentElement.classList.add("motion-ok");
  pending.forEach((el) => el.classList.add("is-pending"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("is-pending");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  pending.forEach((el) => observer.observe(el));
  // Safety net: anything reached by an in-page jump or find-in-page shows at once.
  const reveal = () => pending.forEach((el) => el.classList.remove("is-pending"));
  window.addEventListener("hashchange", reveal, { once: true });
  window.addEventListener("beforeprint", reveal, { once: true });
}

function start() {
  initReveal();
  initProjectPreviews();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
