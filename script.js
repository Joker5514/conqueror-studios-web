const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    siteNav.classList.toggle("open");
    document.body.classList.toggle("menu-open");
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      document.body.classList.remove("menu-open");
    });
  });
}

const revealNodes = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealNodes.forEach((node) => observer.observe(node));

const animateCounters = () => {
  const counters = document.querySelectorAll("[data-target]");

  counters.forEach((counter) => {
    const target = Number(counter.dataset.target || 0);
    const duration = 1200;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.floor(progress * target);
      counter.textContent = value;
      if (progress < 1) requestAnimationFrame(step);
      else counter.textContent = target;
    };

    requestAnimationFrame(step);
  });
};

animateCounters();

function wireForm(formId, messageId, responseText) {
  const form = document.getElementById(formId);
  const message = document.getElementById(messageId);

  if (!form || !message) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const fields = Array.from(formData.entries());
    const hasContent = fields.some(([, value]) => String(value).trim().length > 0);

    if (!hasContent) {
      message.textContent = "Please complete the form first.";
      return;
    }

    message.textContent = responseText;
    form.reset();
  });
}

wireForm(
  "waitlistForm",
  "waitlistMessage",
  "You're on the list. Integration-ready UI is active and can be connected to your backend next."
);

wireForm(
  "suggestionForm",
  "suggestionMessage",
  "Suggestion received. This UI is ready to connect to GitHub Issues, Supabase, Formspree, or your own API."
);
