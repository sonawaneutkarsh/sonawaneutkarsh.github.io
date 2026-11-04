// ==========================================================================
// Copy Email Tooltip
// ==========================================================================
function initCopyEmail() {
  const emailButtons = document.querySelectorAll("button[data-email]");
  emailButtons.forEach((btn) => {
    const tooltip = btn.querySelector(".tooltip");
    const email = btn.dataset.email;

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(email);
        if (tooltip) {
          tooltip.textContent = "Copied!";
          tooltip.classList.add("show");
          setTimeout(() => {
            tooltip.classList.remove("show");
            tooltip.textContent = "";
          }, 1800);
        }
      } catch (err) {
        if (tooltip)
          tooltip.textContent = "Could not copy. Opening your email app.";
        // Fallback for clipboard permission failure
        window.location.href = `mailto:${email}`;
      }
    });
  });
}

// ==========================================================================
// Sticky TOC Sidebar (Scrollspy for Blog & Deep Dive Case Studies)
// ==========================================================================
function initTOC() {
  const tocLinks = Array.from(document.querySelectorAll(".toc-list a"));
  if (!tocLinks.length) return;

  const uniqueLinks = [
    ...new Map(
      tocLinks.map((link) => [link.getAttribute("href"), link]),
    ).values(),
  ];
  const targetElements = uniqueLinks
    .map((link) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return null;
      const id = href.slice(1);
      const el = document.getElementById(id);
      return el ? { link, el, id } : null;
    })
    .filter(Boolean);

  if (!targetElements.length) return;

  function setActive(activeLink) {
    tocLinks.forEach((link) => {
      const active =
        link.getAttribute("href") === activeLink.getAttribute("href");
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function updateTOC() {
    const scrollY =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      0;
    const scrollBottom = window.innerHeight + scrollY;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
    );

    // 1. If at or near bottom of page (within 100px), highlight the very last TOC item
    if (scrollBottom >= docHeight - 100) {
      setActive(targetElements[targetElements.length - 1].link);
      return;
    }

    // 2. Otherwise find the current active section based on top offset
    let activeItem = targetElements[0];
    for (let i = 0; i < targetElements.length; i++) {
      const rect = targetElements[i].el.getBoundingClientRect();
      if (rect.top <= 140) {
        activeItem = targetElements[i];
      } else {
        break;
      }
    }
    setActive(activeItem.link);
  }

  tocLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setActive(link);
    });
  });

  window.addEventListener("scroll", updateTOC, { passive: true });
  window.addEventListener("resize", updateTOC, { passive: true });
  updateTOC();
}

// ==========================================================================
// Primary navigation: mark the section the current page belongs to
// ==========================================================================
function initNavState() {
  const path = window.location.pathname;
  const sections = [
    ["/notebook/", "/notebook/"],
    ["/blog/", "/blog/"],
    ["/projects/", "/#projects"],
    ["/explore/", "/#projects"],
  ];
  const match = sections.find(([prefix]) => path.startsWith(prefix));
  if (!match) return;
  document
    .querySelectorAll('nav[aria-label="Primary"] a')
    .forEach((link) => {
      if (link.getAttribute("href") === match[1]) {
        link.setAttribute("aria-current", path === match[0] ? "page" : "true");
      }
    });
}

// ==========================================================================
// Lifecycle Init
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initCopyEmail();
  initTOC();
  initNavState();
});
