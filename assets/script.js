const centralTimeEl = document.getElementById("central-time");
const mountainTimeEl = document.getElementById("mountain-time");
const currentDateEl = document.getElementById("current-date");
const backToTopButton = document.getElementById("back-to-top");

const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
const dateOptions = { month: "2-digit", day: "2-digit", year: "numeric" };

function updateClocks() {
  const now = new Date();
  centralTimeEl.textContent = new Intl.DateTimeFormat("en-US", {
    ...timeOptions,
    timeZone: "America/Chicago",
  }).format(now);
  mountainTimeEl.textContent = new Intl.DateTimeFormat("en-US", {
    ...timeOptions,
    timeZone: "America/Denver",
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
  if (window.scrollY > 240) {
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
