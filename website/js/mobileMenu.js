/**
 * Mobile Menu Functionality
 * Extracted from inline scripts - now centralized
 *
 * Handles:
 * - Hamburger menu toggle
 * - Mobile menu open/close
 * - Backdrop click to close
 * - Window resize (close menu on desktop)
 * - Link click (auto-close menu)
 */

(function() {
  'use strict';

  const initMobileMenu = () => {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileBackdrop = document.getElementById('mobileBackdrop');

    if (!hamburger || !mobileMenu || !mobileBackdrop) return; // Progressive enhancement

    /**
     * Toggle mobile menu open/closed
     */
    function toggleMobileMenu() {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      mobileBackdrop.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    }

    /**
     * Close mobile menu
     * Exposed globally for use in header onclick handlers
     */
    function closeMobileMenu() {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      mobileBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Hamburger click handler
    hamburger.addEventListener('click', toggleMobileMenu);

    // Backdrop click handler
    mobileBackdrop.addEventListener('click', closeMobileMenu);

    // Auto-close menu when clicking links
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });

    // Close menu on window resize (when transitioning to desktop view)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        closeMobileMenu();
      }
    });

    // Expose globally (needed by header CTA onclick: "closeMobileMenu()")
    window.closeMobileMenu = closeMobileMenu;
  };

  // Initialize on DOMContentLoaded or immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
  } else {
    initMobileMenu();
  }
})();
