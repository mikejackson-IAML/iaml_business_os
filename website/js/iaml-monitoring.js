/*
 * IAML Phase 1 Website Monitoring
 * Homepage-first PostHog instrumentation with privacy-safe custom events.
 */
(function () {
  'use strict';

  var config = window.IAML_MONITORING_CONFIG || {};
  var pagePath = window.location.pathname || '/';
  var isHomepage = pagePath === '/' || /\/index\.html$/i.test(pagePath);
  var debug = Boolean(config.DEBUG) || window.localStorage.getItem('iaml_monitoring_debug') === '1';
  var key = config.POSTHOG_PUBLIC_KEY || getMetaContent('iaml-posthog-key') || window.localStorage.getItem('iaml_posthog_key') || '';
  var apiHost = config.POSTHOG_API_HOST || 'https://us.i.posthog.com';
  var enabledHosts = Array.isArray(config.ENABLED_HOSTS) ? config.ENABLED_HOSTS : ['iaml.com', 'www.iaml.com'];
  var hostname = window.location.hostname;
  var previewHosts = Array.isArray(config.PREVIEW_HOSTS) ? config.PREVIEW_HOSTS : [];
  var environment = resolveEnvironment(hostname, previewHosts, config.ENVIRONMENT || 'production');
  var hostAllowed = enabledHosts.indexOf(hostname) !== -1 || hostname === 'localhost' || hostname === '127.0.0.1';
  var enabled = Boolean(key) && !/^phc_REPLACE/i.test(key) && hostAllowed;
  var firedScrollDepths = {};
  var firedSections = {};
  var sessionStartedAt = Date.now();

  window.IAMLAnalytics = {
    enabled: enabled,
    capture: capture,
    getStatus: function () {
      return {
        enabled: enabled,
        hasPostHogKey: Boolean(key),
        hostAllowed: hostAllowed,
        pagePath: pagePath,
        isHomepage: isHomepage,
        environment: environment
      };
    }
  };

  if (enabled) {
    loadPostHog(key, apiHost);
  } else if (debug) {
    console.info('[IAML monitoring] PostHog disabled', window.IAMLAnalytics.getStatus());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomepageMonitoring);
  } else {
    initHomepageMonitoring();
  }

  function initHomepageMonitoring() {
    if (!isHomepage) return;

    capture('homepage_viewed', {
      page_title: document.title,
      referrer_host: safeReferrerHost(),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    });

    setupScrollDepthTracking();
    setupSectionViewTracking();
    setupClickTracking();
    setupUnloadTracking();
  }

  function loadPostHog(projectKey, host) {
    if (window.posthog && window.posthog.__loaded) return;

    (function (t, e) {
      var o, n, p, r;
      e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) {
        function g(t, e) {
          var o = e.split('.');
          if (o.length === 2) { t = t[o[0]]; e = o[1]; }
          t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); };
        }
        (p = t.createElement('script')).type = 'text/javascript';
        p.crossOrigin = 'anonymous';
        p.async = true;
        p.src = s.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
        (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r);
        var u = e;
        if (a !== undefined) u = e[a] = [];
        u.people = u.people || [];
        u.toString = function (t) { var e = 'posthog'; if (a !== undefined) e += '.' + a; if (!t) e += ' (stub)'; return e; };
        u.people.toString = function () { return u.toString(1) + '.people (stub)'; };
        o = 'init capture register register_once unregister identify alias set_config startSessionRecording stopSessionRecording has_opted_in_capturing has_opted_out_capturing opt_in_capturing opt_out_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags'.split(' ');
        for (n = 0; n < o.length; n++) g(u, o[n]);
        e._i.push([i, s, a]);
      }, e.__SV = 1);
    })(document, window.posthog || []);

    window.posthog.init(projectKey, {
      api_host: host,
      autocapture: true,
      capture_pageview: true,
      person_profiles: 'identified_only',
      disable_compression: false,
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
          email: true,
          text: true,
          textarea: true,
          number: true,
          tel: true,
          url: true
        }
      },
      loaded: function (posthog) {
        posthog.register({
          site_area: 'marketing_website',
          monitoring_phase: 'homepage_phase_1',
          environment: environment
        });
        capture('monitoring_initialized', { provider: 'posthog' });
      }
    });
  }

  function setupScrollDepthTracking() {
    var depths = [25, 50, 75, 90];
    var ticking = false;

    function checkDepth() {
      ticking = false;
      var doc = document.documentElement;
      var body = document.body;
      var scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
      var scrollHeight = Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight, doc.offsetHeight, body.clientHeight, doc.clientHeight);
      var viewport = window.innerHeight || doc.clientHeight || 0;
      var maxScroll = Math.max(scrollHeight - viewport, 1);
      var pct = Math.min(100, Math.round((scrollTop / maxScroll) * 100));

      depths.forEach(function (depth) {
        if (pct >= depth && !firedScrollDepths[depth]) {
          firedScrollDepths[depth] = true;
          capture('homepage_scroll_depth_reached', { depth_percent: depth });
        }
      });
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(checkDepth);
      }
    }, { passive: true });

    checkDepth();
  }

  function setupSectionViewTracking() {
    var sections = [
      ['hero', '.hero-section'],
      ['benefits', '.benefits-section'],
      ['journey_timeline', '.journey-timeline-section'],
      ['upcoming_programs', '#upcoming-programs-section'],
      ['program_quiz', '.quiz-section'],
      ['testimonials', '.testimonials-section'],
      ['faculty_intro', '.hero-headline-section-attroneys'],
      ['faculty_grid', '.faculty-section'],
      ['faq', '.faq-section'],
      ['final_cta', '#iaml-cta']
    ];

    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var name = entry.target.getAttribute('data-monitor-section');
        if (entry.isIntersecting && name && !firedSections[name]) {
          firedSections[name] = true;
          capture('homepage_section_viewed', { section: name });
        }
      });
    }, { threshold: 0.45 });

    sections.forEach(function (item) {
      var el = document.querySelector(item[1]);
      if (el) {
        el.setAttribute('data-monitor-section', item[0]);
        observer.observe(el);
      }
    });
  }

  function setupClickTracking() {
    document.addEventListener('click', function (event) {
      var target = event.target.closest('a, button');
      if (!target) return;

      var label = classifyClick(target);
      if (!label) return;

      capture('homepage_action_clicked', {
        action: label.action,
        area: label.area,
        destination_url: cleanUrl(target.getAttribute('href') || ''),
        element_type: target.tagName.toLowerCase(),
        link_text: safeText(target),
        is_external: isExternalHref(target.getAttribute('href') || '')
      });
    }, true);
  }

  function setupUnloadTracking() {
    window.addEventListener('pagehide', function () {
      capture('homepage_time_on_page', {
        seconds: Math.max(0, Math.round((Date.now() - sessionStartedAt) / 1000))
      });
    });
  }

  function classifyClick(target) {
    var href = (target.getAttribute('href') || '').toLowerCase();
    var id = (target.id || '').toLowerCase();
    var text = safeText(target).toLowerCase();
    var section = target.closest('[data-monitor-section]');
    var area = section ? section.getAttribute('data-monitor-section') : 'global';

    if (id === 'opencontactmodal' || /let'?s talk|contact|connect/.test(text)) return { action: 'clicked_contact_or_connect', area: area };
    if (/register|reserve your spot|register now/.test(text) || href.indexOf('register') !== -1) return { action: 'clicked_register', area: area };
    if (/program schedule|full schedule|schedule/.test(text) || href.indexOf('program-schedule') !== -1) return { action: 'clicked_program_schedule', area: area };
    if (/featured programs|explore featured programs/.test(text) || href.indexOf('featured-programs') !== -1) return { action: 'clicked_featured_programs', area: area };
    if (/faculty|meet our full faculty/.test(text) || href.indexOf('faculty') !== -1) return { action: 'clicked_faculty', area: area };
    if (target.classList.contains('option-btn')) return { action: 'answered_program_quiz_question', area: 'program_quiz' };
    if (id === 'backbutton' || /back/.test(text)) return { action: 'clicked_quiz_back', area: 'program_quiz' };
    if (/get more information/.test(text)) return { action: 'clicked_quiz_recommendation_more_info', area: 'program_quiz' };
    if (/start over/.test(text)) return { action: 'clicked_quiz_start_over', area: 'program_quiz' };
    if (target.classList.contains('faq-question')) return { action: 'clicked_faq_question', area: 'faq' };

    return null;
  }

  function capture(eventName, properties) {
    var payload = Object.assign({
      page_path: pagePath,
      page_url: cleanUrl(window.location.href),
      environment: environment
    }, properties || {});

    if (debug) console.info('[IAML monitoring]', eventName, payload);

    if (window.posthog && typeof window.posthog.capture === 'function' && enabled) {
      window.posthog.capture(eventName, payload);
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, iaml_monitoring: payload });
  }

  function getMetaContent(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.getAttribute('content') : '';
  }

  function resolveEnvironment(host, previewHostList, defaultEnvironment) {
    if (host === 'localhost' || host === '127.0.0.1') return 'local';
    if (previewHostList.indexOf(host) !== -1) return 'preview';
    return defaultEnvironment;
  }

  function safeText(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  function safeReferrerHost() {
    try {
      return document.referrer ? new URL(document.referrer).hostname : '';
    } catch (e) {
      return '';
    }
  }

  function cleanUrl(url) {
    if (!url) return '';
    try {
      var parsed = new URL(url, window.location.origin);
      parsed.searchParams.delete('email');
      parsed.searchParams.delete('phone');
      parsed.searchParams.delete('name');
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (e) {
      return String(url).slice(0, 200);
    }
  }

  function isExternalHref(href) {
    if (!href) return false;
    try {
      return new URL(href, window.location.origin).origin !== window.location.origin;
    } catch (e) {
      return false;
    }
  }
})();
