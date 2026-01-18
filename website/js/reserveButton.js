/**
 * Reserve Button Handler
 *
 * Handles clicks on "RESERVE YOUR SEAT" buttons in program session cards.
 * Navigates to the registration page with pre-filled parameters.
 */

(function() {
  'use strict';

  // Program name to URL slug mapping
  const PROGRAM_SLUGS = {
    // Full certificate programs
    'Certificate in Employee Relations Law': 'employee-relations-law',
    'Certificate in Employee Benefits Law': 'employee-benefits-law',
    'Certificate in Strategic HR Leadership': 'strategic-hr',
    'Certificate in Workplace Investigations': 'workplace-investigations',
    'Advanced Certificate in Strategic Employment Law': 'strategic-employment-law',
    'Advanced Certificate in Employee Benefits Law': 'advanced-benefits-law',

    // Individual blocks (map to parent certificate with block number)
    'Comprehensive Labor Relations': { slug: 'employee-relations-law', block: 1 },
    'Discrimination Prevention & Defense': { slug: 'employee-relations-law', block: 2 },
    'Discrimination Prevention and Defense': { slug: 'employee-relations-law', block: 2 },
    'Special Issues in Employment Law': { slug: 'employee-relations-law', block: 3 },
    'HR Law Fundamentals': { slug: 'strategic-hr', block: 1 },
    'Strategic HR Management': { slug: 'strategic-hr', block: 2 },
    'Retirement Plans': { slug: 'employee-benefits-law', block: 1 },
    'Benefit Plan Claims, Appeals & Litigation': { slug: 'employee-benefits-law', block: 2 },
    'Benefit Plan Claims, Appeals and Litigation': { slug: 'employee-benefits-law', block: 2 },
    'Welfare Benefits Plan Issues': { slug: 'employee-benefits-law', block: 3 }
  };

  // Format name to URL parameter mapping
  const FORMAT_MAP = {
    'In-Person': 'in-person',
    'in-person': 'in-person',
    'Virtual': 'virtual',
    'virtual': 'virtual',
    'On-Demand': 'on-demand',
    'On Demand': 'on-demand',
    'on-demand': 'on-demand'
  };

  /**
   * Generate registration URL from session data
   */
  function generateRegistrationUrl(programName, format, sessionId) {
    const baseUrl = 'https://iaml.com/register.html';
    const params = new URLSearchParams();

    // Get format slug
    const formatSlug = FORMAT_MAP[format];
    if (!formatSlug) {
      console.warn('Unknown format:', format);
      return baseUrl;
    }
    params.set('format', formatSlug);

    // Get program info
    const programInfo = PROGRAM_SLUGS[programName];
    if (!programInfo) {
      console.warn('Unknown program:', programName);
      return `${baseUrl}?${params.toString()}`;
    }

    // Handle block programs vs full certificate programs
    if (typeof programInfo === 'object') {
      params.set('program', programInfo.slug);
      params.set('blocks', programInfo.block.toString());
    } else {
      params.set('program', programInfo);
    }

    // Add session ID if available (for pre-selection)
    if (sessionId && sessionId.startsWith('rec')) {
      params.set('session', sessionId);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Handle reserve button click
   */
  function handleReserveClick(event) {
    const button = event.target.closest('.reserve-btn');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    // Get data from button attributes
    const programName = button.getAttribute('data-program') || '';
    const format = button.getAttribute('data-format') || '';
    const sessionId = button.getAttribute('data-session-id') || '';

    // Try to get registration URL from the session data if available
    // (This would be populated if the cache includes Registration URL)
    const registrationUrl = button.getAttribute('data-registration-url');

    let targetUrl;
    if (registrationUrl && registrationUrl.startsWith('http')) {
      // Use the pre-set registration URL from Airtable
      targetUrl = registrationUrl;
    } else {
      // Generate URL dynamically
      targetUrl = generateRegistrationUrl(programName, format, sessionId);
    }

    // Navigate to registration page
    window.location.href = targetUrl;
  }

  /**
   * Initialize event listeners
   */
  function init() {
    // Use event delegation on the document to catch all reserve button clicks
    document.addEventListener('click', function(event) {
      if (event.target.closest('.reserve-btn')) {
        handleReserveClick(event);
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.IAMLReserveButton = {
    generateUrl: generateRegistrationUrl
  };

})();
