// ==========================================================================
// Projects Filter Pills (Client-side JS, No Reload)
// ==========================================================================
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (!filterBtns.length || !projectCards.length) return;

  function filterProjects(topic) {
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.topic === topic);
    });

    projectCards.forEach(card => {
      const topics = JSON.parse(card.dataset.topics || '[]');
      const matches = (topic === 'all') || topics.includes(topic);

      if (matches) {
        card.removeAttribute('hidden');
        card.classList.remove('entering');
        // Force reflow for animation restart
        void card.offsetWidth;
        card.classList.add('entering');
      } else {
        card.setAttribute('hidden', '');
        card.classList.remove('entering');
      }
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const topic = btn.dataset.topic;
      filterProjects(topic);
    });
  });

  // Support clicking links in bio with data-filter attribute
  document.querySelectorAll('a[data-filter]').forEach(link => {
    link.addEventListener('click', () => {
      const topic = link.dataset.filter;
      const targetBtn = document.querySelector(`.filter-btn[data-topic="${topic}"]`);
      if (targetBtn) {
        targetBtn.click();
      }
    });
  });
}

// ==========================================================================
// Copy Email Tooltip
// ==========================================================================
function initCopyEmail() {
  const emailButtons = document.querySelectorAll('button[data-email]');
  emailButtons.forEach(btn => {
    const tooltip = btn.querySelector('.tooltip');
    const email = btn.dataset.email;

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(email);
        if (tooltip) {
          tooltip.textContent = 'Copied!';
          tooltip.classList.add('show');
          setTimeout(() => {
            tooltip.classList.remove('show');
            tooltip.textContent = 'Click to copy';
          }, 1800);
        }
      } catch (err) {
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
  const tocLinks = Array.from(document.querySelectorAll('.toc-list a'));
  if (!tocLinks.length) return;

  const targetElements = tocLinks.map(link => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return null;
    const id = href.slice(1);
    const el = document.getElementById(id);
    return el ? { link, el, id } : null;
  }).filter(Boolean);

  if (!targetElements.length) return;

  function setActive(activeLink) {
    tocLinks.forEach(link => {
      link.classList.toggle('active', link === activeLink);
    });
  }

  function updateTOC() {
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const scrollBottom = window.innerHeight + scrollY;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
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

  tocLinks.forEach(link => {
    link.addEventListener('click', () => {
      setActive(link);
    });
  });

  window.addEventListener('scroll', updateTOC, { passive: true });
  window.addEventListener('resize', updateTOC, { passive: true });
  updateTOC();
}

// ==========================================================================
// Lifecycle Init
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initProjectFilters();
  initCopyEmail();
  initTOC();
});
