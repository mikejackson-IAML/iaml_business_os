/**
 * IAML Dynamic Header & Footer Components
 * Single source of truth for site-wide navigation with mega menu
 *
 * Auto-initializes on page load and injects components into placeholders
 */

const getHeaderHTML = () => `
<header class="iaml-site-header top" role="banner">
  <style>
    .iaml-site-header{--iaml-header-navy:#0d2138;--iaml-header-blue:#18375e;--iaml-header-blue-2:#244f7d;--iaml-header-orange:#ef6a32;--iaml-header-line:#d9e3ee;--iaml-header-paper:rgba(251,252,255,.96);position:sticky;top:0;z-index:60;background:var(--iaml-header-paper);backdrop-filter:blur(16px);border-bottom:1px solid var(--iaml-header-line);font-family:Switzer,Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .iaml-site-header *{box-sizing:border-box}
    .iaml-site-header__bar{width:min(1180px,calc(100vw - 48px));height:76px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:26px}
    .iaml-site-header__logo{display:inline-flex;align-items:center;text-decoration:none;color:var(--iaml-header-navy)}
    .iaml-site-header__logo img{display:block;width:42px;height:42px;object-fit:contain}
    .iaml-site-header__nav-wrap{display:flex;align-items:center;gap:18px;margin-left:auto}
    .iaml-site-header__nav{display:flex;gap:23px;align-items:center}
    .iaml-site-header__nav a{font-size:11px;text-transform:uppercase;letter-spacing:.11em;font-weight:850;color:#344054;text-decoration:none;transition:color .18s ease;white-space:nowrap}
    .iaml-site-header__nav a:hover,.iaml-site-header__nav a[aria-current="page"]{color:var(--iaml-header-orange);text-decoration:none}
    .iaml-call-connect{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:42px;padding:0 17px;border-radius:999px;background:var(--iaml-header-blue);border:1px solid var(--iaml-header-blue);color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:900;box-shadow:0 12px 26px rgba(24,55,94,.22);white-space:nowrap;cursor:pointer;text-decoration:none;transition:background .18s ease,transform .18s ease,box-shadow .18s ease}
    .iaml-call-connect:hover{background:var(--iaml-header-blue-2);border-color:var(--iaml-header-blue-2);transform:translateY(-1px);box-shadow:0 16px 30px rgba(24,55,94,.26);text-decoration:none;color:#fff}
    .iaml-call-connect__icon{width:15px;height:15px;color:#8ee6ff;filter:drop-shadow(0 0 5px rgba(142,230,255,.88));animation:iamlCallBlink 1.15s ease-in-out infinite;transform-origin:center}
    @keyframes iamlCallBlink{0%,100%{opacity:1;transform:scale(1);filter:drop-shadow(0 0 5px rgba(142,230,255,.88))}45%{opacity:.32;transform:scale(.86);filter:drop-shadow(0 0 0 rgba(142,230,255,0))}68%{opacity:1;transform:scale(1.12);filter:drop-shadow(0 0 9px rgba(142,230,255,1))}}
    @media(max-width:1100px){.iaml-site-header__nav{display:none}.iaml-site-header__bar{width:min(100% - 34px,820px)}}
    @media(max-width:720px){.iaml-site-header{position:static}.iaml-site-header__bar{height:auto;min-height:64px;padding:12px 0}.iaml-site-header__logo img{width:34px;height:34px}.iaml-call-connect{min-height:38px;padding:0 14px;font-size:10px}}
    @media(prefers-reduced-motion:reduce){.iaml-call-connect__icon{animation:none}}
    .connectPopup-overlay{position:fixed;inset:0;z-index:9998;display:none;align-items:center;justify-content:center;background:rgba(8,20,35,.64);backdrop-filter:blur(8px);padding:22px}.connectPopup-overlay.active{display:flex}.connectPopup-modal{width:min(560px,100%);max-height:min(92vh,760px);overflow:auto;background:#fff;border-radius:24px;box-shadow:0 28px 80px rgba(8,20,35,.32);border:1px solid rgba(217,227,237,.8)}.connectPopup-header{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:22px 24px;border-bottom:1px solid #d9e3ee;background:#f8fbff}.connectPopup-header h3{margin:0;color:#10243b;font-family:Switzer,Inter,system-ui,sans-serif;font-size:20px;line-height:1.25}.connectPopup-closeBtn{width:36px;height:36px;border-radius:999px;border:1px solid #d9e3ee;background:#fff;color:#10243b;font-size:24px;line-height:1;cursor:pointer}.connectPopup-body{padding:24px}.connectPopup-body p{color:#526879;line-height:1.55}.connectPopup-form{display:grid;gap:14px}.connectPopup-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.connectPopup-group{display:grid;gap:7px}.connectPopup-group label,.connectPopup-choiceGroup legend{font-size:13px;font-weight:800;color:#10243b}.connectPopup-group input,.connectPopup-group textarea,.connectPopup-group select{width:100%;border:1px solid #cdd9e5;border-radius:12px;padding:12px 13px;font:inherit;color:#10243b;background:#fff}.connectPopup-group input:focus,.connectPopup-group textarea:focus,.connectPopup-group select:focus{outline:2px solid rgba(24,55,94,.22);border-color:#18375e}.connectPopup-choiceGroup{border:0;margin:0;padding:0}.connectPopup-choiceGrid{display:grid;gap:8px}.connectPopup-choiceGrid label{display:flex;gap:8px;align-items:center;color:#334b5f;font-size:14px}.connectPopup-submitBtn{min-height:44px;border:0;border-radius:999px;background:#18375e;color:#fff;font-weight:900;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.connectPopup-submitBtn:hover{background:#244f7d}.connectPopup-privacyNote{font-size:13px!important;margin:0!important}.muted{color:#718195;font-weight:500}@media(max-width:560px){.connectPopup-row{grid-template-columns:1fr}.connectPopup-body{padding:20px}.connectPopup-header{padding:18px}}
  </style>
  <div class="iaml-site-header__bar">
    <a class="iaml-site-header__logo" href="/" aria-label="IAML home"><img src="/images/iaml-logo.svg" alt="IAML"></a>
    <div class="iaml-site-header__nav-wrap">
      <nav class="iaml-site-header__nav" aria-label="Primary">
        <a href="/programs/">Programs</a>
        <a href="/corporate-training.html">Team Training</a>
        <a href="/program-schedule.html">Schedule</a>
        <a href="/faculty.html">Faculty</a>
        <a href="/about-us.html">About IAML</a>
        <a href="/contact-us.html">Contact</a>
      </nav>
      <button class="iaml-call-connect" type="button" onclick="connectPopup_open({ctaLabel:'Call Connect',ctaLocation:'global_header'}); return false;">
        <svg class="iaml-call-connect__icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.98.98 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02A11.36 11.36 0 0 1 8.63 4c0-.54-.45-1-.99-1H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
        <span>Call Connect</span>
      </button>
    </div>
  </div>
</header>
`;

const getFooterHTML = () => `
<footer class="iaml-footer" role="contentinfo">
  <style>
    .iaml-footer{
      --footer-navy:#0d2138;
      --footer-ink:#142235;
      --footer-muted:#5d7083;
      --footer-line:#d9e3ed;
      --footer-paper:#f8fbff;
      --footer-card:#ffffff;
      --footer-orange:#f1682f;
      --footer-blue:#18375e;
      background:linear-gradient(180deg,#fbfdff 0%,var(--footer-paper) 100%);
      border-top:1px solid var(--footer-line);
      color:var(--footer-ink);
      font-family:Switzer,Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    }
    .iaml-footer *{box-sizing:border-box}
    .iaml-footer a{color:inherit;text-decoration:none}
    .iaml-footer a:hover{color:var(--footer-orange)}
    .iaml-footer a:focus-visible{outline:2px solid var(--footer-orange);outline-offset:4px;border-radius:8px}
    .iaml-footer__wrap{width:min(1180px,calc(100vw - 48px));margin:0 auto}
    .iaml-footer__top{
      display:grid;
      grid-template-columns:minmax(280px,1.05fr) minmax(0,2.25fr);
      gap:54px;
      align-items:start;
      padding:54px 0 42px;
    }
    .iaml-footer__brand-card{
      padding:28px;
      border:1px solid rgba(217,227,237,.92);
      border-radius:28px;
      background:rgba(255,255,255,.72);
      box-shadow:0 18px 46px rgba(17,35,60,.055);
    }
    .iaml-footer__logo{display:inline-flex;align-items:center;margin-bottom:20px}
    .iaml-footer__logo img{display:block;width:76px;height:76px;object-fit:contain}
    .iaml-footer__brand-card p{margin:0;color:var(--footer-muted);font-size:15.5px;line-height:1.64}
    .iaml-footer__proof{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
      margin-top:24px;
      padding-top:22px;
      border-top:1px solid var(--footer-line);
    }
    .iaml-footer__proof strong{display:block;color:var(--footer-navy);font-family:Gambarino,Georgia,serif;font-size:30px;font-weight:500;line-height:1;letter-spacing:-.02em}
    .iaml-footer__proof span{display:block;margin-top:7px;color:#687a8a;font-size:10.5px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;line-height:1.25}
    .iaml-footer__utility{
      display:block;
      margin-bottom:30px;
      padding:0 0 24px;
      border-bottom:1px solid var(--footer-line);
    }
    .iaml-footer__utility p{max-width:760px;margin:0;color:var(--footer-muted);font-size:15.5px;line-height:1.58}
    .iaml-footer__utility strong{display:block;margin-bottom:7px;color:var(--footer-navy);font-size:13px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
    .iaml-footer__actions{max-width:760px;margin-top:8px;color:var(--footer-muted);font-size:14.5px;line-height:1.6;text-align:left}
    .iaml-footer__actions a{color:var(--footer-navy);font-weight:800;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
    .iaml-footer__actions a:hover{color:var(--footer-orange)}
    .iaml-footer__links-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:40px}
    .iaml-footer__col h3{margin:0 0 15px;color:var(--footer-navy);font-size:11px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}
    .iaml-footer__links{display:grid;gap:10px;margin:0;padding:0;list-style:none}
    .iaml-footer__links a{color:#40556a;font-size:15px;line-height:1.35}
    .iaml-footer__links a strong{color:var(--footer-navy);font-weight:780}
    .iaml-footer__note{margin:17px 0 0;color:var(--footer-muted);font-size:13.5px;line-height:1.56}
    .iaml-footer__bottom{
      display:flex;
      justify-content:space-between;
      gap:24px;
      align-items:center;
      flex-wrap:wrap;
      padding:24px 0 30px;
      border-top:1px solid var(--footer-line);
      color:#607386;
      font-size:13.25px;
    }
    .iaml-footer__legal{display:flex;gap:18px;flex-wrap:wrap}
    .iaml-footer__legal a{color:#607386}
    @media(max-width:1040px){
      .iaml-footer__top{grid-template-columns:1fr;gap:34px}
      .iaml-footer__brand-card{max-width:none}
      .iaml-footer__utility{align-items:flex-start;flex-direction:column}
      .iaml-footer__actions{max-width:none;text-align:left}
    }
    @media(max-width:760px){
      .iaml-footer__wrap{width:min(100% - 34px,620px)}
      .iaml-footer__top{padding:38px 0 34px}
      .iaml-footer__brand-card{padding:24px;border-radius:24px}
      .iaml-footer__links-grid{grid-template-columns:1fr;gap:30px}
      .iaml-footer__actions{max-width:none;text-align:left}
      .iaml-footer__proof{grid-template-columns:1fr 1fr}
      .iaml-footer__bottom{display:block}
      .iaml-footer__legal{margin-top:14px}
    }
  </style>
  <div class="iaml-footer__wrap">
    <div class="iaml-footer__top">
      <section class="iaml-footer__brand-card" aria-label="Institute for Applied Management and Law">
        <a class="iaml-footer__logo" href="/" aria-label="IAML home"><img src="/images/iaml-logo.svg" alt="IAML"></a>
        <p>Attorney-led workplace law training for HR, employee relations, benefits, legal, compliance, manager, and supervisor audiences.</p>
        <div class="iaml-footer__proof" aria-label="IAML proof points">
          <div><strong>1979</strong><span>Training since</span></div>
          <div><strong>80k+</strong><span>Professionals trained</span></div>
        </div>
      </section>

      <nav class="iaml-footer__nav" aria-label="Footer navigation">
        <section class="iaml-footer__utility" aria-label="Footer assistance">
          <p><strong>Need help choosing?</strong></p>
          <p class="iaml-footer__actions" aria-label="Footer assistance links">
            <a href="/programs/index.html?source=global-footer">Compare programs</a>,
            <a href="/program-schedule.html?source=global-footer">check dates</a>, or
            <a href="/contact-us.html?topic=program-fit&source=global-footer">ask for a short recommendation</a> before you register or plan training for a team.
          </p>
        </section>

        <div class="iaml-footer__links-grid">
          <section class="iaml-footer__col" aria-labelledby="footer-programs-heading">
            <h3 id="footer-programs-heading">Programs</h3>
            <ul class="iaml-footer__links">
              <li><a href="/programs/index.html"><strong>Compare all programs</strong></a></li>
              <li><a href="/programs/employee-relations-law.html">Employee Relations Law</a></li>
              <li><a href="/programs/workplace-investigations.html">Workplace Investigations</a></li>
              <li><a href="/programs/managers-supervisors-employment-law-training.html">Managers &amp; Supervisors</a></li>
              <li><a href="/programs/advanced-employment-law.html">Advanced Employment Law</a></li>
              <li><a href="/programs/employee-benefits-law.html">Employee Benefits Law</a></li>
            </ul>
          </section>

          <section class="iaml-footer__col" aria-labelledby="footer-buyer-heading">
            <h3 id="footer-buyer-heading">Find your path</h3>
            <ul class="iaml-footer__links">
              <li><a href="/program-schedule.html"><strong>Schedule and locations</strong></a></li>
              <li><a href="/contact-us.html?topic=program-details&source=global-footer">Request program details</a></li>
              <li><a href="/contact-us.html?topic=dates-pricing-credits&source=global-footer">Ask about dates, pricing, or credit</a></li>
              <li><a href="/corporate-training.html">Private team training</a></li>
              <li><a href="/contact-us.html?topic=team-training&source=global-footer">Plan training for a group</a></li>
              <li><a href="/faq.html">Registration FAQ</a></li>
            </ul>
          </section>

          <section class="iaml-footer__col" aria-labelledby="footer-company-heading">
            <h3 id="footer-company-heading">About IAML</h3>
            <ul class="iaml-footer__links">
              <li><a href="/about-us.html">About IAML</a></li>
              <li><a href="/faculty.html">Faculty</a></li>
              <li><a href="/participating-organizations.html">Participating organizations</a></li>
              <li><a href="/contact-us.html?source=global-footer">Contact IAML</a></li>
            </ul>
            <p class="iaml-footer__note">Questions? Ask about program fit, internal overview details, continuing credit, or team training.</p>
          </section>
        </div>
      </nav>
    </div>

    <div class="iaml-footer__bottom">
      <div>© <span data-iaml-year>2026</span> Institute for Applied Management &amp; Law. Workplace law training for HR, benefits, legal, compliance, and management teams.</div>
      <div class="iaml-footer__legal" aria-label="Legal links">
        <a href="/privacy-policy.html">Privacy Policy</a>
        <a href="/sitemap.xml">Sitemap</a>
      </div>
    </div>
  </div>
  <script>document.querySelectorAll('[data-iaml-year]').forEach(function(el){el.textContent=new Date().getFullYear();});</script>
</footer>
`;

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

// Booking Modal Functions
function openBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeBookingModal(e) {
  if (e && e.target !== e.currentTarget) return;
  const modal = document.getElementById('bookingModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// Make globally available for onclick handlers
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadComponents);
} else {
  loadComponents();
}
