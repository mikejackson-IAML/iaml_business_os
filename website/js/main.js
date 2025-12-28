// Main JavaScript Entry Point
// Coordinates all site functionality

(function() {
    'use strict';
    
    console.log('🚀 IAML Website Initialized');
    
    // ===== GLOBAL CONFIGURATION =====
    const SITE_CONFIG = {
      enableAnalytics: true,
      enableAnimations: true,
      debugMode: false
    };
    
    // ===== UTILITIES =====
    function log(message, data = null) {
      if (SITE_CONFIG.debugMode) {
        console.log(`[IAML] ${message}`, data || '');
      }
    }
    
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
    
    // ===== PERFORMANCE MONITORING =====
    function trackPerformance() {
      if (!SITE_CONFIG.enableAnalytics) return;
      
      window.addEventListener('load', () => {
        if ('performance' in window) {
          const perfData = window.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          log('Page Load Time:', `${pageLoadTime}ms`);
          
          // Send to analytics if gtag exists
          if (typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', {
              name: 'page_load',
              value: pageLoadTime,
              event_category: 'Performance'
            });
          }
        }
      });
    }
    
    // ===== LAZY LOADING IMAGES =====
    function initializeLazyLoading() {
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }
              observer.unobserve(img);
            }
          });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img);
        });
      } else {
        // Fallback for older browsers
        document.querySelectorAll('img[data-src]').forEach(img => {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        });
      }
    }
    
    // ===== EXTERNAL LINKS =====
    function initializeExternalLinks() {
      document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.href.includes(window.location.hostname)) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        }
      });
    }
    
    // ===== FORM VALIDATION =====
    function initializeFormValidation() {
      const forms = document.querySelectorAll('form[data-validate]');
      
      forms.forEach(form => {
        form.addEventListener('submit', function(e) {
          const requiredFields = form.querySelectorAll('[required]');
          let isValid = true;
          
          requiredFields.forEach(field => {
            if (!field.value.trim()) {
              isValid = false;
              field.classList.add('error');
            } else {
              field.classList.remove('error');
            }
          });
          
          if (!isValid) {
            e.preventDefault();
            log('Form validation failed');
          }
        });
      });
    }
    
    // ===== VIEWPORT HEIGHT FIX (Mobile) =====
    function fixViewportHeight() {
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      setVH();
      window.addEventListener('resize', debounce(setVH, 250));
    }
    
    // ===== BACK TO TOP BUTTON =====
    function initializeBackToTop() {
      const backToTopBtn = document.getElementById('backToTop');
      if (!backToTopBtn) return;

      window.addEventListener('scroll', debounce(() => {
        if (window.scrollY > 500) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      }, 100));

      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }

    // ===== CONSOLE BRANDING =====
    function showConsoleBranding() {
      const styles = [
        'color: #188bf6',
        'font-size: 20px',
        'font-weight: bold',
        'text-shadow: 2px 2px 0px rgba(0,0,0,0.2)'
      ].join(';');
      
      console.log('%cIAML', styles);
      console.log('%cInstitute for Applied Management & Law', 'color: #64748B; font-size: 12px;');
      console.log('%c🚀 Site built with care by Re-Vitalized Properties', 'color: #9ca3af; font-size: 11px; font-style: italic;');
    }
    
    // ===== MAIN INITIALIZATION =====
    function initialize() {
      log('Initializing site...');

      // Core functionality
      trackPerformance();
      initializeLazyLoading();
      initializeExternalLinks();
      initializeFormValidation();
      fixViewportHeight();
      initializeBackToTop();

      // Branding
      if (SITE_CONFIG.debugMode) {
        showConsoleBranding();
      }

      log('✅ Site initialized successfully');
    }
    
    // ===== DOM READY =====
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
    
    // ===== GLOBAL ERROR HANDLER =====
    window.addEventListener('error', (event) => {
      if (SITE_CONFIG.debugMode) {
        console.error('Global error caught:', event.error);
      }
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
          description: event.error?.message || 'Unknown error',
          fatal: false
        });
      }
    });
    
    // ===== EXPOSE PUBLIC API =====
    window.IAML = {
      config: SITE_CONFIG,
      log: log,
      utils: {
        debounce: debounce
      }
    };
    
  })();