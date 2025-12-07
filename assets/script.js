const centralTimeEl = document.getElementById("central-time");
const centralMilitaryTimeEl = document.getElementById("central-military-time");
const currentDateEl = document.getElementById("current-date");
const backToTopButton = document.getElementById("back-to-top");
const copyButtons = document.querySelectorAll(".icon-button[data-copy]");
const copyStatus = document.getElementById("copy-status");
const navLinks = document.querySelectorAll(".section-nav a[href^='#']");
const themeToggleButton = document.getElementById("theme-toggle");
const themeToggleText = themeToggleButton?.querySelector(".theme-text");
const themeToggleIcon = themeToggleButton?.querySelector(".theme-icon");
const sectionTargets = Array.from(navLinks)
  .map((link) => {
    const hash = link.getAttribute("href");
    if (!hash) return null;
    return document.querySelector(hash);
  })
  .filter(Boolean);

const storedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)");
const initialTheme = storedTheme || (prefersDark?.matches ? "dark" : "light");

function updateThemeToggle(isDark) {
  if (!themeToggleButton || !themeToggleText || !themeToggleIcon) return;
  themeToggleButton.setAttribute("aria-pressed", String(isDark));
  themeToggleText.textContent = isDark ? "Light mode" : "Dark mode";
  themeToggleIcon.textContent = isDark ? "🌞" : "🌙";
}

function applyTheme(theme, persist = false) {
  const isDark = theme === "dark";
  document.body.classList.toggle("theme-dark", isDark);
  document.body.classList.toggle("theme-light", !isDark);
  updateThemeToggle(isDark);

  if (persist) {
    localStorage.setItem("theme", theme);
  }
}

applyTheme(initialTheme);

if (prefersDark?.addEventListener) {
  prefersDark.addEventListener("change", (event) => {
    if (!localStorage.getItem("theme")) {
      applyTheme(event.matches ? "dark" : "light");
    }
  });
} else if (prefersDark?.addListener) {
  prefersDark.addListener((event) => {
    if (!localStorage.getItem("theme")) {
      applyTheme(event.matches ? "dark" : "light");
    }
  });
}

const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
const militaryTimeOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
const dateOptions = { month: "2-digit", day: "2-digit", year: "numeric" };

function updateClocks() {
  const now = new Date();
  centralTimeEl.textContent = new Intl.DateTimeFormat("en-US", {
    ...timeOptions,
    timeZone: "America/Chicago",
  }).format(now);
  centralMilitaryTimeEl.textContent = new Intl.DateTimeFormat("en-US", {
    ...militaryTimeOptions,
    timeZone: "America/Chicago",
  }).format(now);
  currentDateEl.textContent = new Intl.DateTimeFormat("en-US", {
    ...dateOptions,
    timeZone: "America/Chicago",
  }).format(now);
}

updateClocks();
setInterval(updateClocks, 30000);

function toggleBackToTop() {
  if (!backToTopButton) return;
  if (window.scrollY > 120) {
    backToTopButton.classList.add("visible");
  } else {
    backToTopButton.classList.remove("visible");
  }
}

if (backToTopButton) {
  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

window.addEventListener("scroll", toggleBackToTop);
toggleBackToTop();

function announceCopyStatus(message) {
  if (!copyStatus) return;
  copyStatus.textContent = "";
  window.setTimeout(() => {
    copyStatus.textContent = message;
  }, 10);
}

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.getAttribute("data-copy");
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
      announceCopyStatus(`${text} copied to clipboard.`);
      setTimeout(() => {
        button.textContent = "Copy";
      }, 1200);
    } catch (error) {
      console.error("Copy failed", error);
      button.textContent = "Copy failed";
      announceCopyStatus("Copy failed. Please try again.");
      setTimeout(() => {
        button.textContent = "Copy";
      }, 1200);
    }
  });
});

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash) return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

if (themeToggleButton) {
  themeToggleButton.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("theme-dark")
      ? "light"
      : "dark";
    applyTheme(nextTheme, true);
  });
}

if (sectionTargets.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (!visibleEntries.length) return;

      const dominantEntry = visibleEntries.reduce((current, candidate) => {
        if (!current) return candidate;
        return candidate.intersectionRatio > current.intersectionRatio
          ? candidate
          : current;
      }, null);

      if (!dominantEntry) return;
      const id = dominantEntry.target.id;
      const activeLink = document.querySelector(
        `.section-nav a[href="#${id}"]`
      );
      if (!activeLink) return;
      navLinks.forEach((link) => link.classList.remove("active"));
      activeLink.classList.add("active");
    },
    {
      rootMargin: "-40% 0px -40% 0px",
      threshold: 0.25,
    }
  );

  sectionTargets.forEach((section) => observer.observe(section));
}
