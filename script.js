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

// ── Mobile menu ───────────────────────────────────────────
const toggle = document.getElementById('menuToggle');
const nav    = document.getElementById('siteNav');
if (toggle && nav) {
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => nav.classList.remove('open'))
  );
}

// ── Form handlers ─────────────────────────────────────────
function handleForm(formId, msgId, successText) {
  const form = document.getElementById(formId);
  const msg  = document.getElementById(msgId);
  if (!form || !msg) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    msg.textContent = successText;
    msg.style.color = 'var(--accent)';
    form.reset();
    setTimeout(() => msg.textContent = '', 5000);
  });
}

handleForm('waitlistForm',   'waitlistMessage',   '✓ You're on the list. We'll reach out before launch.');
handleForm('suggestionForm', 'suggestionMessage', '✓ Added to the lab queue. We read every one.');

// ── Typing animation on terminal card ────────────────────
const lines = [
  '> initializing conqueror.lab',
  '> loading experiment graph...',
  '> voice isolation nodes: online',
  '> orchestration agents: online',
  '> MCP bridge layer: online',
  '> LangGraph checkpointer: online',
  '> status: observing behavior in production',
];

const terminalBody = document.querySelector('.terminal-body');
if (terminalBody) {
  // Static render — could be replaced with animated typewriter if desired
  // Currently rendered from HTML; this block can be used for dynamic updates
}
