/* Conqueror Studios — R&D Lab Edition scripts */

// ── Reveal on scroll ──────────────────────────────────────
const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Animated stat counters ────────────────────────────────
const counterObserver = new IntersectionObserver(
  (entries) => entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      counterObserver.unobserve(e.target);
    }
  }),
  { threshold: 0.5 }
);

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1400;
  const step = 16;
  const increment = target / (duration / step);
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + increment, target);
    el.textContent = Math.round(current) + (target >= 100 ? '+' : '');
    if (current >= target) clearInterval(timer);
  }, step);
}

// ── Active nav highlighting ───────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.site-nav a');

// Path-based active state for multi-page navigation
const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
navLinks.forEach(link => {
  const href = link.getAttribute('href');
  if (href && !href.startsWith('#')) {
    const linkPath = href.replace(/\/$/, '') || '/';
    if (linkPath === currentPath) link.classList.add('active');
  }
});

// Anchor-based scrollspy only when nav has anchor links (single-page mode)
const hasAnchorNav = Array.from(navLinks).some(a => (a.getAttribute('href') || '').startsWith('#'));
if (hasAnchorNav) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + entry.target.id) {
              link.classList.add('active');
            }
          });
        }
      });
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );
  sections.forEach(sec => navObserver.observe(sec));
}

// Support contact form handler
handleForm(‘contactForm’, ‘contactMessage’, ‘✓ Message received. We’ll be in touch within 24 hours.’);

// ── Mobile menu ───────────────────────────────────────────
const toggle = document.getElementById('menuToggle');
const nav    = document.getElementById('siteNav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
  nav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );
  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}

// ── Form handlers ─────────────────────────────────────────
function handleForm(formId, msgId, successText) {
  const form = document.getElementById(formId);
  const msg  = document.getElementById(msgId);
  if (!form || !msg) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    // Basic HTML5 validation check
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    // Simulate async submission (replace with real fetch)
    setTimeout(() => {
      msg.textContent = successText;
      msg.style.color = 'var(--accent)';
      form.reset();
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Submit'; }
      setTimeout(() => msg.textContent = '', 6000);
    }, 800);
  });
  // Cache original button label
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.dataset.label = btn.textContent;
}

handleForm('waitlistForm',   'waitlistMessage',   '\u2713 You\u2019re on the list. We\u2019ll reach out before launch.');
handleForm('suggestionForm', 'suggestionMessage', '\u2713 Added to the lab queue. We read every one.');

// ── Typewriter animation on terminal card ────────────────
const terminalLines = [
  { text: '> initializing conqueror.lab', className: '' },
  { text: '> loading experiment graph...', className: '' },
  { text: '> voice isolation nodes: ', suffix: 'online', suffixClass: 't-green' },
  { text: '> orchestration agents: ', suffix: 'online', suffixClass: 't-green' },
  { text: '> MCP bridge layer: ', suffix: 'online', suffixClass: 't-green' },
  { text: '> LangGraph checkpointer: ', suffix: 'online', suffixClass: 't-green' },
  { text: '> status: ', suffix: 'observing behavior in production', suffixClass: 't-accent', isAccent: true },
];

const terminalBody = document.getElementById('terminalBody');

if (terminalBody) {
  // Insert a blinking cursor element
  const cursor = document.createElement('span');
  cursor.className = 'terminal-cursor';

  let lineIndex = 0;
  let charIndex = 0;
  let currentP = null;
  let phase = 'main'; // 'main' | 'suffix'

  function typeNext() {
    if (lineIndex >= terminalLines.length) {
      // Done: show cursor at end of last line
      if (currentP) currentP.appendChild(cursor);
      return;
    }

    const line = terminalLines[lineIndex];

    if (charIndex === 0) {
      // Create new paragraph for this line
      currentP = document.createElement('p');
      if (line.isAccent) currentP.classList.add('accent-line');
      terminalBody.appendChild(cursor); // cursor at bottom during typing
      terminalBody.appendChild(currentP); // will be after cursor temporarily — swap:
      terminalBody.insertBefore(currentP, cursor);
    }

    const fullText = phase === 'main' ? line.text : (line.suffix || '');

    if (charIndex < fullText.length) {
      if (phase === 'suffix') {
        // Build suffix span if not already
        let suffixSpan = currentP.querySelector('.' + line.suffixClass);
        if (!suffixSpan) {
          suffixSpan = document.createElement('span');
          suffixSpan.className = line.suffixClass;
          currentP.appendChild(suffixSpan);
        }
        suffixSpan.textContent = fullText.slice(0, charIndex + 1);
      } else {
        // Write plain text node
        if (!currentP._textNode) {
          currentP._textNode = document.createTextNode('');
          currentP.appendChild(currentP._textNode);
        }
        currentP._textNode.textContent = fullText.slice(0, charIndex + 1);
      }
      charIndex++;
      setTimeout(typeNext, 28);
    } else {
      // Current segment done
      if (phase === 'main' && line.suffix) {
        phase = 'suffix';
        charIndex = 0;
        setTimeout(typeNext, 28);
      } else {
        // Move to next line
        lineIndex++;
        charIndex = 0;
        phase = 'main';
        setTimeout(typeNext, 120);
      }
    }
  }

  // Start after a short delay so page load feels clean
  setTimeout(typeNext, 600);
}
