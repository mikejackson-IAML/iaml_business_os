/**
 * IAML Mega Menu JavaScript
 *
 * Handles all mega menu interactions:
 * - Desktop hover/click behavior with safe zones
 * - Mobile accordion toggles
 * - Keyboard navigation (Tab, Arrow keys, ESC)
 * - ARIA attributes for accessibility
 * - Dynamic spotlight data from Airtable
 *
 * @author IAML
 * @version 1.0.0
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================

    const CONFIG = {
        hoverDelay: 150,          // Delay before opening menu on hover (ms)
        closeDelay: 100,          // Delay before closing menu when leaving (ms)
        safeZoneBuffer: 50,       // Extra pixels for diagonal movement safe zone
        mobileBreakpoint: 1024,   // Max width for mobile behavior
        airtableBaseId: 'applWPVmMkgMWoZIC',
        airtableTableId: 'Programs',  // Update with actual table name
    };

    // ============================================
    // STATE
    // ============================================

    let activeMenu = null;
    let hoverTimeout = null;
    let closeTimeout = null;
    let lastMousePosition = { x: 0, y: 0 };

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const megaMenuBackdrop = document.getElementById('megaMenuBackdrop');
    const megaMenus = {
        'programs': document.getElementById('mega-menu-programs'),
        'corporate': document.getElementById('mega-menu-corporate'),
        'why-iaml': document.getElementById('mega-menu-why-iaml')
    };

    // ============================================
    // DESKTOP MEGA MENU BEHAVIOR
    // ============================================

    /**
     * Opens a mega menu panel
     * @param {string} menuId - The menu identifier (programs, corporate, why-iaml)
     */
    function openMegaMenu(menuId) {
        // Close any other open menu
        if (activeMenu && activeMenu !== menuId) {
            closeMegaMenu(false);
        }

        const menu = megaMenus[menuId];
        const trigger = document.querySelector(`[data-menu="${menuId}"] .mega-nav-trigger`);

        if (menu && trigger) {
            activeMenu = menuId;
            menu.classList.add('active');
            megaMenuBackdrop.classList.add('active');
            trigger.setAttribute('aria-expanded', 'true');

            // Prevent body scroll when menu is open
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Closes the currently active mega menu
     * @param {boolean} resetScroll - Whether to reset body scroll
     */
    function closeMegaMenu(resetScroll = true) {
        if (!activeMenu) return;

        const menu = megaMenus[activeMenu];
        const trigger = document.querySelector(`[data-menu="${activeMenu}"] .mega-nav-trigger`);

        if (menu) {
            menu.classList.remove('active');
        }
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }

        megaMenuBackdrop.classList.remove('active');
        activeMenu = null;

        if (resetScroll) {
            document.body.style.overflow = '';
        }
    }

    // Make closeMegaMenu available globally for onclick handlers
    window.closeMegaMenu = closeMegaMenu;

    /**
     * Checks if cursor is within safe zone for diagonal movement
     * @param {MouseEvent} e - Mouse event
     * @param {Element} targetMenu - The mega menu element
     * @returns {boolean} - True if in safe zone
     */
    function isInSafeZone(e, targetMenu) {
        if (!targetMenu) return false;

        const menuRect = targetMenu.getBoundingClientRect();
        const triggerRect = document.querySelector(`[data-menu="${activeMenu}"]`)?.getBoundingClientRect();

        if (!triggerRect) return false;

        // Calculate if cursor is moving toward the menu
        const dx = e.clientX - lastMousePosition.x;
        const dy = e.clientY - lastMousePosition.y;

        // If moving down toward menu, extend grace period
        if (dy > 0 && e.clientY < menuRect.top + CONFIG.safeZoneBuffer) {
            // Check if cursor is horizontally within trigger bounds (with buffer)
            if (e.clientX >= triggerRect.left - CONFIG.safeZoneBuffer &&
                e.clientX <= triggerRect.right + CONFIG.safeZoneBuffer) {
                return true;
            }
        }

        return false;
    }

    /**
     * Initializes desktop mega menu event listeners
     */
    function initDesktopMegaMenu() {
        const navItems = document.querySelectorAll('.mega-nav-item');

        navItems.forEach(item => {
            const menuId = item.dataset.menu;
            const trigger = item.querySelector('.mega-nav-trigger');

            if (!menuId || !trigger) return;

            // Hover to open
            item.addEventListener('mouseenter', () => {
                clearTimeout(closeTimeout);
                clearTimeout(hoverTimeout);

                hoverTimeout = setTimeout(() => {
                    if (window.innerWidth > CONFIG.mobileBreakpoint) {
                        openMegaMenu(menuId);
                    }
                }, CONFIG.hoverDelay);
            });

            // Track mouse position for safe zone
            item.addEventListener('mousemove', (e) => {
                lastMousePosition = { x: e.clientX, y: e.clientY };
            });

            // Close on mouse leave (with delay for safe zone)
            item.addEventListener('mouseleave', (e) => {
                clearTimeout(hoverTimeout);
                clearTimeout(closeTimeout);

                closeTimeout = setTimeout(() => {
                    const menu = megaMenus[menuId];
                    if (menu && !menu.matches(':hover') && !isInSafeZone(e, menu)) {
                        closeMegaMenu();
                    }
                }, CONFIG.closeDelay);
            });

            // Click to toggle (accessibility)
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.innerWidth > CONFIG.mobileBreakpoint) {
                    if (activeMenu === menuId) {
                        closeMegaMenu();
                    } else {
                        openMegaMenu(menuId);
                    }
                }
            });
        });

        // Keep menu open when hovering over it
        Object.values(megaMenus).forEach(menu => {
            if (!menu) return;

            menu.addEventListener('mouseenter', () => {
                clearTimeout(closeTimeout);
            });

            menu.addEventListener('mouseleave', () => {
                closeTimeout = setTimeout(() => {
                    closeMegaMenu();
                }, CONFIG.closeDelay);
            });

            // Track mouse in menu
            menu.addEventListener('mousemove', (e) => {
                lastMousePosition = { x: e.clientX, y: e.clientY };
            });
        });

        // Close on backdrop click
        if (megaMenuBackdrop) {
            megaMenuBackdrop.addEventListener('click', () => {
                closeMegaMenu();
            });
        }

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && activeMenu) {
                closeMegaMenu();
                // Return focus to trigger
                const trigger = document.querySelector(`[data-menu="${activeMenu}"] .mega-nav-trigger`);
                if (trigger) trigger.focus();
            }
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!activeMenu) return;

            const isInNav = e.target.closest('.mega-nav');
            const isInMenu = e.target.closest('.mega-menu');

            if (!isInNav && !isInMenu) {
                closeMegaMenu();
            }
        });

        // Close on window resize if crossing mobile breakpoint
        let wasDesktop = window.innerWidth > CONFIG.mobileBreakpoint;
        window.addEventListener('resize', () => {
            const isDesktop = window.innerWidth > CONFIG.mobileBreakpoint;
            if (wasDesktop && !isDesktop && activeMenu) {
                closeMegaMenu();
            }
            wasDesktop = isDesktop;
        });
    }

    // ============================================
    // MOBILE ACCORDION BEHAVIOR
    // ============================================

    /**
     * Initializes mobile accordion event listeners
     */
    function initMobileAccordion() {
        const accordionTriggers = document.querySelectorAll('.mobile-accordion-trigger');

        accordionTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                const accordion = trigger.closest('.mobile-accordion');
                const content = accordion.querySelector('.mobile-accordion-content');
                const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

                // Close other accordions (optional - remove if you want multiple open)
                accordionTriggers.forEach(otherTrigger => {
                    if (otherTrigger !== trigger) {
                        otherTrigger.setAttribute('aria-expanded', 'false');
                        const otherContent = otherTrigger.closest('.mobile-accordion').querySelector('.mobile-accordion-content');
                        if (otherContent) otherContent.classList.remove('active');
                    }
                });

                // Toggle current accordion
                trigger.setAttribute('aria-expanded', !isExpanded);
                content.classList.toggle('active');
            });
        });

        // Close mobile menu when clicking a link
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    closeMobileMenu();
                });
            });
        }
    }

    // ============================================
    // KEYBOARD NAVIGATION
    // ============================================

    /**
     * Initializes keyboard navigation for mega menus
     */
    function initKeyboardNavigation() {
        const navItems = document.querySelectorAll('.mega-nav-item, .mega-nav .header-nav > li:not(.mega-nav-item)');

        navItems.forEach((item, index) => {
            const trigger = item.querySelector('.mega-nav-trigger') || item.querySelector('.mega-nav-link');
            if (!trigger) return;

            trigger.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowRight':
                        e.preventDefault();
                        const nextItem = navItems[index + 1];
                        if (nextItem) {
                            const nextTrigger = nextItem.querySelector('.mega-nav-trigger, .mega-nav-link');
                            if (nextTrigger) nextTrigger.focus();
                        }
                        break;

                    case 'ArrowLeft':
                        e.preventDefault();
                        const prevItem = navItems[index - 1];
                        if (prevItem) {
                            const prevTrigger = prevItem.querySelector('.mega-nav-trigger, .mega-nav-link');
                            if (prevTrigger) prevTrigger.focus();
                        }
                        break;

                    case 'ArrowDown':
                        e.preventDefault();
                        const menuId = item.dataset?.menu;
                        if (menuId) {
                            openMegaMenu(menuId);
                            // Focus first link in menu
                            const menu = megaMenus[menuId];
                            if (menu) {
                                const firstLink = menu.querySelector('a');
                                if (firstLink) firstLink.focus();
                            }
                        }
                        break;

                    case 'Enter':
                    case ' ':
                        if (item.classList.contains('mega-nav-item')) {
                            e.preventDefault();
                            const menuIdEnter = item.dataset?.menu;
                            if (menuIdEnter) {
                                if (activeMenu === menuIdEnter) {
                                    closeMegaMenu();
                                } else {
                                    openMegaMenu(menuIdEnter);
                                }
                            }
                        }
                        break;
                }
            });
        });

        // Arrow navigation within mega menu
        Object.entries(megaMenus).forEach(([menuId, menu]) => {
            if (!menu) return;

            const links = menu.querySelectorAll('a, button');

            links.forEach((link, index) => {
                link.addEventListener('keydown', (e) => {
                    switch (e.key) {
                        case 'ArrowDown':
                            e.preventDefault();
                            if (links[index + 1]) links[index + 1].focus();
                            break;

                        case 'ArrowUp':
                            e.preventDefault();
                            if (links[index - 1]) {
                                links[index - 1].focus();
                            } else {
                                // Return to trigger
                                const trigger = document.querySelector(`[data-menu="${menuId}"] .mega-nav-trigger`);
                                if (trigger) trigger.focus();
                            }
                            break;

                        case 'Escape':
                            closeMegaMenu();
                            const trigger = document.querySelector(`[data-menu="${menuId}"] .mega-nav-trigger`);
                            if (trigger) trigger.focus();
                            break;

                        case 'Tab':
                            // If shift+tab on first link, close menu
                            if (e.shiftKey && index === 0) {
                                closeMegaMenu();
                            }
                            // If tab on last link, close menu
                            if (!e.shiftKey && index === links.length - 1) {
                                closeMegaMenu();
                            }
                            break;
                    }
                });
            });
        });
    }

    // ============================================
    // DYNAMIC SPOTLIGHT DATA
    // ============================================

    const SESSION_CACHE_PATH = '/data/sessions/all-sessions.json';

    /**
     * Maps program names to URL slugs
     */
    const PROGRAM_SLUG_MAP = {
        'Certificate in Employee Relations Law': 'employee-relations-law',
        'Certificate in Strategic HR Leadership': 'strategic-hr-leadership',
        'Certificate in Employee Benefits Law': 'employee-benefits-law',
        'Certificate in Workplace Investigations': 'workplace-investigations',
        'Advanced Certificate in Strategic Employment Law': 'advanced-employment-law',
        'Advanced Certificate in Employee Benefits Law': 'advanced-employee-benefits-law'
    };

    /**
     * Converts a program name to its URL slug
     * @param {string} name - Program name
     * @returns {string} URL slug
     */
    function programNameToSlug(name) {
        return PROGRAM_SLUG_MAP[name] || 'employee-relations-law';
    }

    /**
     * Builds a registration URL from program fields
     * @param {Object} fields - Airtable record fields
     * @returns {string} Registration URL
     */
    function buildProgramUrl(fields) {
        const programName = Array.isArray(fields['Program Name'])
            ? fields['Program Name'][0]
            : fields['Program Name'];
        const slug = programNameToSlug(programName);
        return `/programs/${slug}`;
    }

    /**
     * Formats duration for display (e.g., 4.5 -> "4½ days")
     * @param {number} days - Duration in days
     * @returns {string} Formatted duration
     */
    function formatDuration(days) {
        if (!days) return '';
        if (days === Math.floor(days)) {
            return `${days} days`;
        }
        const whole = Math.floor(days);
        const fraction = days - whole;
        if (fraction === 0.5) {
            return whole === 0 ? '½ day' : `${whole}½ days`;
        }
        return `${days} days`;
    }

    /**
     * Fetches the next upcoming program from the session cache
     * @returns {Promise<Object|null>} Program data or null
     */
    async function fetchNextProgram() {
        try {
            const response = await fetch(SESSION_CACHE_PATH);
            if (!response.ok) {
                throw new Error('Session cache unavailable');
            }

            const data = await response.json();
            const today = new Date().toISOString().split('T')[0];

            // Filter for future, visible CERTIFICATE programs (prefer in-person)
            const futurePrograms = data.records.filter(r => {
                const f = r.fields;
                const programName = Array.isArray(f['Program Name']) ? f['Program Name'][0] : f['Program Name'];
                return f['Show on Website']
                    && f['Start Date']
                    && f['Start Date'] >= today
                    && f['Format'] !== 'On Demand'
                    && programName && programName.startsWith('Certificate');
            });

            // Sort by date
            futurePrograms.sort((a, b) =>
                a.fields['Start Date'].localeCompare(b.fields['Start Date'])
            );

            // Prioritize in-person over virtual
            const inPerson = futurePrograms.filter(r => r.fields['Format'] === 'In-Person');
            const nextProgram = inPerson.length > 0 ? inPerson[0] : futurePrograms[0];

            if (!nextProgram) return null;

            const f = nextProgram.fields;
            const programName = Array.isArray(f['Program Name']) ? f['Program Name'][0] : f['Program Name'];
            const duration = Array.isArray(f['Duration (Days)']) ? f['Duration (Days)'][0] : f['Duration (Days)'];
            const price = Array.isArray(f['Price In-Person (from PROGRAMS)'])
                ? f['Price In-Person (from PROGRAMS)'][0]
                : f['Price In-Person (from PROGRAMS)'];

            // Build full location with city and state
            const city = f['City'] || '';
            const state = f['State/Province'] || '';
            const fullLocation = city && state
                ? `${city}, ${state}`
                : (city || 'Virtual');

            return {
                name: programName,
                startDate: f['Start Date'],
                endDate: f['End Date'],
                location: fullLocation,
                format: f['Format'],
                image: f['Hero Image URL'] || 'https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/695de01eb75f6ff8ea6a1242.svg',
                duration: formatDuration(duration),
                price: price,
                programUrl: buildProgramUrl(f)
            };

        } catch (error) {
            console.warn('Could not fetch next program for spotlight:', error);
            return null;
        }
    }

    /**
     * Updates the spotlight panel with program data
     * @param {Object} program - Program data object
     */
    function updateSpotlight(program) {
        if (!program) return;

        const spotlight = document.getElementById('programs-spotlight');
        if (!spotlight) return;

        const image = spotlight.querySelector('.spotlight-image img');
        const title = spotlight.querySelector('.spotlight-title');
        const location = spotlight.querySelector('.spotlight-location');
        const date = spotlight.querySelector('.spotlight-date');
        const details = spotlight.querySelector('.spotlight-details');
        const cta = spotlight.querySelector('.spotlight-cta');
        const formatBadge = document.getElementById('spotlight-format');

        if (image && program.image) {
            const fallbackImage = 'https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/695de01eb75f6ff8ea6a1242.svg';
            image.onerror = () => {
                image.src = fallbackImage;
            };
            image.src = program.image;
            image.alt = program.name || 'Program';
        }
        if (title && program.name) {
            title.textContent = program.name;
        }
        if (location && program.location) {
            location.textContent = program.location;
        }
        if (date && program.startDate) {
            date.textContent = formatDateRange(program.startDate, program.endDate);
        }
        if (details) {
            const duration = program.duration || '';
            const price = program.price ? `$${program.price.toLocaleString()}` : '';
            details.textContent = [duration, price].filter(Boolean).join(' · ');
        }
        if (cta && program.programUrl) {
            cta.href = program.programUrl;
        }
        if (formatBadge && program.format) {
            formatBadge.textContent = program.format;
        }
    }

    /**
     * Formats a date string for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Formats a date range for display
     * @param {string} startDate - ISO date string
     * @param {string} endDate - ISO date string (optional)
     * @returns {string} Formatted date range
     */
    function formatDateRange(startDate, endDate) {
        // Parse at noon to avoid timezone issues with date-only strings
        const start = new Date(startDate + 'T12:00:00');
        const end = endDate ? new Date(endDate + 'T12:00:00') : null;

        const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
        const startDay = start.getDate();
        const startYear = start.getFullYear();

        if (!end || startDate === endDate) {
            return `${startMonth} ${startDay}, ${startYear}`;
        }

        const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
        const endDay = end.getDate();
        const endYear = end.getFullYear();

        // Same month and year: "Apr 20-21, 2026"
        if (startMonth === endMonth && startYear === endYear) {
            return `${startMonth} ${startDay}-${endDay}, ${startYear}`;
        }

        // Same year, different month: "Apr 28 - May 2, 2026"
        if (startYear === endYear) {
            return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
        }

        // Different years: "Dec 28, 2026 - Jan 2, 2027"
        return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
    }

    /**
     * Initializes dynamic spotlight content
     */
    async function initSpotlight() {
        const program = await fetchNextProgram();
        if (program) {
            updateSpotlight(program);
        }
    }

    // ============================================
    // ELU BANNER FUNCTIONALITY
    // ============================================

    /**
     * Fetches the next upcoming Employment Law Update session
     * @returns {Promise<Object|null>} ELU session data or null
     */
    async function fetchNextELU() {
        try {
            const response = await fetch(SESSION_CACHE_PATH);
            if (!response.ok) {
                throw new Error('Session cache unavailable');
            }

            const data = await response.json();
            const today = new Date().toISOString().split('T')[0];

            // Filter for future ELU sessions that are visible
            const eluSessions = data.records.filter(r => {
                const f = r.fields;
                const programName = Array.isArray(f['Program Name'])
                    ? f['Program Name'][0]
                    : f['Program Name'];
                return f['Show on Website']
                    && f['Start Date']
                    && f['Start Date'] >= today
                    && programName === 'Employment Law Update';
            });

            // Sort by date to get the next upcoming
            eluSessions.sort((a, b) =>
                a.fields['Start Date'].localeCompare(b.fields['Start Date'])
            );

            const nextELU = eluSessions[0];
            if (!nextELU) return null;

            const f = nextELU.fields;
            const price = Array.isArray(f['Price Virtual (from PROGRAMS)'])
                ? f['Price Virtual (from PROGRAMS)'][0]
                : (f['Price Virtual (from PROGRAMS)'] || 397);

            return {
                startDate: f['Start Date'],
                format: f['Format'] || 'Virtual',
                price: price,
                registrationUrl: '/program-schedule?program=employment-law-update'
            };

        } catch (error) {
            console.warn('Could not fetch next ELU session:', error);
            return null;
        }
    }

    /**
     * Updates the horizontal ELU banner with session data
     * @param {Object|null} elu - ELU session data
     */
    function updateELUHorizontalBanner(elu) {
        const banner = document.getElementById('elu-banner');
        const dateEl = document.getElementById('elu-banner-date');

        if (!banner) return;

        if (!elu) {
            // No upcoming ELU - hide the banner
            banner.style.display = 'none';
            return;
        }

        // Update date display with "Next:" prefix
        if (dateEl && elu.startDate) {
            const date = new Date(elu.startDate + 'T12:00:00');
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            dateEl.textContent = `Next: ${formattedDate}`;
        }

        // Ensure banner is visible
        banner.style.display = 'flex';
    }

    /**
     * Updates the ELU promo box with the next session date
     * @param {Object|null} elu - ELU session data
     */
    function updateELUPromoBox(elu) {
        const dateEl = document.getElementById('elu-promo-date');
        if (!dateEl) return;

        if (!elu || !elu.startDate) {
            dateEl.textContent = '';
            return;
        }

        const date = new Date(elu.startDate + 'T12:00:00');
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        dateEl.textContent = `Next: ${formattedDate}`;
    }

    /**
     * Initializes the horizontal ELU banner content
     */
    async function initELUHorizontalBanner() {
        const elu = await fetchNextELU();
        updateELUHorizontalBanner(elu);
        updateELUPromoBox(elu);
    }

    // ============================================
    // HEADER SCROLL BEHAVIOR
    // ============================================

    /**
     * Initializes header scroll behavior (same as original header.html)
     */
    function initHeaderScroll() {
        const header = document.getElementById('header');
        if (!header) return;

        let lastScrollTop = 0;
        let scrollDirection = 'none';
        let ticking = false;
        let scrollDeltaAccumulator = 0;

        const GLASS_EFFECT_THRESHOLD = 50;
        const HIDE_THRESHOLD = 70;
        const SCROLL_DELTA_MIN = 1;
        const DIRECTION_CHANGE_THRESHOLD = 5;

        function updateHeader(scrollTop) {
            const scrollDelta = scrollTop - lastScrollTop;

            if (Math.abs(scrollDelta) < SCROLL_DELTA_MIN) {
                ticking = false;
                return;
            }

            scrollDeltaAccumulator += scrollDelta;

            let newDirection = scrollDirection;

            if (scrollDeltaAccumulator > DIRECTION_CHANGE_THRESHOLD) {
                newDirection = 'down';
                scrollDeltaAccumulator = 0;
            } else if (scrollDeltaAccumulator < -DIRECTION_CHANGE_THRESHOLD) {
                newDirection = 'up';
                scrollDeltaAccumulator = 0;
            }

            // Don't hide header when mega menu is open
            if (activeMenu) {
                header.classList.remove('hidden');
                header.classList.add('scrolled');
            } else {
                if (scrollTop <= GLASS_EFFECT_THRESHOLD) {
                    header.classList.remove('hidden');
                    header.classList.remove('scrolled');
                } else if (newDirection === 'down' && scrollTop > HIDE_THRESHOLD) {
                    header.classList.add('hidden');
                    header.classList.add('scrolled');
                } else if (newDirection === 'up' && scrollTop > GLASS_EFFECT_THRESHOLD) {
                    header.classList.remove('hidden');
                    header.classList.add('scrolled');
                } else if (scrollTop > GLASS_EFFECT_THRESHOLD && scrollTop <= HIDE_THRESHOLD) {
                    header.classList.remove('hidden');
                    header.classList.add('scrolled');
                }
            }

            scrollDirection = newDirection;
            lastScrollTop = scrollTop;
            ticking = false;
        }

        function requestTick() {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateHeader(window.pageYOffset);
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', requestTick, { passive: true });

        // Initial state
        const initialScrollTop = window.pageYOffset;
        if (initialScrollTop > GLASS_EFFECT_THRESHOLD) {
            header.classList.add('scrolled');
        }
    }

    // ============================================
    // MOBILE MENU (from original header)
    // ============================================

    function initMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileBackdrop = document.getElementById('mobileBackdrop');

        if (!hamburger || !mobileMenu || !mobileBackdrop) return;

        function toggleMobileMenu() {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            mobileBackdrop.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        }

        window.closeMobileMenu = function() {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
            mobileBackdrop.classList.remove('active');
            document.body.style.overflow = '';
        };

        hamburger.addEventListener('click', toggleMobileMenu);
        mobileBackdrop.addEventListener('click', closeMobileMenu);

        window.addEventListener('resize', () => {
            if (window.innerWidth > CONFIG.mobileBreakpoint) {
                closeMobileMenu();
            }
        });
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        // Only initialize if mega menu elements exist
        if (!document.querySelector('.mega-nav')) {
            return;
        }

        initDesktopMegaMenu();
        initMobileAccordion();
        initKeyboardNavigation();
        initHeaderScroll();
        initMobileMenu();

        // Initialize spotlight and ELU banner after a short delay (non-blocking)
        setTimeout(() => {
            initSpotlight();
            initELUHorizontalBanner();
        }, 500);

        console.log('IAML Mega Menu initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
