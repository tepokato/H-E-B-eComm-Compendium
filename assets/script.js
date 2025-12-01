const combinedStandardTimeEl = document.getElementById("combined-standard-time");
const combinedMilitaryTimeEl = document.getElementById("combined-military-time");
const combinedDateEl = document.getElementById("combined-date");
const backToTopButton = document.getElementById("back-to-top");
const quickLaunchButtons = document.querySelectorAll(".chip-button[data-url]");
const launchAllButton = document.getElementById("launch-all");
const copyButtons = document.querySelectorAll(".icon-button[data-copy]");

const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
const militaryTimeOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
const dateOptions = { month: "2-digit", day: "2-digit", year: "numeric" };

function updateClocks() {
  const now = new Date();
  const formattedStandardTime = new Intl.DateTimeFormat("en-US", {
    ...timeOptions,
    timeZone: "America/Chicago",
  })
    .format(now)
    .replace(/\s/g, "")
    .toLowerCase();

  const formattedMilitaryTime = new Intl.DateTimeFormat("en-US", {
    ...militaryTimeOptions,
    timeZone: "America/Chicago",
  })
    .format(now)
    .replace(":", "");

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    ...dateOptions,
    timeZone: "America/Chicago",
  }).format(now);

  if (combinedStandardTimeEl) combinedStandardTimeEl.textContent = formattedStandardTime;
  if (combinedMilitaryTimeEl) combinedMilitaryTimeEl.textContent = formattedMilitaryTime;
  if (combinedDateEl) combinedDateEl.textContent = formattedDate;
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
