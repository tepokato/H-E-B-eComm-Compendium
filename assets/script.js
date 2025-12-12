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

let activeSectionId = null;

function setActiveLink(id) {
  if (!id || id === activeSectionId) return;
  activeSectionId = id;
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.hash === `#${id}`);
  });
}

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

function syncThemeWithPreference(event) {
  if (!localStorage.getItem("theme")) {
    applyTheme(event.matches ? "dark" : "light");
  }
}

if (prefersDark?.addEventListener) {
  prefersDark.addEventListener("change", syncThemeWithPreference);
} else if (prefersDark?.addListener) {
  prefersDark.addListener(syncThemeWithPreference);
}

const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
const militaryTimeOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
const dateOptions = { month: "2-digit", day: "2-digit", year: "numeric" };

const LOCALE = "en-US";
const commonDateTimeOptions = { timeZone: "America/Chicago" };
const centralTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  ...timeOptions,
  ...commonDateTimeOptions,
});
const centralMilitaryTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  ...militaryTimeOptions,
  ...commonDateTimeOptions,
});
const centralDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  ...dateOptions,
  ...commonDateTimeOptions,
});

function updateClocks() {
  const now = new Date();
  centralTimeEl.textContent = centralTimeFormatter.format(now);
  centralMilitaryTimeEl.textContent = centralMilitaryTimeFormatter.format(now);
  currentDateEl.textContent = centralDateFormatter.format(now);
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

function resetCopyButtonLabel(button) {
  window.setTimeout(() => {
    button.textContent = "Copy";
  }, 1200);
}

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.getAttribute("data-copy");
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
      announceCopyStatus(`${text} copied to clipboard.`);
      resetCopyButtonLabel(button);
    } catch (error) {
      console.error("Copy failed", error);
      button.textContent = "Copy failed";
      announceCopyStatus("Copy failed. Please try again.");
      resetCopyButtonLabel(button);
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

if (sectionTargets.length) {
  const firstSectionId = sectionTargets[0].id;
  setActiveLink(firstSectionId);

  if ("IntersectionObserver" in window) {
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
        setActiveLink(id);
      },
      {
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0.25,
      }
    );

    sectionTargets.forEach((section) => observer.observe(section));
  } else {
    function updateActiveSectionFromScroll() {
      const viewportAnchor = window.scrollY + window.innerHeight * 0.35;

      let currentSection = sectionTargets[0];
      sectionTargets.forEach((section) => {
        const top = section.offsetTop;
        if (viewportAnchor >= top - 12) {
          currentSection = section;
        }
      });

      setActiveLink(currentSection.id);
    }

    let scrollTicking = false;
    window.addEventListener("scroll", () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        updateActiveSectionFromScroll();
        scrollTicking = false;
      });
    });

    updateActiveSectionFromScroll();
  }
}
