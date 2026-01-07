/**
 * IAML Testimonials Endless Scroll
 *
 * Loads testimonials from JSON and distributes across 3 columns
 * with infinite vertical scroll animation.
 *
 * Features:
 * - Fetches from /data/testimonials/all-testimonials.json
 * - Shuffles testimonials for variety on each page load
 * - Distributes evenly across 3 columns
 * - Duplicates content for seamless infinite loop
 * - Pauses animation on hover (handled by CSS)
 */

(function() {
  'use strict';

  const TESTIMONIALS_JSON_PATH = 'data/testimonials/all-testimonials.json';

  /**
   * Fisher-Yates shuffle for randomizing testimonials
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled copy of the array
   */
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} str - String to escape
   * @returns {string} - Escaped string
   */
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Create a testimonial card HTML element
   * @param {Object} testimonial - Testimonial data
   * @returns {HTMLElement} - Card element
   */
  function createTestimonialCard(testimonial) {
    const card = document.createElement('div');
    card.className = 'tp-card';

    card.innerHTML = `
      <div class="tp-stars"></div>
      <blockquote class="tp-quote">
        "${escapeHTML(testimonial.quote)}"
      </blockquote>
      <div class="tp-author">
        <div class="tp-author-name">${escapeHTML(testimonial.authorName)}</div>
        <div class="tp-author-title">${escapeHTML(testimonial.authorTitle)}</div>
        ${testimonial.company ? `<div class="tp-author-company">${escapeHTML(testimonial.company)}</div>` : ''}
      </div>
    `;

    return card;
  }

  /**
   * Distribute testimonials across columns using round-robin
   * to ensure roughly equal distribution
   * @param {Array} testimonials - Array of testimonial objects
   * @param {number} numColumns - Number of columns
   * @returns {Array} - Array of arrays, one per column
   */
  function distributeTestimonials(testimonials, numColumns) {
    const columns = Array.from({ length: numColumns }, () => []);

    testimonials.forEach((testimonial, index) => {
      columns[index % numColumns].push(testimonial);
    });

    return columns;
  }

  /**
   * Populate a column with testimonials (duplicated for seamless loop)
   * @param {HTMLElement} columnElement - Column container element
   * @param {Array} testimonials - Testimonials for this column
   */
  function populateColumn(columnElement, testimonials) {
    const inner = columnElement.querySelector('.tp-column-inner');
    if (!inner) return;

    // Clear existing content
    inner.innerHTML = '';

    // Create document fragment for performance
    const fragment = document.createDocumentFragment();

    // Add testimonials twice for seamless infinite loop
    // (animation moves -50%, then resets to 0%)
    for (let i = 0; i < 2; i++) {
      testimonials.forEach(testimonial => {
        fragment.appendChild(createTestimonialCard(testimonial));
      });
    }

    inner.appendChild(fragment);
  }

  /**
   * Update the testimonial count in the subtitle
   * @param {number} count - Number of testimonials
   */
  function updateCount(count) {
    const countElement = document.getElementById('tp-count');
    if (countElement) {
      countElement.textContent = count;
    }
  }

  /**
   * Show loading state
   */
  function showLoading() {
    const wrapper = document.querySelector('.tp-columns-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 80px 20px;">
          <div style="width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #188bf6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
          <p style="color: #64748b; font-family: var(--font-body);">Loading testimonials...</p>
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
    }
  }

  /**
   * Show error state
   * @param {string} message - Error message
   */
  function showError(message) {
    const wrapper = document.querySelector('.tp-columns-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 80px 20px; color: #64748b;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 16px; display: block;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p style="font-family: var(--font-body); margin-bottom: 8px;">${escapeHTML(message)}</p>
          <button onclick="location.reload()" style="padding: 10px 24px; background: #188bf6; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: var(--font-body); font-weight: 600;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }

  /**
   * Rebuild the columns wrapper with proper structure
   */
  function rebuildColumnsWrapper() {
    const wrapper = document.querySelector('.tp-columns-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div class="tp-column tp-column-1">
          <div class="tp-column-inner"></div>
        </div>
        <div class="tp-column tp-column-2">
          <div class="tp-column-inner"></div>
        </div>
        <div class="tp-column tp-column-3">
          <div class="tp-column-inner"></div>
        </div>
      `;
    }
  }

  /**
   * Initialize the testimonials scroll
   */
  async function init() {
    // Show loading state
    showLoading();

    try {
      // Fetch testimonials JSON
      const response = await fetch(TESTIMONIALS_JSON_PATH);
      if (!response.ok) {
        throw new Error(`Failed to fetch testimonials: ${response.status}`);
      }

      const data = await response.json();
      const testimonials = data.testimonials || [];

      if (testimonials.length === 0) {
        showError('No testimonials found');
        return;
      }

      // Update the count
      updateCount(testimonials.length);

      // Shuffle for variety
      const shuffled = shuffleArray(testimonials);

      // Distribute across 3 columns
      const columns = distributeTestimonials(shuffled, 3);

      // Rebuild the wrapper structure
      rebuildColumnsWrapper();

      // Get column elements
      const column1 = document.querySelector('.tp-column-1');
      const column2 = document.querySelector('.tp-column-2');
      const column3 = document.querySelector('.tp-column-3');

      // Populate columns
      if (column1) populateColumn(column1, columns[0]);
      if (column2) populateColumn(column2, columns[1]);
      if (column3) populateColumn(column3, columns[2]);

      // Log success
      console.log(`[IAML] Loaded ${testimonials.length} testimonials across 3 columns`);

    } catch (error) {
      console.error('[IAML] Error loading testimonials:', error);
      showError('Unable to load testimonials. Please refresh the page.');
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
