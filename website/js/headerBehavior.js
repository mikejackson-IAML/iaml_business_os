/**
 * Header Scroll Behavior Module
 * Extracted from inline scripts - now centralized for DRY principle
 *
 * State Machine:
 * 1. AT_TOP (0-50px): Visible, transparent background
 * 2. SCROLLING_UP (>50px, moving up): Visible, glass effect
 * 3. SCROLLING_DOWN (>70px, moving down): Hidden
 *
 * Key Features:
 * - INSTANT response to scroll-up (no threshold)
 * - Asymmetric thresholds for better UX
 * - Debounced scroll direction detection
 * - Handles rapid direction changes
 * - Accounts for bounce scrolling
 */

(function() {
  'use strict';

  const initHeaderBehavior = () => {
    const header = document.getElementById('header');
    if (!header) return; // Exit if header not found (progressive enhancement)

    // Scroll state tracking
    let lastScrollTop = 0;
    let scrollDirection = 'none'; // 'up', 'down', 'none'
    let ticking = false;

    // Thresholds
    const GLASS_EFFECT_THRESHOLD = 50;  // When to apply glass morphism
    const HIDE_THRESHOLD = 70;           // When to hide header on scroll-down
    const SCROLL_DELTA_MIN = 1;          // Minimum scroll delta to register (handles jitter)

    // Direction change detection (prevents bounce scroll issues)
    let scrollDeltaAccumulator = 0;
    const DIRECTION_CHANGE_THRESHOLD = 5; // Pixels needed to confirm direction change

    /**
     * Main header update function - handles all state transitions
     * @param {number} scrollTop - Current scroll position
     */
    function updateHeader(scrollTop) {
      // Calculate scroll delta
      const scrollDelta = scrollTop - lastScrollTop;

      // Ignore micro-movements (browser jitter, sub-pixel rendering)
      if (Math.abs(scrollDelta) < SCROLL_DELTA_MIN) {
        ticking = false;
        return;
      }

      // =====================================================================
      // SCROLL DIRECTION DETECTION with debouncing
      // =====================================================================
      // Accumulate scroll delta to prevent false direction changes from
      // bounce scrolling or rapid micro-scrolls
      scrollDeltaAccumulator += scrollDelta;

      let newDirection = scrollDirection;

      if (scrollDeltaAccumulator > DIRECTION_CHANGE_THRESHOLD) {
        newDirection = 'down';
        scrollDeltaAccumulator = 0; // Reset accumulator
      } else if (scrollDeltaAccumulator < -DIRECTION_CHANGE_THRESHOLD) {
        newDirection = 'up';
        scrollDeltaAccumulator = 0; // Reset accumulator
      }

      // =====================================================================
      // STATE MACHINE: Determine header visibility and styling
      // =====================================================================

      // STATE 1: AT TOP (0-50px)
      // Always visible, no glass effect, transparent background
      if (scrollTop <= GLASS_EFFECT_THRESHOLD) {
        header.classList.remove('hidden');
        header.classList.remove('scrolled');
      }
      // STATE 2: SCROLLING DOWN (past hide threshold)
      // Hide header to maximize content visibility
      else if (newDirection === 'down' && scrollTop > HIDE_THRESHOLD) {
        header.classList.add('hidden');
        // Keep 'scrolled' class so it has glass effect when it reappears
        header.classList.add('scrolled');
      }
      // STATE 3: SCROLLING UP (anywhere past glass threshold)
      // IMMEDIATE appearance with glass effect - no waiting!
      else if (newDirection === 'up' && scrollTop > GLASS_EFFECT_THRESHOLD) {
        header.classList.remove('hidden');
        header.classList.add('scrolled');
      }
      // STATE 4: IN BETWEEN (50-70px, scrolling down but not past hide threshold)
      // Keep header visible with glass effect
      else if (scrollTop > GLASS_EFFECT_THRESHOLD && scrollTop <= HIDE_THRESHOLD) {
        header.classList.remove('hidden');
        header.classList.add('scrolled');
      }

      // Update tracking variables
      scrollDirection = newDirection;
      lastScrollTop = scrollTop;
      ticking = false;
    }

    /**
     * RequestAnimationFrame wrapper for scroll handling
     * Ensures we don't queue multiple animation frames
     */
    function requestTick() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateHeader(window.pageYOffset);
        });
        ticking = true;
      }
    }

    // Initialize scroll listener with passive flag for better performance
    window.addEventListener('scroll', requestTick, { passive: true });

    // =====================================================================
    // EDGE CASE HANDLING: Page load state
    // =====================================================================
    // Set initial state based on current scroll position
    // (handles page refresh while scrolled down, or anchor links)
    const initialScrollTop = window.pageYOffset;

    if (initialScrollTop <= GLASS_EFFECT_THRESHOLD) {
      header.classList.remove('hidden');
      header.classList.remove('scrolled');
    } else {
      // Page loaded while scrolled - show header with glass effect
      header.classList.remove('hidden');
      header.classList.add('scrolled');
    }

    lastScrollTop = initialScrollTop;
  };

  // Initialize on DOMContentLoaded or immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderBehavior);
  } else {
    initHeaderBehavior();
  }
})();
