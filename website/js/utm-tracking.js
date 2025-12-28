/**
 * IAML UTM and Attribution Tracking
 * Captures marketing attribution data and stores in sessionStorage
 * Run this on EVERY page of the website
 */

(function() {
  'use strict';

  /**
   * Capture UTM parameters from URL
   * Only captures on first visit (doesn't overwrite existing data)
   */
  function captureUTMParameters() {
    // Skip if already captured this session
    if (sessionStorage.getItem('iaml_utm_captured')) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);

    // Get all UTM parameters
    const utmData = {
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
      utm_content: urlParams.get('utm_content') || '',
      utm_term: urlParams.get('utm_term') || ''
    };

    // Only store if at least one UTM parameter exists
    const hasUTMData = Object.values(utmData).some(val => val !== '');

    if (hasUTMData) {
      sessionStorage.setItem('iaml_utm_data', JSON.stringify(utmData));
    }

    // Mark as captured (even if no UTM params) to prevent re-checking
    sessionStorage.setItem('iaml_utm_captured', 'true');
  }

  /**
   * Capture first touch attribution data
   * Only on very first page visit of session
   */
  function captureFirstTouch() {
    // Skip if already captured
    if (sessionStorage.getItem('iaml_landing_page')) {
      return;
    }

    // Capture landing page (current URL without query params for cleaner data)
    sessionStorage.setItem('iaml_landing_page', window.location.href);

    // Capture referring URL (where they came from)
    const referrer = document.referrer || '';
    sessionStorage.setItem('iaml_referring_url', referrer);
  }

  /**
   * Helper function to get all tracking data
   * Call this when submitting registration form
   */
  window.getIAMLTrackingData = function() {
    const utmDataStr = sessionStorage.getItem('iaml_utm_data');
    const utmData = utmDataStr ? JSON.parse(utmDataStr) : {};

    return {
      utm_source: utmData.utm_source || '',
      utm_medium: utmData.utm_medium || '',
      utm_campaign: utmData.utm_campaign || '',
      utm_content: utmData.utm_content || '',
      utm_term: utmData.utm_term || '',
      landing_page: sessionStorage.getItem('iaml_landing_page') || '',
      referring_url: sessionStorage.getItem('iaml_referring_url') || ''
    };
  };

  /**
   * Helper function to clear tracking data after successful registration
   */
  window.clearIAMLTrackingData = function() {
    sessionStorage.removeItem('iaml_utm_data');
    sessionStorage.removeItem('iaml_utm_captured');
    sessionStorage.removeItem('iaml_landing_page');
    sessionStorage.removeItem('iaml_referring_url');
  };

  // Run on page load
  captureUTMParameters();
  captureFirstTouch();

})();
