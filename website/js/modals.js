// Modal Systems - Registration, Contact, Popup modals
// Handles all modal functionality across the site

// ===== CONTACT MODAL (Connect Popup) =====
const GHL_WEBHOOK = '/api/ghl-webhook';
const CONNECT_TIMEOUT_MS = 20000;

let connectTimeoutHandle = null;
let countdownInterval = null;
let lastSubmission = { firstName: '', phone: '' };

// Open/Close Functions
function connectPopup_open() {
  const modal = document.getElementById('connectPopup_Modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderStep('form');
  }
}

function connectPopup_close() {
  const modal = document.getElementById('connectPopup_Modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    clearTimeout(connectTimeoutHandle);
    clearInterval(countdownInterval);
  }
}

function connectPopup_closeOnOverlay(e) {
  if (e.target === e.currentTarget) connectPopup_close();
}

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') connectPopup_close();
});

// Countdown timer function
function startCountdown() {
  clearInterval(countdownInterval);
  let countdownValue = 20;

  countdownInterval = setInterval(() => {
    countdownValue--;

    const numEl = document.getElementById('countdown-number');
    const textEl = document.getElementById('countdown-text');
    const progressEl = document.getElementById('progress-circle');
    
    if (numEl) numEl.textContent = countdownValue;
    if (textEl) textEl.textContent = countdownValue;
    if (progressEl) {
      const offset = 138.23 * (1 - countdownValue / 20);
      progressEl.style.strokeDashoffset = offset;
    }

    if (countdownValue <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);
}

// Step Renderer
function renderStep(step, payload = {}) {
  const root = document.getElementById('connectPopup_Content');
  if (!root) return;
  
  if (step === 'form') {
    root.innerHTML = `
      <p>We'll connect you with one of our program coordinators who can answer your questions and get you exactly what you need.</p>
      <form class="connectPopup-form" id="connectPopup_Form">
        <div class="connectPopup-group">
          <label for="connectPopup_phone">Phone Number *</label>
          <input type="tel" id="connectPopup_phone" name="phone" placeholder="(555) 555-5555" required />
        </div>
        <button type="submit" class="connectPopup-submitBtn">CONNECT</button>
      </form>
    `;
    document.getElementById('connectPopup_Form').addEventListener('submit', connectPopup_submit);
    
    // Phone number formatting
    const phoneInput = document.getElementById('connectPopup_phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 10);
        
        let formattedValue = '';
        if (value.length > 0) {
          formattedValue = '(' + value.substring(0, 3);
        }
        if (value.length >= 4) {
          formattedValue += ') ' + value.substring(3, 6);
        }
        if (value.length >= 7) {
          formattedValue += '-' + value.substring(6, 10);
        }
        
        e.target.value = formattedValue;
      });
    }
  }
  
  if (step === 'connecting') {
    root.innerHTML = `
      <div class="connectPopup-thinking" role="status" aria-live="polite">
        <div class="phone-pulse-with-timer" aria-hidden="true">
          <svg class="countdown-circle" viewBox="0 0 50 50">
            <circle class="countdown-bg" cx="25" cy="25" r="22" fill="none" stroke="#28528c" stroke-width="3"/>
            <circle class="countdown-progress" cx="25" cy="25" r="22" fill="none" stroke="#28528c" stroke-width="3" 
                    stroke-linecap="round" transform="rotate(-90 25 25)" id="progress-circle"/>
          </svg>
          <div class="countdown-number" id="countdown-number">20</div>
          <svg class="phone-icon-small" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        </div>
        <div class="muted">
          <strong>Connecting you in <span id="countdown-text">20</span> seconds...</strong>
          <div class="small-gap">We're matching you with the specialist who can best answer your questions about our programs, services, or any other support you need.</div>
        </div>
      </div>
      <p class="muted" style="margin-top: 16px;">If a coordinator picks up, we'll connect you right away. Please keep this window open.</p>
    `;
    
    // Start the countdown timer
    startCountdown();
  }
  
  if (step === 'email-fallback') {
    root.innerHTML = `
      <div id="connectPopup_waitText1">We're still trying to connect you...</div>
      <div id="connectPopup_waitText2" style="opacity:0;">Our coordinators are currently helping other professionals with their program decisions, but we don't want to delay your registration process. Let's get your questions answered via email instead.</div>
      <form class="connectPopup-form" id="connectPopup_EmailForm">
        <div class="connectPopup-group">
          <label for="connectPopup_email">Email *</label>
          <input type="email" id="connectPopup_email" name="email" placeholder="you@company.com" required />
        </div>
        <div class="connectPopup-group">
          <label for="connectPopup_question">Question *</label>
          <textarea rows="4" id="connectPopup_question" name="question" placeholder="submit your question" required></textarea>
        </div>
        <button type="submit" class="connectPopup-submitBtn">GET ANSWERS NOW</button>
      </form>
    `;
    requestAnimationFrame(() => setTimeout(() => {
      const el = document.getElementById('connectPopup_waitText2');
      if (el) el.style.opacity = 1;
    }, 1300));
    document.getElementById('connectPopup_EmailForm').addEventListener('submit', connectPopup_submitEmailFallback);
  }
  
  if (step === 'success') {
    root.innerHTML = `
      <p><strong>Thanks!</strong> We've received your details and a coordinator will reach out shortly.</p>
    `;
  }
  
  if (step === 'error') {
    root.innerHTML = `
      <p><strong>Hmm, something went wrong.</strong></p>
      <p class="muted">${payload.message || 'Please try again, or send your details by email below.'}</p>
      <button class="connectPopup-submitBtn" onclick="renderStep('form')">Try Again</button>
    `;
  }
}

// Submit: Connect attempt
async function connectPopup_submit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const firstName = (formData.get('firstName') || '').toString().trim();
  const phone = (formData.get('phone') || '').toString().trim();
  lastSubmission = { firstName, phone };
  
  renderStep('connecting');
  
  clearTimeout(connectTimeoutHandle);
  connectTimeoutHandle = setTimeout(() => renderStep('email-fallback'), CONNECT_TIMEOUT_MS);
  
  try {
    const res = await fetch(GHL_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'contact',
        data: {
          firstName,
          phone,
          tags: 'contact_button_initiated',
          source: 'Website Contact Form',
          contactType: 'lead'
        }
      })
    });
    
    if (!res.ok) {
      const result = await safeJson(res);
      throw new Error(result?.message || `Request failed (${res.status})`);
    }
    
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_submit', {
        event_category: 'Contact',
        event_label: 'Connect Modal Success'
      });
    }
  } catch (err) {
    console.error('Webhook error:', err);
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_error', {
        event_category: 'Contact',
        event_label: 'Connect Modal Error',
        error_message: String(err?.message || err)
      });
    }
    clearTimeout(connectTimeoutHandle);
    renderStep('email-fallback');
  }
}

// Submit: Email fallback
async function connectPopup_submitEmailFallback(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const email = (fd.get('email') || '').toString().trim();
  
  const btn = e.target.querySelector('.connectPopup-submitBtn');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  
  try {
    const res = await fetch(GHL_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'contact',
        data: {
          firstName: lastSubmission.firstName,
          phone: lastSubmission.phone,
          email,
          tags: 'contact_button_email_fallback',
          source: 'Website Contact Form',
          contactType: 'lead'
        }
      })
    });
    
    if (!res.ok) {
      const result = await safeJson(res);
      throw new Error(result?.message || `Request failed (${res.status})`);
    }
    
    renderStep('success', { firstName: lastSubmission.firstName });
  } catch (err) {
    console.error('Fallback error:', err);
    renderStep('error', { message: "We couldn't send your email just now. Please try again." });
  }
}

// Helpers
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ===== RECOMMENDATION MODAL (Quiz Results) =====
function closeModal() {
  const modal = document.getElementById('recommendationModal');
  if (modal) modal.style.display = 'none';
  
  // Reset quiz if function exists
  if (typeof resetQuiz === 'function') {
    setTimeout(() => resetQuiz(), 400);
  }
}

// ===== FIRST VISIT POPUP MODAL =====
const FIRST_VISIT_STORAGE_KEY = 'iaml_firstvisit_seen';
const FIRST_VISIT_AUTO_CLOSE_MS = 9000;
let firstVisitTimeoutHandle = null;

/**
 * Creates and injects the first visit popup HTML into the DOM
 */
function createFirstVisitPopupHTML() {
  // Don't create if already exists
  if (document.getElementById('firstVisitPopup')) return;

  const popupHTML = `
    <div class="firstVisit-overlay" id="firstVisitPopup">
      <div class="firstVisit-modal" onclick="event.stopPropagation()">
        <div class="firstVisit-content">
          <!-- Act 1: Quote + Attribution -->
          <div class="firstVisit-act1" id="firstVisitAct1">
            <div class="firstVisit-quote-container">
              <span class="firstVisit-quotemark firstVisit-quotemark--open">"</span>
              <blockquote class="firstVisit-quote">
                My only wish is that I had attended this seminar earlier in my career!
              </blockquote>
              <span class="firstVisit-quotemark firstVisit-quotemark--close">"</span>
            </div>

            <div class="firstVisit-attribution">
              <span class="firstVisit-author-name">Christina Lipetzky</span>
              <span class="firstVisit-author-line"></span>
              <span class="firstVisit-author-title">Human Resources Manager</span>
              <span class="firstVisit-author-company">Montana Department of Environmental Quality</span>
            </div>
          </div>

          <!-- Act 2: Tagline + Progress (same position as Act 1) -->
          <div class="firstVisit-act2" id="firstVisitAct2">
            <p class="firstVisit-subtitle">
              Where professional advancement meets business impact
            </p>
            <div class="firstVisit-divider"></div>

            <div class="firstVisit-progress" id="firstVisitProgress">
              <div class="firstVisit-progress-bar">
                <div class="firstVisit-progress-fill" id="firstVisitProgressFill"></div>
              </div>
              <div class="firstVisit-progress-text">Preparing your customized training experience...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insert at end of body
  document.body.insertAdjacentHTML('beforeend', popupHTML);

  // Add click listener to overlay
  const popup = document.getElementById('firstVisitPopup');
  if (popup) {
    popup.addEventListener('click', closeFirstVisitPopupOnOverlay);
  }
}

/**
 * Initialize and show the first visit popup if user hasn't seen it
 */
function initFirstVisitPopup() {
  // Check if user has seen popup before
  try {
    if (localStorage.getItem(FIRST_VISIT_STORAGE_KEY)) {
      return; // Already seen, don't show
    }
  } catch (e) {
    // localStorage not available, show popup anyway
    console.warn('localStorage not available for first visit tracking');
  }

  // Create popup HTML
  createFirstVisitPopupHTML();

  const popup = document.getElementById('firstVisitPopup');
  if (!popup) return;

  // Mark as seen immediately
  try {
    localStorage.setItem(FIRST_VISIT_STORAGE_KEY, 'true');
  } catch (e) {
    // Ignore storage errors
  }

  // Show popup immediately
  popup.classList.add('active');
  document.body.style.overflow = 'hidden';

  // ===== TWO-ACT REVEAL TIMING =====

  // Act 1: Quote + Attribution (0-4s) - visible by default

  // At 4s: Fade out Act 1, show Act 2 (at same position)
  setTimeout(() => {
    const act1 = document.getElementById('firstVisitAct1');
    const act2 = document.getElementById('firstVisitAct2');
    if (act1) act1.classList.add('fade-out');
    if (act2) act2.classList.add('show');
  }, 4000);

  // At 5.5s: Show progress bar animation
  setTimeout(() => {
    const progress = document.getElementById('firstVisitProgress');
    const progressFill = document.getElementById('firstVisitProgressFill');
    if (progress) {
      progress.classList.add('show');
    }
    if (progressFill) {
      // Force reflow before starting animation
      void progressFill.offsetWidth;
      requestAnimationFrame(() => {
        progressFill.classList.add('animate');
      });
    }
  }, 5500);

  // Auto-close after 9 seconds
  firstVisitTimeoutHandle = setTimeout(() => {
    closeFirstVisitPopup();
  }, FIRST_VISIT_AUTO_CLOSE_MS);
}

/**
 * Close the first visit popup
 */
function closeFirstVisitPopup() {
  const popup = document.getElementById('firstVisitPopup');
  if (popup) {
    popup.classList.remove('active');
    document.body.style.overflow = 'auto';
    clearTimeout(firstVisitTimeoutHandle);
  }
}

/**
 * Close popup when clicking on overlay (not modal content)
 */
function closeFirstVisitPopupOnOverlay(e) {
  if (e.target === e.currentTarget) {
    closeFirstVisitPopup();
  }
}

// Add Escape key support for first visit popup
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const popup = document.getElementById('firstVisitPopup');
    if (popup && popup.classList.contains('active')) {
      closeFirstVisitPopup();
    }
  }
});

/**
 * Debug helper: Reset popup state for testing
 * Call resetFirstVisitPopup() from browser console to test again
 */
function resetFirstVisitPopup() {
  try {
    localStorage.removeItem(FIRST_VISIT_STORAGE_KEY);
    console.log('First visit popup reset - will show on next page load');
  } catch (e) {
    console.error('Could not reset popup:', e);
  }
}

// ===== CTA BUTTON WIRING =====
document.addEventListener('DOMContentLoaded', function() {
  // Wire up contact modal button
  const openContactBtn = document.getElementById('openContactModal');
  if (openContactBtn) {
    openContactBtn.addEventListener('click', function() {
      if (typeof connectPopup_open === 'function') {
        connectPopup_open();
      } else {
        const event = new CustomEvent('openContactModal');
        document.dispatchEvent(event);
      }
    });
  }
  
  // Initialize first visit popup
  initFirstVisitPopup();
});

// Make functions globally available
if (typeof window !== 'undefined') {
  window.connectPopup_open = connectPopup_open;
  window.connectPopup_close = connectPopup_close;
  window.connectPopup_closeOnOverlay = connectPopup_closeOnOverlay;
  window.renderStep = renderStep;
  window.closeModal = closeModal;
  window.closeFirstVisitPopup = closeFirstVisitPopup;
  window.closeFirstVisitPopupOnOverlay = closeFirstVisitPopupOnOverlay;
  window.resetFirstVisitPopup = resetFirstVisitPopup;
}