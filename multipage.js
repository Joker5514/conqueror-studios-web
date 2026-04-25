// ===== INTERSECTION OBSERVER: animate-fade-up =====
(function() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.animate-fade-up').forEach((el) => {
    observer.observe(el);
  });

  // Trigger immediately for above-fold elements
  setTimeout(() => {
    document.querySelectorAll('.animate-fade-up').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('visible');
      }
    });
  }, 100);

  // ===== WAITLIST FORM HANDLER =====
  const waitlistForm = document.getElementById('waitlistForm');
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = waitlistForm.querySelector('button[type="submit"]');
      btn.textContent = '✅ You\'re on the list!';
      btn.disabled = true;
      btn.style.background = '#00c851';
    });
  }

  // ===== SUPPORT FORM HANDLER =====
  const supportForm = document.getElementById('supportForm');
  if (supportForm) {
    supportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = supportForm.querySelector('button[type="submit"]');
      btn.textContent = '✅ Message Sent!';
      btn.disabled = true;
      btn.style.background = '#00c851';
    });
  }

  // ===== PARALLAX HERO =====
  window.addEventListener('scroll', () => {
    const heroes = document.querySelectorAll('.page-hero');
    heroes.forEach((hero) => {
      const scrolled = window.scrollY;
      hero.style.backgroundPositionY = scrolled * 0.4 + 'px';
    });
  });
})();
