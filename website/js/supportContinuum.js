// Support Continuum - Scroll-synced vertical timeline
// Handles active state management, progress line animation, and panel detection

/**
 * SupportContinuum Class
 * Manages the interactive timeline navigation and scroll-based panel activation
 */
class SupportContinuum {
  constructor() {
    // DOM elements
    this.section = document.getElementById("support-continuum");
    this.timelineNav = document.querySelector(".support-timeline-nav");
    this.timelineItems = document.querySelectorAll(".timeline-item");
    this.progressLine = document.querySelector(".timeline-progress");
    this.panels = document.querySelectorAll(".support-panel");
    this.timelineList = document.querySelector(".timeline-items");
    this.activeUnderline = null;
    this.phaseCount = this.panels.length || this.timelineItems.length || 5;

    // State
    this.activePhase = 1;
    this.isScrollingFromClick = false;
    this.scrollTimeout = null;

    // Line animation state (like reference)
    this.railHeight = 0;
    this.bulletCenters = [];
    this.lastPassedIndex = 0;

    // Check if elements exist
    if (!this.section || !this.timelineNav) {
      console.warn("[SupportContinuum] Required elements not found");
      return;
    }

    // Debug: Log initialization
    console.log("[SupportContinuum] Initializing...", {
      section: !!this.section,
      timelineNav: !!this.timelineNav,
      timelineItems: this.timelineItems.length,
      panels: this.panels.length,
    });

    // Initialize
    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Show all content immediately
      this.timelineItems.forEach((item) => {
        const subtitle = item.querySelector(".timeline-subtitle");
        if (subtitle) {
          subtitle.style.maxHeight = "none";
          subtitle.style.opacity = "1";
        }
      });
      this.panels.forEach((panel) => {
        panel.style.opacity = "1";
        panel.style.transform = "scale(1)";
      });
      return;
    }

    // Set up event listeners
    this.setupClickHandlers();
    this.setupScrollObserver();
    this.setupKeyboardNavigation();
    this.setupUnderline();

    // NEW: Setup section boundary detection (hide panels when section out of view)
    // This ensures fixed panels only show when support continuum section is visible
    this.setupPanelVisibility();

    // NEW: Setup sticky behavior via JavaScript (fallback for CSS position: sticky)
    this.setupStickyBehavior();

    // NEW: Position panels to align with first timeline title
    this.alignPanelsWithTimeline();

    // Measure rail and bullet positions
    this.measure();

    // Initialize first phase
    console.log("[SupportContinuum] Setup complete, activating phase 1");
    this.lastPassedIndex = -1; // Start before first bullet
    this.updateActivePhase(1, false);
    if (this.progressLine) {
      this.progressLine.style.height = "0px"; // Start with 0 height
    }
    this.updateUnderlinePosition(1, false);

    // Re-measure on resize
    window.addEventListener(
      "resize",
      () => {
        this.measure();
      },
      { passive: true }
    );
  }

  /**
   * Measure rail height and bullet center positions (like reference)
   */
  measure() {
    if (!this.timelineNav || !this.timelineItems.length) return;

    const navRect = this.timelineNav.getBoundingClientRect();
    this.railHeight = navRect.height;

    // Calculate bullet centers relative to nav top
    this.bulletCenters = Array.from(this.timelineItems).map((item) => {
      const bullet = item.querySelector(".timeline-bullet");
      if (!bullet) return 0;
      const bulletRect = bullet.getBoundingClientRect();
      return bulletRect.top + bulletRect.height / 2 - navRect.top;
    });

    console.log("[SupportContinuum] Measured:", {
      railHeight: this.railHeight,
      bulletCenters: this.bulletCenters,
    });
  }

  /**
   * Set up click handlers for timeline items
   */
  setupClickHandlers() {
    this.timelineItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const phase = parseInt(item.getAttribute("data-phase"));
        this.handleTimelineClick(phase);
      });
    });
  }

  /**
   * Handle timeline item click - scroll to corresponding panel and set line height (like reference)
   * On mobile (<1024px), just switch tabs without scrolling
   */
  handleTimelineClick(phase) {
    const isMobile = window.innerWidth < 1024;

    if (!isMobile) {
      this.isScrollingFromClick = true;
    }

    const targetPanel = document.querySelector(
      `.support-panel[data-phase="${phase}"]`
    );
    if (!targetPanel) return;

    // Update active state immediately
    const phaseIndex = phase - 1;
    this.lastPassedIndex = phaseIndex;
    this.updateActivePhase(phase, true);

    // On mobile, scroll active tab into view within the tabs container
    if (isMobile) {
      const clickedItem = Array.from(this.timelineItems).find(
        (item) => parseInt(item.getAttribute("data-phase")) === phase
      );
      if (clickedItem && this.timelineList) {
        const container = this.timelineList;
        const itemRect = clickedItem.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;
        const itemLeft = itemRect.left - containerRect.left + scrollLeft;
        const itemWidth = itemRect.width;
        const containerWidth = containerRect.width;
        const itemCenter = itemLeft + itemWidth / 2;
        const scrollTarget = itemCenter - containerWidth / 2;

        // Smooth scroll to center the clicked tab
        container.scrollTo({
          left: scrollTarget,
          behavior: "smooth",
        });
      }
    }

    // Only update underline and line height on desktop
    if (!isMobile) {
      this.updateUnderlinePosition(phase, true);

      // Set line height to clicked bullet center (like reference)
      if (
        this.progressLine &&
        this.bulletCenters.length > phaseIndex &&
        this.railHeight > 0
      ) {
        const targetHeight = this.bulletCenters[phaseIndex] || 0;
        this.progressLine.style.height = targetHeight + "px";
      }

      // Calculate scroll position (centered in viewport)
      const panelRect = targetPanel.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const targetPosition =
        scrollTop +
        panelRect.top -
        window.innerHeight / 2 +
        panelRect.height / 2;

      // Smooth scroll to panel
      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });

      // Reset click flag after animation completes
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.isScrollingFromClick = false;
      }, 1000);
    } else {
      // On mobile, just scroll panel into view smoothly
      targetPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  /**
   * Set up scroll-based phase detection for sticky section
   * Adapted from reference: line grows based on scroll, phases activate when line passes bullets
   */
  setupScrollObserver() {
    const section = this.section;
    const panelsContainer = document.querySelector(".support-panels-container");
    if (!section || !panelsContainer) return;

    const speedBoost = 1.22; // slightly faster advancement between phases
    let ticking = false;

    const handleScroll = () => {
      if (this.isScrollingFromClick) return;

      // Disable scroll-based animation below 1024px (use tabs instead)
      if (window.innerWidth < 1024) return;

      if (
        !this.progressLine ||
        this.railHeight === 0 ||
        this.bulletCenters.length === 0
      ) {
        this.measure(); // Re-measure if needed
        return;
      }

      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionRect = section.getBoundingClientRect();

      // Calculate scroll progress through the section
      const usableHeight = Math.max(1, sectionHeight - viewportHeight * 0.35);
      const rawProgress =
        (scrollTop - (sectionTop - viewportHeight * 0.15)) / usableHeight;
      const scrollProgress = this.clamp(rawProgress * speedBoost, 0, 1);

      // Map scroll progress to line height (like reference)
      const lineHeight = scrollProgress * this.railHeight;
      this.progressLine.style.height = lineHeight + "px";

      // When line passes a bullet center, activate that phase (like reference)
      let newPhase = 1;
      let newLastPassedIndex = -1;

      // Find the highest bullet center that the line has passed
      for (let i = 0; i < this.bulletCenters.length; i++) {
        if (lineHeight >= this.bulletCenters[i]) {
          newPhase = i + 1;
          newLastPassedIndex = i;
        } else {
          break; // Stop at first bullet not yet reached
        }
      }

      // Update lastPassedIndex
      if (newLastPassedIndex >= 0) {
        this.lastPassedIndex = newLastPassedIndex;
      }

      if (newPhase !== this.activePhase) {
        this.updateActivePhase(newPhase, true);
        this.updateUnderlinePosition(newPhase, true);
      }

      // Panels visible while section is largely in view; release after last phase passes
      const inView =
        sectionRect.top < viewportHeight * 0.55 &&
        sectionRect.bottom > viewportHeight * 0.65;
      const pastLast =
        (newPhase === this.phaseCount &&
          sectionRect.bottom < viewportHeight * 0.7) ||
        sectionRect.bottom < viewportHeight * 0.5;

      panelsContainer.classList.toggle("panels-visible", inView && !pastLast);
      section.classList.toggle("section-active", inView);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();
  }

  /**
   * Show/hide panels based on section visibility
   * Ensures fixed panels only appear when support continuum section is in view
   * Disabled below 1024px (panels are in normal flow)
   */
  setupPanelVisibility() {
    if (!this.section) return;

    const panelsContainer = document.querySelector(".support-panels-container");
    if (!panelsContainer) return;

    // Single source of truth for panel visibility
    const checkPanelVisibility = () => {
      // Disable fixed panel visibility below 1024px (responsive tabs)
      if (window.innerWidth < 1024) {
        panelsContainer.classList.add("panels-visible"); // Always show on mobile
        return;
      }

      const sectionRect = this.section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Show panels ONLY when section is within a comfortable viewport band
      const sectionInViewport =
        sectionRect.top < viewportHeight * 0.85 &&
        sectionRect.bottom > viewportHeight * 0.25;
      const lastPhase = this.phaseCount;
      const isPhase5AndPastEnd =
        this.activePhase === lastPhase &&
        sectionRect.bottom < viewportHeight * 0.55;
      const shouldShow = sectionInViewport && !isPhase5AndPastEnd;

      if (shouldShow) {
        if (!panelsContainer.classList.contains("panels-visible")) {
          panelsContainer.classList.add("panels-visible");
          console.log(
            "[SupportContinuum] ✅ Panels shown - section in active view",
            {
              sectionTop: sectionRect.top.toFixed(2),
              sectionBottom: sectionRect.bottom.toFixed(2),
              sectionInViewport,
              activePhase: this.activePhase,
              isPhase5AndPastEnd,
            }
          );
        }
      } else {
        if (panelsContainer.classList.contains("panels-visible")) {
          panelsContainer.classList.remove("panels-visible");
          console.log(
            "[SupportContinuum] ❌ Panels hidden - section not in active view",
            {
              sectionTop: sectionRect.top.toFixed(2),
              sectionBottom: sectionRect.bottom.toFixed(2),
              sectionInViewport,
              activePhase: this.activePhase,
              isPhase5AndPastEnd,
            }
          );
        }
      }
    };

    // Check visibility on scroll
    window.addEventListener("scroll", checkPanelVisibility, { passive: true });

    // Initial check on page load
    checkPanelVisibility();
  }

  /**
   * Update active phase state
   * @param {number} phase - Phase number (1-5)
   * @param {boolean} animate - Whether to animate transitions
   */
  updateActivePhase(phase, animate = true) {
    if (this.activePhase === phase) return;

    console.log("[SupportContinuum] Updating active phase to:", phase);
    this.activePhase = phase;

    // Update timeline items
    this.timelineItems.forEach((item) => {
      const itemPhase = parseInt(item.getAttribute("data-phase"));
      const isActive = itemPhase === phase;

      // Update classes
      item.classList.toggle("active", isActive);

      // Update ARIA
      item.setAttribute("aria-current", isActive ? "true" : "false");
    });

    // Update panels
    this.panels.forEach((panel) => {
      const panelPhase = parseInt(panel.getAttribute("data-phase"));
      panel.classList.toggle("active", panelPhase === phase);
    });

    // If not driven by scroll (e.g., click or keyboard), ensure the line animates to this phase
    if (animate && this.isScrollingFromClick) {
      this.updateProgressLineForPhase(phase);
    }
    this.updateUnderlinePosition(phase, animate);
  }

  /**
   * Update progress line height based on smooth scroll progress
   * @param {number} scrollProgress - Scroll progress through section (0 to 1)
   */
  updateProgressLine(scrollProgress = 0) {
    if (!this.progressLine || !this.timelineNav) return;
    if (this.timelineItems.length === 0) return;

    const navRect = this.timelineNav.getBoundingClientRect();
    const firstBullet = this.timelineItems[0].querySelector(".timeline-bullet");
    if (!firstBullet) return;

    // Calculate fractional phase (0.0 to 5.0)
    const fractionalPhase = Math.max(0, Math.min(5, scrollProgress * 5));

    // Determine which two bullets we're between
    const currentPhaseIndex = Math.floor(fractionalPhase);
    const nextPhaseIndex = Math.min(currentPhaseIndex + 1, 4);

    // Calculate fraction between these two bullets (0 to 1)
    const fraction = fractionalPhase - currentPhaseIndex;

    // Get bullet positions
    const currentBullet =
      this.timelineItems[currentPhaseIndex]?.querySelector(".timeline-bullet");
    const nextBullet =
      this.timelineItems[nextPhaseIndex]?.querySelector(".timeline-bullet");

    if (!currentBullet || !nextBullet) {
      // Fallback: extend to last available bullet
      const lastBullet =
        this.timelineItems[this.timelineItems.length - 1]?.querySelector(
          ".timeline-bullet"
        );
      if (!lastBullet) return;

      const lastBulletRect = lastBullet.getBoundingClientRect();
      const startY =
        firstBullet.getBoundingClientRect().top -
        navRect.top +
        firstBullet.offsetHeight / 2;
      const endY = lastBulletRect.top - navRect.top + lastBulletRect.height / 2;

      this.progressLine.style.height = `${Math.max(0, endY - startY)}px`;
      return;
    }

    // Calculate positions
    const currentBulletRect = currentBullet.getBoundingClientRect();
    const nextBulletRect = nextBullet.getBoundingClientRect();

    const startY =
      firstBullet.getBoundingClientRect().top -
      navRect.top +
      firstBullet.offsetHeight / 2;
    const currentY =
      currentBulletRect.top - navRect.top + currentBulletRect.height / 2;
    const nextY = nextBulletRect.top - navRect.top + nextBulletRect.height / 2;

    // Interpolate between current and next bullet based on fraction
    const distanceBetweenBullets = nextY - currentY;
    const interpolatedY = currentY + fraction * distanceBetweenBullets;

    // Calculate final progress line height from start to interpolated position
    const progressHeight = interpolatedY - startY;

    this.progressLine.style.height = `${Math.max(0, progressHeight)}px`;
  }

  /**
   * Animate progress line to a specific phase (1-based)
   * Ensures the line grows downward toward the next bullet instead of jumping.
   */
  updateProgressLineForPhase(phase) {
    if (!this.timelineItems.length || !this.progressLine) return;
    const totalPhases = this.timelineItems.length;
    const clamped = this.clamp(phase, 1, totalPhases);
    const fraction = (clamped - 1) / (totalPhases - 1 || 1);
    this.updateProgressLine(fraction);
  }

  /**
   * Setup active underline element
   */
  setupUnderline() {
    if (!this.timelineList) return;
    this.activeUnderline = document.createElement("div");
    this.activeUnderline.className = "timeline-active-underline";
    this.timelineList.appendChild(this.activeUnderline);

    window.addEventListener(
      "resize",
      () => {
        this.updateUnderlinePosition(this.activePhase, false);
      },
      { passive: true }
    );
  }

  /**
   * Position and animate the active underline under the current title
   */
  updateUnderlinePosition(phase, animate = true) {
    if (!this.timelineList || !this.activeUnderline) return;
    const targetItem = Array.from(this.timelineItems).find(
      (item) => parseInt(item.getAttribute("data-phase")) === phase
    );
    const title = targetItem?.querySelector(".timeline-title");
    if (!title) return;

    const listRect = this.timelineList.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const underlineWidth = titleRect.width * 0.55;
    const left =
      titleRect.left - listRect.left + (titleRect.width - underlineWidth) / 2;
    const top = titleRect.bottom - listRect.top + 6;

    if (!animate) {
      this.activeUnderline.style.transition = "none";
    } else {
      this.activeUnderline.style.transition = "";
    }

    this.activeUnderline.style.width = `${underlineWidth}px`;
    this.activeUnderline.style.transform = `translate(${left}px, ${top}px)`;
    this.activeUnderline.classList.add("visible");

    if (!animate) {
      requestAnimationFrame(() => {
        this.activeUnderline.style.transition = "";
      });
    }
  }

  /**
   * Set up keyboard navigation
   */
  setupKeyboardNavigation() {
    this.timelineItems.forEach((item, index) => {
      item.addEventListener("keydown", (e) => {
        let targetIndex = null;

        switch (e.key) {
          case "ArrowDown":
          case "ArrowRight":
            e.preventDefault();
            targetIndex = Math.min(index + 1, this.timelineItems.length - 1);
            break;
          case "ArrowUp":
          case "ArrowLeft":
            e.preventDefault();
            targetIndex = Math.max(index - 1, 0);
            break;
          case "Home":
            e.preventDefault();
            targetIndex = 0;
            break;
          case "End":
            e.preventDefault();
            targetIndex = this.timelineItems.length - 1;
            break;
          case "Enter":
          case " ":
            e.preventDefault();
            const phase = parseInt(item.getAttribute("data-phase"));
            this.handleTimelineClick(phase);
            return;
        }

        if (targetIndex !== null) {
          this.timelineItems[targetIndex].focus();
        }
      });
    });
  }

  /**
   * Setup sticky behavior via JavaScript
   * Handles cases where CSS position: sticky doesn't work reliably
   * Disabled below 1024px for responsive tabs
   */
  setupStickyBehavior() {
    if (window.innerWidth < 1024) return; // Skip below 1024px
    if (!this.timelineNav) return;

    const sectionTop = this.section.offsetTop;
    const stickyTop = 120; // Match CSS top: 120px
    let isFixed = false;

    const updatePosition = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const sectionBottom = this.section.offsetTop + this.section.offsetHeight;
      const releaseOffset = window.innerHeight * 0.5; // release before next section overlaps
      const shouldBeFixed =
        scrollTop >= sectionTop - stickyTop &&
        scrollTop < sectionBottom - releaseOffset;

      if (shouldBeFixed && !isFixed) {
        // Switch to fixed
        const navRect = this.timelineNav.getBoundingClientRect();
        this.timelineNav.style.position = "fixed";
        this.timelineNav.style.top = `${stickyTop}px`;
        this.timelineNav.style.left = `${navRect.left}px`;
        this.timelineNav.style.width = `${navRect.width}px`;
        this.timelineNav.style.zIndex = "10";

        isFixed = true;
        console.log("[SupportContinuum] Timeline nav switched to FIXED");
      } else if (!shouldBeFixed && isFixed) {
        // Switch back to relative
        this.timelineNav.style.position = "relative";
        this.timelineNav.style.top = "auto";
        this.timelineNav.style.left = "auto";
        this.timelineNav.style.width = "auto";

        isFixed = false;
        console.log("[SupportContinuum] Timeline nav switched to RELATIVE");
      }
    };

    // Listen for scroll events
    window.addEventListener("scroll", updatePosition, { passive: true });

    // Handle window resize
    window.addEventListener(
      "resize",
      () => {
        if (window.innerWidth < 1024) {
          // Reset sticky behavior below 1024px (responsive tabs)
          this.timelineNav.style.position = "relative";
          this.timelineNav.style.top = "auto";
          this.timelineNav.style.left = "auto";
          this.timelineNav.style.width = "auto";
          isFixed = false;
        } else {
          updatePosition();
        }
      },
      { passive: true }
    );

    // Initial call
    updatePosition();
  }

  /**
   * Align image panels with the first timeline title text
   * Calculates the position based on timeline nav sticky position and title offset
   * Disabled below 1024px (panels are in normal flow)
   */
  alignPanelsWithTimeline() {
    if (!this.section || this.panels.length === 0) return;
    if (window.innerWidth < 1024) return; // Skip below 1024px

    // Find the first timeline title element
    const firstTimelineItem = this.timelineItems[0];
    if (!firstTimelineItem) return;

    const firstTitle = firstTimelineItem.querySelector(".timeline-title");
    if (!firstTitle) return;

    const calculateAlignment = () => {
      // Timeline nav is sticky at top: 120px
      const stickyTop = 120;

      // Get nav's current position and height
      const navRect = this.timelineNav.getBoundingClientRect();
      const navHeight = this.timelineNav.offsetHeight;

      // Find the title to align with (not the bullet)
      const firstTitle = firstTimelineItem.querySelector(".timeline-title");
      if (!firstTitle) return;

      const titleRect = firstTitle.getBoundingClientRect();

      // Calculate title's offset WITHIN the timeline nav container
      const titleOffsetInNav = titleRect.top - navRect.top;

      // Final panel position = sticky position + title offset within nav
      const panelTopValue = Math.round(stickyTop + titleOffsetInNav);

      console.log("[SupportContinuum] Aligning panels:", {
        stickyTop,
        navTop: navRect.top,
        navHeight,
        titleTop: titleRect.top,
        titleOffsetInNav,
        panelTopValue,
      });

      // Apply top position and height to all panels
      this.panels.forEach((panel) => {
        panel.style.top = `${panelTopValue}px`;
        panel.style.height = `${navHeight}px`;
      });
    };

    // Delay initial calculation until layout is fully rendered
    // This ensures CSS sticky positioning is applied and bullets are at their final positions
    requestAnimationFrame(() => {
      setTimeout(() => {
        calculateAlignment();
      }, 100);
    });

    // Recalculate on window resize (only above 1024px)
    window.addEventListener(
      "resize",
      () => {
        if (window.innerWidth >= 1024) {
          calculateAlignment();
        }
      },
      { passive: true }
    );
  }

  /**
   * Clamp helper
   */
  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  new SupportContinuum();
});

// Export for external use if needed
if (typeof window !== "undefined") {
  window.SupportContinuum = SupportContinuum;
}
