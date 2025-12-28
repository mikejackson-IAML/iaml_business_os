// Benefit Steps - Scroll-Triggered Timeline Animation
// Initializes when section enters viewport (18% visible)

function initializeBenefitStepsObserver() {
  const benefitStepsSection = document.getElementById('benefitSteps');
  if (!benefitStepsSection) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        initBenefitSteps();
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.18,
    rootMargin: '0px 0px -8%'
  });

  observer.observe(benefitStepsSection);
}

function initBenefitSteps() {
  const FRAME_MS = 40; // ~25fps
  const DURATION = 24000; // ms for full vertical sweep (6 seconds per tab)

  const benefitStepsSection = document.getElementById("benefitSteps");
  if (!benefitStepsSection) {
    return;
  }

  const list = benefitStepsSection.querySelector(".benefit-steps__list");
  const rail = benefitStepsSection.querySelector(".benefit-steps__rail");
  const railProgress = benefitStepsSection.querySelector(".benefit-steps__rail-progress");
  const items = Array.from(benefitStepsSection.querySelectorAll(".benefit-steps__item"));
  const visualImg = benefitStepsSection.querySelector(".benefit-steps__visual-img");

  if (items.length === 0 || !rail || !railProgress) {
    return;
  }

  // Image set for each tab
  const visualImages = [
    "https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/6939b7fef6cae945d6e4077d.svg",
    "https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/6939b89d169a423f0821325c.svg",
    "https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/6939b85d751b349ca140d632.svg",
    "https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/6939b8e0acebf7da5c056dd7.svg"
  ];

  // Mobile summary content for each tab
  const mobileSummaries = [
    { title: "Pre-Program Consultation", text: "Identify your priorities and customize your learning focus before day one." },
    { title: "Professional Credits", text: "Earn 35.75 <span class=\"highlight\">SHRM/HRCI/CLE credits</span>—more than most HR professionals earn in two years." },
    { title: "Ongoing Development", text: "12 months of quarterly employment law updates keep you current as regulations change." },
    { title: "Alumni Advantages", text: "$300-$500 off all future programs—for you and every colleague you refer." }
  ];

  const mobileSummary = benefitStepsSection.querySelector(".benefit-steps__mobile-summary");

  let currentActiveIndex = 0;
  let isPaused = false;
  let railHeight = 0;
  let bulletCenters = [];
  let desktopStep = 0;
  const desktopStepsTotal = Math.round(DURATION / FRAME_MS);
  let lastPassedIndex = 0;

  function measureRail() {
    if (!list) return;

    const listRect = list.getBoundingClientRect();

    // Get center Y of each item's dot relative to list top
    const centersAbs = items.map((item) => {
      const dot = item.querySelector(".benefit-steps__dot");
      if (!dot) return 0;
      const dotRect = dot.getBoundingClientRect();
      return dotRect.top + dotRect.height / 2 - listRect.top;
    });

    if (!centersAbs.length) return;

    const firstCenter = centersAbs[0];
    const lastCenter = centersAbs[centersAbs.length - 1];

    railHeight = lastCenter - firstCenter;
    bulletCenters = centersAbs.map((c) => c - firstCenter);

    if (rail) {
      rail.style.top = firstCenter + "px";
      rail.style.height = railHeight + "px";
    }

    if (railProgress) {
      railProgress.style.height = "0px";
    }

    desktopStep = 0;
    lastPassedIndex = 0;
  }

  function setActiveItem(index, updateProgress = true) {
    // Remove active class from all items
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add("benefit-steps__item--active");
      } else {
        item.classList.remove("benefit-steps__item--active");
      }
    });

    currentActiveIndex = index;

    // Update visual image
    if (visualImg && visualImages[index]) {
      visualImg.style.opacity = "0";
      requestAnimationFrame(() => {
        visualImg.src = visualImages[index];
        visualImg.onload = () => (visualImg.style.opacity = "1");
      });
    }

    // Update mobile summary
    if (mobileSummary && mobileSummaries[index]) {
      const h4 = mobileSummary.querySelector("h4");
      const p = mobileSummary.querySelector("p");
      if (h4) h4.textContent = mobileSummaries[index].title;
      if (p) p.innerHTML = mobileSummaries[index].text;
    }

    // Update progress bar
    if (updateProgress && railProgress && bulletCenters.length && railHeight > 0) {
      const h = bulletCenters[index] || 0;
      railProgress.style.height = h + "px";
      desktopStep = Math.round((h / railHeight) * desktopStepsTotal);
      lastPassedIndex = index;
    }
  }

  function resetAnimation() {
    desktopStep = 0;
    lastPassedIndex = 0;
    if (railProgress) railProgress.style.height = "0px";
  }

  function desktopTick() {
    if (!railProgress || railHeight <= 0 || isPaused) return;

    desktopStep++;

    if (desktopStep > desktopStepsTotal) {
      // Stop at the last item instead of looping
      isPaused = true;
      setActiveItem(items.length - 1, false);
      return;
    }

    const progress = desktopStep / desktopStepsTotal;
    const height = progress * railHeight;

    railProgress.style.height = height + "px";

    for (let i = lastPassedIndex + 1; i < bulletCenters.length; i++) {
      if (height >= bulletCenters[i]) {
        setActiveItem(i, false);
        lastPassedIndex = i;
      }
    }
  }

  // Add click handlers to each item - pauses indefinitely on click
  items.forEach((item, index) => {
    item.addEventListener("click", () => {
      isPaused = true;
      setActiveItem(index, true);
    });

    // Add keyboard support
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        isPaused = true;
        setActiveItem(index, true);
      }
    });
  });

  // Animation timer
  const animationInterval = setInterval(() => {
    desktopTick();
  }, FRAME_MS);

  // Measure rail on init and resize
  measureRail();
  setActiveItem(0, true);
  resetAnimation();

  // Handle window resize
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      measureRail();
      resetAnimation();
      setActiveItem(currentActiveIndex, true);
    }, 250);
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBenefitStepsObserver);
} else {
  initializeBenefitStepsObserver();
}
