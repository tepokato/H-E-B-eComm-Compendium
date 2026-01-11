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
const archiveDateInput = document.getElementById("archive-date");
const archiveOpenButton = document.getElementById("archive-open");
const archiveStatus = document.getElementById("archive-status");
const archiveList = document.getElementById("archive-list");
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


// Shared date/time formatter pieces to avoid recreating Intl instances for each
// tick of the clock.
const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
const militaryTimeOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
const dateOptions = { month: "2-digit", day: "2-digit", year: "numeric" };
const dateTimeOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

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
const centralDateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  ...dateTimeOptions,
  ...commonDateTimeOptions,
});

function formatCentralDateTime(now) {
  const parts = centralDateTimeFormatter.formatToParts(now);
  const lookup = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
  return `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}:${lookup.second}`;
}

function formatCentralDate(now) {
  const parts = centralDateFormatter.formatToParts(now);
  const lookup = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function formatCentralTime(now) {
  const parts = centralDateTimeFormatter.formatToParts(now);
  const lookup = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
  return `${lookup.hour}:${lookup.minute}`;
}

// Refreshes the human-readable and military clocks plus the date display. The
// interval runs every 30 seconds to keep the UI fresh without extra overhead.
function updateClocks() {
  const now = new Date();
  const centralDateTime = formatCentralDateTime(now);
  const centralDate = formatCentralDate(now);
  const centralTime = formatCentralTime(now);
  centralTimeEl.textContent = centralTimeFormatter.format(now);
  centralTimeEl.setAttribute("datetime", centralDateTime);
  centralMilitaryTimeEl.textContent = centralMilitaryTimeFormatter.format(now);
  centralMilitaryTimeEl.setAttribute("datetime", centralDateTime);
  currentDateEl.textContent = centralDateFormatter.format(now);
  currentDateEl.setAttribute("datetime", centralDate);
}

updateClocks();
setInterval(updateClocks, 30000);

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

function fallbackCopyText(text) {
  if (typeof document.execCommand !== "function") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.left = "-1000px";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    console.error("Fallback copy failed", error);
  }

  document.body.removeChild(textarea);
  return copied;
}

// Wire up copy-to-clipboard on every quick action button. Errors fall back to a
// visible message so partners know to try again.
copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.getAttribute("data-copy");
    if (!text) return;

    const canUseClipboard =
      typeof navigator.clipboard?.writeText === "function";
    const canUseFallback = typeof document.execCommand === "function";

    if (!canUseClipboard && !canUseFallback) {
      button.textContent = "Copy unavailable";
      announceCopyStatus(
        "Copy unavailable. Please copy manually from the field."
      );
      return;
    }

    let copied = false;
    let usedFallback = false;

    if (canUseClipboard) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (error) {
        console.error("Copy failed", error);
      }
    }

    if (!copied && canUseFallback) {
      usedFallback = fallbackCopyText(text);
      copied = usedFallback;
    }

    if (copied) {
      button.textContent = "Copied";
      announceCopyStatus(
        usedFallback
          ? "Copied using the fallback clipboard method."
          : `${text} copied to clipboard.`
      );
      resetCopyButtonLabel(button);
      return;
    }

    button.textContent = "Copy blocked";
    announceCopyStatus("Copy blocked. Please copy manually.");
    resetCopyButtonLabel(button);
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
    label: "Jan 7, 2026",
    url: "weekly%20ads/01-07-26.pdf",
    start: { month: 0, day: 7 },
    end: { month: 0, day: 13 },
  },
  {
    label: "Dec 25, 2025",
    url: "weekly%20ads/12-25-25.pdf",
    start: { month: 11, day: 25 },
    end: { month: 11, day: 31 },
  },
  {
    label: "Jan 1, 2026",
    url: "weekly%20ads/01-01-26.pdf",
    start: { month: 0, day: 1 },
    end: { month: 0, day: 7 },
  },
];

function renderWeeklyAdArchive() {
  if (!archiveList) return;
  archiveList.innerHTML = "";

  weeklyAdArchive.forEach((ad) => {
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.href = ad.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = ad.label;
    listItem.appendChild(link);
    archiveList.appendChild(listItem);
  });
}

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

function getSelectedWeeklyAd() {
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

  return matchingAd;
}

function updateArchiveStatusFromInput() {
  const matchingAd = getSelectedWeeklyAd();
  if (!matchingAd) return;
  setArchiveStatus(`Weekly ad available: ${matchingAd.label}.`, true);
}

function openWeeklyAdFromInput() {
  const matchingAd = getSelectedWeeklyAd();
  if (!matchingAd) return;
  setArchiveStatus(`Opening ${matchingAd.label} weekly ad...`, true);
  const openedWindow = window.open(matchingAd.url, "_blank", "noopener");
  if (!openedWindow) {
    setArchiveStatus("Pop-up blocked. Please allow pop-ups to open the weekly ad.");
  }
}

if (archiveDateInput) {
  archiveDateInput.addEventListener("change", updateArchiveStatusFromInput);
}

if (archiveOpenButton) {
  archiveOpenButton.addEventListener("click", openWeeklyAdFromInput);
}

renderWeeklyAdArchive();

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
