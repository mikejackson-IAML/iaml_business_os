/**
 * IAML Contact Form Handler
 * Validates form input, submits to GoHighLevel, and handles UI states
 */

(function() {
  'use strict';

  // Form elements
  let form, submitBtn, successMsg, errorMsg;

  // Field definitions with validation rules
  const fields = {
    firstName: { required: true, minLength: 1 },
    lastName: { required: true, minLength: 1 },
    email: { required: true, type: 'email' },
    jobTitle: { required: false },
    company: { required: true, minLength: 1 },
    inquiryType: { required: true },
    message: { required: true, minLength: 10 }
  };

  /**
   * Initialize contact form
   */
  function init() {
    form = document.getElementById('contactForm');
    submitBtn = document.getElementById('submitBtn');
    successMsg = document.getElementById('contactSuccess');
    errorMsg = document.getElementById('contactError');

    if (!form) {
      return;
    }

    // Add submit handler
    form.addEventListener('submit', handleSubmit);

    // Add real-time validation on blur
    Object.keys(fields).forEach(fieldName => {
      const input = document.getElementById(fieldName);
      if (input) {
        input.addEventListener('blur', () => validateField(fieldName));
        input.addEventListener('input', () => clearFieldError(fieldName));
      }
    });
  }

  /**
   * Validate a single field
   * @param {string} fieldName - The field name to validate
   * @returns {boolean} - Whether the field is valid
   */
  function validateField(fieldName) {
    const input = document.getElementById(fieldName);
    const rules = fields[fieldName];
    const errorEl = document.getElementById(fieldName + 'Error');

    if (!input || !rules) return true;

    const value = input.value.trim();
    let error = '';

    // Required check
    if (rules.required && !value) {
      error = 'This field is required';
    }

    // Email validation
    if (!error && rules.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        error = 'Please enter a valid email address';
      }
    }

    // Min length check
    if (!error && rules.minLength && value && value.length < rules.minLength) {
      error = `Please enter at least ${rules.minLength} characters`;
    }

    // Update UI
    if (error) {
      input.classList.add('error');
      if (errorEl) errorEl.textContent = error;
      return false;
    } else {
      input.classList.remove('error');
      if (errorEl) errorEl.textContent = '';
      return true;
    }
  }

  /**
   * Clear field error state
   * @param {string} fieldName - The field name
   */
  function clearFieldError(fieldName) {
    const input = document.getElementById(fieldName);
    const errorEl = document.getElementById(fieldName + 'Error');

    if (input) input.classList.remove('error');
    if (errorEl) errorEl.textContent = '';
  }

  /**
   * Validate all form fields
   * @returns {boolean} - Whether all fields are valid
   */
  function validateForm() {
    let isValid = true;

    Object.keys(fields).forEach(fieldName => {
      if (!validateField(fieldName)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Collect form data
   * @returns {Object} - Form data object
   */
  function collectFormData() {
    const data = {};

    Object.keys(fields).forEach(fieldName => {
      const input = document.getElementById(fieldName);
      if (input) {
        data[fieldName] = input.value.trim();
      }
    });

    // Add UTM tracking data
    if (typeof window.getIAMLTrackingData === 'function') {
      const trackingData = window.getIAMLTrackingData();
      Object.assign(data, trackingData);
    }

    // Add timestamp and source
    data.submittedAt = new Date().toISOString();
    data.source = 'Website - Contact Form';
    data.pageUrl = window.location.href;

    return data;
  }

  /**
   * Set loading state on submit button
   * @param {boolean} loading - Whether to show loading state
   */
  function setLoading(loading) {
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.classList.toggle('loading', loading);
    }
  }

  /**
   * Show success message
   */
  function showSuccess() {
    if (form) form.hidden = true;
    if (successMsg) successMsg.hidden = false;
    if (errorMsg) errorMsg.hidden = true;

    // Scroll to success message
    if (successMsg) {
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Show error message
   */
  function showError() {
    if (errorMsg) errorMsg.hidden = false;

    // Scroll to error
    if (errorMsg) {
      errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  async function handleSubmit(event) {
    event.preventDefault();

    // Hide any previous error
    if (errorMsg) errorMsg.hidden = true;

    // Validate form
    if (!validateForm()) {
      // Focus first error field
      const firstError = form.querySelector('.error');
      if (firstError) firstError.focus();
      return;
    }

    // Set loading state
    setLoading(true);

    try {
      // Collect form data
      const formData = collectFormData();

      // Submit to GHL webhook proxy
      const response = await fetch('/api/ghl-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'contact',
          data: formData
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success
        showSuccess();

        // Track conversion in analytics if available
        if (typeof gtag === 'function') {
          gtag('event', 'form_submission', {
            event_category: 'Contact',
            event_label: formData.inquiryType
          });
        }
      } else {
        // API error
        console.error('Contact form submission failed:', result);
        showError();
      }

    } catch (error) {
      // Network or other error
      console.error('Contact form error:', error);
      showError();
    } finally {
      setLoading(false);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
