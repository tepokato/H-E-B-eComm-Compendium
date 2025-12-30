// Cached DOM lookups for frequently accessed elements. Centralize here to keep
// event handlers lightweight and prevent repeated queries as the page updates.
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
const visitCountEl = document.getElementById("visit-count");
const archiveDateInput = document.getElementById("archive-date");
const archiveOpenButton = document.getElementById("archive-open");
const archiveStatus = document.getElementById("archive-status");
const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
const sectionTargets = Array.from(navLinks)
  .map((link) => {
    const hash = link.getAttribute("href");
    if (!hash) return null;
    return document.querySelector(hash);
  })
  .filter(Boolean);

// Tracks the id of the currently highlighted nav section so we only update the
// UI when a new section becomes dominant.
let activeSectionId = null;

// Highlight the nav link that corresponds to the currently visible section.
function setActiveLink(id) {
  if (!id || id === activeSectionId) return;
  activeSectionId = id;
  navLinks.forEach((link) => {
    const isActive = link.hash === `#${id}`;
    link.classList.toggle("active", isActive);
isActive ? link.setAttribute("aria-current", "location") : link.removeAttribute("aria-current");
  });
}

const storedTheme = localStorage.getItem("theme");
// System preference is used only when the user has not manually chosen a
// theme, keeping the page aligned with OS-level settings by default.
const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)");
const initialTheme = storedTheme || (prefersDark?.matches ? "dark" : "light");

// Syncs the theme toggle button text/icon with the active theme so screen
// readers and visual users receive accurate state cues.
function updateThemeToggle(isDark) {
  if (!themeToggleButton || !themeToggleText || !themeToggleIcon) return;
  themeToggleButton.setAttribute("aria-pressed", String(isDark));
  themeToggleText.textContent = isDark ? "Light mode" : "Dark mode";
  themeToggleIcon.textContent = isDark ? "light_mode" : "dark_mode";
}

// Applies the theme classes and, if requested, persists the choice in storage
// for the next visit.
function applyTheme(theme, persist = false) {
  const isDark = theme === "dark";
  document.body.classList.toggle("theme-dark", isDark);
  document.body.classList.toggle("theme-light", !isDark);
  updateThemeToggle(isDark);

  if (persist) {
    localStorage.setItem("theme", theme);
  }
}

// Start with the preferred theme and mirror any OS preference changes unless a
// manual selection is saved.
applyTheme(initialTheme);

// Respond to OS-level theme changes when the user hasn't set a preference.
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

async function updateVisitCounter() {
  if (!visitCountEl) return;
  const storageKey = "visitCount";
  const ipStorageKey = "visitCountIp";
  const storedCount = Number.parseInt(localStorage.getItem(storageKey) ?? "0", 10);
  const safeStoredCount = Number.isNaN(storedCount) ? 0 : storedCount;

  visitCountEl.textContent = safeStoredCount.toLocaleString("en-US");

  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) return;
    const data = await response.json();
    const currentIp = typeof data?.ip === "string" ? data.ip : null;
    if (!currentIp) return;

    const lastIp = localStorage.getItem(ipStorageKey);
    if (lastIp === currentIp) {
      visitCountEl.textContent = safeStoredCount.toLocaleString("en-US");
      return;
    }

    const nextCount = safeStoredCount + 1;
    localStorage.setItem(storageKey, String(nextCount));
    localStorage.setItem(ipStorageKey, currentIp);
    visitCountEl.textContent = nextCount.toLocaleString("en-US");
  } catch (error) {
    console.error("Unable to update visit counter", error);
  }
}

// Shared date/time formatter pieces to avoid recreating Intl instances for each
// tick of the clock.
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

// Refreshes the human-readable and military clocks plus the date display. The
// interval runs every 30 seconds to keep the UI fresh without extra overhead.
function updateClocks() {
  const now = new Date();
  centralTimeEl.textContent = centralTimeFormatter.format(now);
  centralMilitaryTimeEl.textContent = centralMilitaryTimeFormatter.format(now);
  currentDateEl.textContent = centralDateFormatter.format(now);
}

updateClocks();
setInterval(updateClocks, 30000);
updateVisitCounter();

// Show the back-to-top button only when scrolling past the hero content so it
// remains out of the way near the top of the page.
function toggleBackToTop() {
  if (!backToTopButton) return;
  if (window.scrollY > 120) {
    backToTopButton.classList.add("visible");
  } else {
    backToTopButton.classList.remove("visible");
  }
}

function getScrollBehavior() {
  return prefersReducedMotion?.matches ? "auto" : "smooth";
}

if (backToTopButton) {
  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: getScrollBehavior() });
  });
}

window.addEventListener("scroll", toggleBackToTop);
toggleBackToTop();

// Announces copy feedback for screen readers by temporarily clearing and then
// re-inserting status text, ensuring the message is always announced.
function announceCopyStatus(message) {
  if (!copyStatus) return;
  copyStatus.textContent = "";
  window.setTimeout(() => {
    copyStatus.textContent = message;
  }, 10);
}

// Resets the button label after a short delay so repeated copies stay clear to
// the user without requiring manual refresh.
function resetCopyButtonLabel(button) {
  window.setTimeout(() => {
    button.textContent = "Copy";
  }, 1200);
}

// Wire up copy-to-clipboard on every quick action button. Errors fall back to a
// visible message so partners know to try again.
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

// Smooth scrolling for in-page navigation so moving between sections feels
// intentional and keeps the active state logic in sync.
navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash) return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: getScrollBehavior(), block: "start" });
  });
});

// Theme toggling: persist user choice and re-run the same apply logic used at
// initialization.
if (themeToggleButton) {
  themeToggleButton.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("theme-dark")
      ? "light"
      : "dark";
    applyTheme(nextTheme, true);
  });
}

const weeklyAdArchive = [
  {
    label: "Dec 25 - Dec 31",
    url: "weekly%20ads/2025/Dec%2025%20-%20Dec%2031.pdf",
    start: { month: 11, day: 25 },
    end: { month: 11, day: 31 },
  },
];

function getWeeklyAdForDate(date) {
  return weeklyAdArchive.find((ad) => {
    const startDate = new Date(date.getFullYear(), ad.start.month, ad.start.day);
    const endDate = new Date(date.getFullYear(), ad.end.month, ad.end.day);
    return date >= startDate && date <= endDate;
  });
}

function setArchiveStatus(message, isReady = false) {
  if (!archiveStatus) return;
  archiveStatus.textContent = message;
  archiveStatus.classList.toggle("is-ready", isReady);
}

function openWeeklyAdFromInput() {
  if (!archiveDateInput) return;
  const rawValue = archiveDateInput.value;
  if (!rawValue) {
    setArchiveStatus("Pick a date to open a weekly ad.");
    return;
  }

  const [rawYear, rawMonth, rawDay] = rawValue.split("-");
  const selectedDate = new Date(
    Number.parseInt(rawYear, 10),
    Number.parseInt(rawMonth, 10) - 1,
    Number.parseInt(rawDay, 10),
  );
  if (Number.isNaN(selectedDate.getTime())) {
    setArchiveStatus("Please select a valid date.");
    return;
  }

  const matchingAd = getWeeklyAdForDate(selectedDate);
  if (!matchingAd) {
    setArchiveStatus("No weekly ad on file for that date.");
    return;
  }

  setArchiveStatus(`Opening ${matchingAd.label} weekly ad...`, true);
  window.open(matchingAd.url, "_blank", "noopener");
}

if (archiveDateInput) {
  archiveDateInput.addEventListener("change", openWeeklyAdFromInput);
}

if (archiveOpenButton) {
  archiveOpenButton.addEventListener("click", openWeeklyAdFromInput);
}

// Keep the navigation chips in sync with the section currently in view. Prefer
// IntersectionObserver and fall back to a scroll-based approach when needed.
if (sectionTargets.length) {
  const firstSectionId = sectionTargets[0].id;
  setActiveLink(firstSectionId);

  function getSectionFromScrollAnchor() {
    const viewportAnchor = window.scrollY + window.innerHeight * 0.35;
    return sectionTargets.reduce((current, section) => {
      if (viewportAnchor >= section.offsetTop - 12) {
        return section;
      }
      return current;
    }, sectionTargets[0]);
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (!visibleEntries.length) {
          const currentSection = getSectionFromScrollAnchor();
          if (currentSection) setActiveLink(currentSection.id);
          return;
        }

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
        rootMargin: "-20% 0px -45% 0px",
        threshold: 0.15,
      }
    );

    sectionTargets.forEach((section) => observer.observe(section));
  } else {
    function updateActiveSectionFromScroll() {
      const currentSection = getSectionFromScrollAnchor();
      if (currentSection) setActiveLink(currentSection.id);
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
