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
  const tocLinks = document.querySelectorAll('.toc-list a');
  const headings = Array.from(document.querySelectorAll('.prose h2, .prose h3'));

  if (!tocLinks.length || !headings.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        tocLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, {
    rootMargin: '0px 0px -70% 0px',
    threshold: 0.1
  });

  headings.forEach(h => {
    if (h.id) observer.observe(h);
  });
}

// ==========================================================================
// Lifecycle Init
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initProjectFilters();
  initCopyEmail();
  initTOC();
});
