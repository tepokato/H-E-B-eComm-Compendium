const centralTimeEl = document.getElementById("central-time");
const centralMilitaryTimeEl = document.getElementById("central-military-time");
const currentDateEl = document.getElementById("current-date");
const backToTopButton = document.getElementById("back-to-top");
const quickLaunchButtons = document.querySelectorAll(".chip-button[data-url]");
const launchAllButton = document.getElementById("launch-all");
const copyButtons = document.querySelectorAll(".icon-button[data-copy]");
const navLinks = document.querySelectorAll(".section-nav a[href^='#']");

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

quickLaunchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const url = button.getAttribute("data-url");
    if (url) {
      window.open(url, "_blank", "noopener");
    }
  });
});

if (launchAllButton) {
  launchAllButton.addEventListener("click", () => {
    quickLaunchButtons.forEach((button) => {
      const url = button.getAttribute("data-url");
      if (url) {
        window.open(url, "_blank", "noopener");
      }
    });
  });
}

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.getAttribute("data-copy");
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = "Copy";
      }, 1200);
    } catch (error) {
      console.error("Copy failed", error);
      button.textContent = "Copy failed";
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
