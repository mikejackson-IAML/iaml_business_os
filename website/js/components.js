/**
 * IAML Dynamic Header & Footer Components
 * Single source of truth for site-wide navigation
 *
 * Auto-initializes on page load and injects components into placeholders
 */

const getHeaderHTML = () => `
  <header class="header" id="header">
    <!-- Logo -->
    <a href="/" class="header-logo">
        <img src="https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/69042ba0346960d8775fb4a4.svg" alt="IAML Logo">
    </a>

    <!-- Right side: Nav + Button -->
    <div class="header-right">
        <!-- Desktop Navigation -->
        <nav>
            <ul class="header-nav">
                <li><a href="/featured-programs">Featured Programs</a></li>
                <li><a href="/corporate-training">Corporate Training</a></li>
                <li><a href="/about-us">Why IAML</a></li>
            </ul>
        </nav>

        <!-- Desktop CTA Button -->
        <a href="#" class="header-cta" onclick="connectPopup_open(); return false;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
            </svg>
            CONNECT WITH US
        </a>
    </div>

    <!-- Mobile Hamburger -->
    <button class="hamburger" id="hamburger" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
    </button>
  </header>

  <!-- Mobile Menu -->
  <div class="mobile-backdrop" id="mobileBackdrop"></div>
  <nav class="mobile-menu" id="mobileMenu">
      <a href="/featured-programs">Featured Programs</a>
      <a href="/corporate-training">Corporate Training</a>
      <a href="/about-us">Why IAML</a>
      <a href="#" class="header-cta" onclick="connectPopup_open(); closeMobileMenu(); return false;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
          </svg>
          CONNECT WITH US
      </a>
  </nav>
`;

const getFooterHTML = () => `
  <footer class="footer" role="contentinfo">
    <div class="wrap">
        <nav class="grid" aria-label="Footer">
            <!-- Brand -->
            <section class="brand" aria-label="Organization">
                <div class="logo">
                    <img src="https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/69042ba0346960d8775fb4a4.svg" alt="IAML logo">
                </div>
            </section>

            <!-- Programs -->
            <section class="col">
                <h3>Programs</h3>
                <ul class="list" aria-label="Programs">
                    <li><a href="/programs/employee-relations-law.html">Certificate in Employee Relations Law</a></li>
                    <li><a href="/programs/strategic-hr-leadership.html">Advanced Certificate in Strategic Employment Law</a></li>
                    <li><a href="/programs/workplace-investigations">Certificate in Workplace Investigations</a></li>
                    <li><a href="/programs/strategic-hr-leadership.html">Certificate in Strategic HR Leadership</a></li>
                    <li><a href="/programs/employee-benefits-law">Certificate in Employee Benefits Law</a></li>
                    <li><a href="/programs/employee-benefits-law-advanced">Advanced Certificate in Employee Benefits Law</a></li>
                </ul>
            </section>

            <!-- Resources -->
            <section class="col">
                <h3>Resources</h3>
                <ul class="list" aria-label="Resources">
                    <li><a href="/about-us">Why IAML</a></li>
                    <li><a href="/pages/faculty">Faculty</a></li>
                    <li><a href="https://iaml.com/alumni-benefits" target="_blank">Alumni Benefits</a></li>
                    <li><a href="/pages/corporate-training">Corporate Training</a></li>
                    <li><a href="/pages/program-schedule">Schedule &amp; Locations</a></li>
                </ul>
            </section>

            <!-- Support -->
            <section class="col">
                <h3>Support</h3>
                <ul class="list" aria-label="Support">
                    <li><a href="https://iaml.com/faq" target="_blank">FAQ</a></li>
                    <li><a href="https://iaml.com/contact-us" target="_blank">Contact</a></li>
                </ul>
            </section>
        </nav>

        <div class="bottom">
            <div>© ${new Date().getFullYear()} Institute for Applied Management &amp; Law, Inc. All rights reserved.</div>
        </div>
    </div>
  </footer>
`;

/**
 * Load header and footer components into their placeholder divs
 * Gracefully handles missing placeholders
 */
const loadComponents = () => {
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    headerPlaceholder.innerHTML = getHeaderHTML();
  }

  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    footerPlaceholder.innerHTML = getFooterHTML();
  }
};

/**
 * Auto-initialize on DOMContentLoaded
 * Supports both early and late script loading
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadComponents);
} else {
  // DOM already loaded (late script execution)
  loadComponents();
}
