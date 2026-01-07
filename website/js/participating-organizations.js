/**
 * IAML Participating Organizations Directory
 *
 * Features:
 * - Cache-first data loading with API fallback
 * - Virtual scrolling for 1000+ items via Intersection Observer
 * - Instant search with debouncing
 * - Multi-filter support with URL persistence
 * - Alphabet quick-navigation
 * - View toggle (grid/list)
 * - Progressive enhancement (works without JS for basic display)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const PO_CONFIG = {
  CACHE_URL: '/data/organizations/all-organizations.json',
  API_ENDPOINT: '/api/airtable-programs',
  AIRTABLE_TABLE_ID: 'tbl90HikZUp0GEkKZ',
  BATCH_SIZE: 50,           // Items to render per batch
  SEARCH_DEBOUNCE: 200,     // ms to wait before searching
  SCROLL_THRESHOLD: 300,    // px from bottom to trigger load more
  ANIMATION_DELAY: 20       // ms between staggered item animations
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
  allOrganizations: [],
  filteredOrganizations: [],
  displayedCount: 0,
  isLoading: false,
  filters: {
    search: '',
    industry: '',
    size: '',
    region: ''
  },
  viewMode: 'grid',
  industries: [],
  regions: []
};

// ============================================================================
// UTILITY FUNCTIONS (must be declared before use due to const hoisting)
// ============================================================================

const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const poEscapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const highlightSearchTerm = (text, term) => {
  const escaped = poEscapeHtml(text);
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<mark class="po-highlight">$1</mark>');
};

// ============================================================================
// DOM REFERENCES
// ============================================================================

const elements = {};

const initElements = () => {
  elements.grid = document.getElementById('poOrganizationsGrid');
  elements.searchInput = document.getElementById('poSearchInput');
  elements.clearSearch = document.getElementById('poClearSearch');
  elements.industryFilter = document.getElementById('poIndustryFilter');
  elements.sizeFilter = document.getElementById('poSizeFilter');
  elements.regionFilter = document.getElementById('poRegionFilter');
  elements.resultsCount = document.getElementById('poResultsCount');
  elements.activeFilters = document.getElementById('poActiveFilters');
  elements.alphaNav = document.getElementById('poAlphaNav');
  elements.loadMoreSentinel = document.getElementById('poLoadMoreSentinel');
  elements.noResults = document.getElementById('poNoResults');
  elements.viewBtns = document.querySelectorAll('.po-view-btn');
  elements.clearAllFilters = document.getElementById('poClearAllFilters');
};

// ============================================================================
// DATA LOADING (Cache-First Pattern)
// ============================================================================

const loadOrganizations = async () => {
  state.isLoading = true;
  showLoadingState();

  try {
    // Try cache first
    const cacheData = await fetchFromCache();
    if (cacheData && cacheData.organizations && cacheData.organizations.length > 0) {
      processOrganizationsData(cacheData);
      return;
    }

    // Fallback to API
    const apiData = await fetchFromAPI();
    if (apiData) {
      processOrganizationsData(apiData);
    } else {
      showErrorState();
    }

  } catch (error) {
    console.error('Failed to load organizations:', error);
    showErrorState();
  } finally {
    state.isLoading = false;
  }
};

const fetchFromCache = async () => {
  try {
    const response = await fetch(PO_CONFIG.CACHE_URL);
    if (!response.ok) return null;
    const data = await response.json();
    console.log(`Organizations loaded from cache, generated: ${data.generated}`);
    return data;
  } catch (error) {
    console.warn('Cache unavailable:', error.message);
    return null;
  }
};

const fetchFromAPI = async () => {
  try {
    const apiBase = window.API_BASE || '';
    const url = `${apiBase}${PO_CONFIG.API_ENDPOINT}?table=${PO_CONFIG.AIRTABLE_TABLE_ID}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('API fetch failed');

    const data = await response.json();

    // Transform Airtable records to our schema
    return {
      organizations: data.records.map(record => ({
        id: record.id,
        name: record.fields['Company Name'] || '',
        industry: record.fields['Industry'] || 'Other',
        size: mapSizeToTier(record.fields['Employee Count']),
        region: record.fields['Region'] || '',
        sortKey: normalizeForSort(record.fields['Company Name'] || '')
      }))
    };
  } catch (error) {
    console.error('API fetch failed:', error);
    return null;
  }
};

// ============================================================================
// DATA PROCESSING
// ============================================================================

const processOrganizationsData = (data) => {
  // Store all organizations sorted alphabetically
  state.allOrganizations = data.organizations.sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey)
  );

  // Extract unique industries and regions for filters
  state.industries = data.industries || extractUnique(state.allOrganizations, 'industry');
  state.regions = data.regions || extractUnique(state.allOrganizations, 'region');

  // Populate filter dropdowns
  populateFilterDropdowns();

  // Build alphabet navigation
  buildAlphabetNav();

  // Read URL params for initial filters
  readFiltersFromURL();

  // Apply initial filtering
  applyFilters();
};

const normalizeForSort = (name) => {
  return name
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
};

const mapSizeToTier = (employeeCount) => {
  if (!employeeCount) return '';
  const count = parseInt(employeeCount, 10);
  if (isNaN(count)) return '';
  if (count >= 10000) return 'enterprise';
  if (count >= 1000) return 'large';
  if (count >= 100) return 'mid';
  return 'small';
};

const extractUnique = (arr, key) => {
  return [...new Set(arr.map(item => item[key]).filter(Boolean))].sort();
};

// ============================================================================
// FILTER DROPDOWNS
// ============================================================================

const populateFilterDropdowns = () => {
  // Populate industry dropdown
  if (elements.industryFilter) {
    state.industries.forEach(industry => {
      const count = state.allOrganizations.filter(o => o.industry === industry).length;
      const option = document.createElement('option');
      option.value = industry;
      option.textContent = `${industry} (${count})`;
      elements.industryFilter.appendChild(option);
    });
  }

  // Populate region dropdown
  if (elements.regionFilter) {
    state.regions.forEach(region => {
      const count = state.allOrganizations.filter(o => o.region === region).length;
      const option = document.createElement('option');
      option.value = region;
      option.textContent = `${region} (${count})`;
      elements.regionFilter.appendChild(option);
    });
  }
};

// ============================================================================
// FILTERING & SEARCH
// ============================================================================

const applyFilters = () => {
  const { search, industry, size, region } = state.filters;

  state.filteredOrganizations = state.allOrganizations.filter(org => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      if (!org.name.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Industry filter
    if (industry && org.industry !== industry) return false;

    // Size filter
    if (size && org.size !== size) return false;

    // Region filter
    if (region && org.region !== region) return false;

    return true;
  });

  // Reset display
  state.displayedCount = 0;
  elements.grid.innerHTML = '';

  // Update UI
  updateResultsCount();
  updateActiveFiltersDisplay();
  updateAlphabetNavState();
  syncFiltersToURL();

  // Render initial batch
  if (state.filteredOrganizations.length > 0) {
    hideNoResults();
    renderNextBatch();
  } else {
    showNoResults();
  }
};

const handleSearch = debounce((searchTerm) => {
  state.filters.search = searchTerm;
  elements.clearSearch.style.display = searchTerm ? 'flex' : 'none';
  applyFilters();
}, PO_CONFIG.SEARCH_DEBOUNCE);

// ============================================================================
// RENDERING (Virtual Scrolling via Intersection Observer)
// ============================================================================

const renderNextBatch = () => {
  const startIndex = state.displayedCount;
  const endIndex = Math.min(
    startIndex + PO_CONFIG.BATCH_SIZE,
    state.filteredOrganizations.length
  );

  const fragment = document.createDocumentFragment();

  for (let i = startIndex; i < endIndex; i++) {
    const org = state.filteredOrganizations[i];
    const card = createOrganizationCard(org, i - startIndex);
    fragment.appendChild(card);
  }

  elements.grid.appendChild(fragment);
  state.displayedCount = endIndex;

  // Update load more visibility
  updateLoadMoreVisibility();
};

// SVG icons for badges
const BADGE_ICONS = {
  industry: `<svg class="po-org-badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
  </svg>`,
  region: `<svg class="po-org-badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
  </svg>`
};

const createOrganizationCard = (org, animationIndex) => {
  const card = document.createElement('div');
  const industrySlug = org.industry ? org.industry.toLowerCase().replace(/\s+/g, '-') : 'other';
  card.className = `po-org-card po-org-card--${state.viewMode}`;
  card.setAttribute('data-industry', industrySlug);

  // Get first letter for alphabet nav
  const firstChar = org.sortKey.charAt(0).toUpperCase();
  const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
  card.setAttribute('data-letter', letter);

  card.style.animationDelay = `${animationIndex * PO_CONFIG.ANIMATION_DELAY}ms`;

  // Highlight search term if present
  const displayName = state.filters.search
    ? highlightSearchTerm(org.name, state.filters.search)
    : poEscapeHtml(org.name);

  // Build badges with icons
  const industryBadge = org.industry
    ? `<span class="po-org-badge">${BADGE_ICONS.industry}${poEscapeHtml(org.industry)}</span>`
    : '';
  const regionBadge = org.region
    ? `<span class="po-org-badge">${BADGE_ICONS.region}${poEscapeHtml(org.region)}</span>`
    : '';

  card.innerHTML = `
    <div class="po-org-card-inner">
      <h3 class="po-org-name">${displayName}</h3>
      ${(industryBadge || regionBadge) ? `<div class="po-org-meta">${industryBadge}${regionBadge}</div>` : ''}
    </div>
  `;

  return card;
};

// ============================================================================
// INTERSECTION OBSERVER (Infinite Scroll)
// ============================================================================

const setupInfiniteScroll = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !state.isLoading) {
        if (state.displayedCount < state.filteredOrganizations.length) {
          showLoadingMore();
          renderNextBatch();
          hideLoadingMore();
        }
      }
    });
  }, {
    rootMargin: `${PO_CONFIG.SCROLL_THRESHOLD}px`
  });

  if (elements.loadMoreSentinel) {
    observer.observe(elements.loadMoreSentinel);
  }
};

// ============================================================================
// ALPHABET NAVIGATION
// ============================================================================

const buildAlphabetNav = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

  if (!elements.alphaNav) return;

  elements.alphaNav.innerHTML = letters.map(letter => `
    <button
      class="po-alpha-btn"
      data-letter="${letter}"
      aria-label="Jump to ${letter === '#' ? 'numbers' : letter}"
    >
      ${letter}
    </button>
  `).join('');

  // Add click handlers
  elements.alphaNav.querySelectorAll('.po-alpha-btn').forEach(btn => {
    btn.addEventListener('click', () => jumpToLetter(btn.dataset.letter));
  });
};

const updateAlphabetNavState = () => {
  if (!elements.alphaNav) return;

  // Get letters that have organizations
  const availableLetters = new Set();
  state.filteredOrganizations.forEach(org => {
    const firstChar = org.sortKey.charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
    availableLetters.add(letter);
  });

  // Update button states
  elements.alphaNav.querySelectorAll('.po-alpha-btn').forEach(btn => {
    const letter = btn.dataset.letter;
    btn.disabled = !availableLetters.has(letter);
  });
};

const jumpToLetter = (letter) => {
  // Find the first organization with this letter in the data
  const targetIndex = state.filteredOrganizations.findIndex(org => {
    const firstChar = org.sortKey.charAt(0).toUpperCase();
    const orgLetter = /[A-Z]/.test(firstChar) ? firstChar : '#';
    return orgLetter === letter;
  });

  // No organizations with this letter
  if (targetIndex === -1) return;

  // Ensure enough cards are rendered to include the target
  while (state.displayedCount <= targetIndex) {
    renderNextBatch();
  }

  // Now find and scroll to the card
  const selector = letter === '#'
    ? '[data-letter="#"]'
    : `[data-letter="${letter}"]`;

  const targetCard = elements.grid.querySelector(selector);

  if (targetCard) {
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update active letter
    elements.alphaNav.querySelectorAll('.po-alpha-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.letter === letter);
    });

    // Remove active class after scroll
    setTimeout(() => {
      elements.alphaNav.querySelectorAll('.po-alpha-btn').forEach(btn => {
        btn.classList.remove('active');
      });
    }, 1500);
  }
};

// ============================================================================
// URL PERSISTENCE
// ============================================================================

const syncFiltersToURL = () => {
  const params = new URLSearchParams();

  if (state.filters.search) params.set('q', state.filters.search);
  if (state.filters.industry) params.set('industry', state.filters.industry);
  if (state.filters.size) params.set('size', state.filters.size);
  if (state.filters.region) params.set('region', state.filters.region);

  const newURL = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, '', newURL);
};

const readFiltersFromURL = () => {
  const params = new URLSearchParams(window.location.search);

  state.filters.search = params.get('q') || '';
  state.filters.industry = params.get('industry') || '';
  state.filters.size = params.get('size') || '';
  state.filters.region = params.get('region') || '';

  // Update UI to match
  if (elements.searchInput) elements.searchInput.value = state.filters.search;
  if (elements.industryFilter) elements.industryFilter.value = state.filters.industry;
  if (elements.sizeFilter) elements.sizeFilter.value = state.filters.size;
  if (elements.regionFilter) elements.regionFilter.value = state.filters.region;

  // Show clear button if search has value
  if (elements.clearSearch && state.filters.search) {
    elements.clearSearch.style.display = 'flex';
  }
};

// ============================================================================
// ACTIVE FILTERS DISPLAY
// ============================================================================

const updateActiveFiltersDisplay = () => {
  if (!elements.activeFilters) return;

  const pills = [];

  if (state.filters.search) {
    pills.push(createFilterPill('Search', state.filters.search, 'search'));
  }
  if (state.filters.industry) {
    pills.push(createFilterPill('Industry', state.filters.industry, 'industry'));
  }
  if (state.filters.size) {
    const sizeLabels = {
      'enterprise': 'Enterprise (10,000+)',
      'large': 'Large (1,000-9,999)',
      'mid': 'Mid-Market (100-999)',
      'small': 'Small (1-99)'
    };
    pills.push(createFilterPill('Size', sizeLabels[state.filters.size] || state.filters.size, 'size'));
  }
  if (state.filters.region) {
    pills.push(createFilterPill('Region', state.filters.region, 'region'));
  }

  if (pills.length > 0) {
    elements.activeFilters.innerHTML = pills.join('');
    elements.activeFilters.style.display = 'flex';

    // Add click handlers to remove buttons
    elements.activeFilters.querySelectorAll('.po-filter-pill-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const filterType = btn.dataset.filter;
        clearFilter(filterType);
      });
    });
  } else {
    elements.activeFilters.style.display = 'none';
  }
};

const createFilterPill = (label, value, filterType) => {
  return `
    <span class="po-filter-pill">
      ${poEscapeHtml(label)}: ${poEscapeHtml(value)}
      <button class="po-filter-pill-remove" data-filter="${filterType}" aria-label="Remove ${label} filter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </span>
  `;
};

const clearFilter = (filterType) => {
  state.filters[filterType] = '';

  // Update corresponding input
  switch (filterType) {
    case 'search':
      elements.searchInput.value = '';
      elements.clearSearch.style.display = 'none';
      break;
    case 'industry':
      elements.industryFilter.value = '';
      break;
    case 'size':
      elements.sizeFilter.value = '';
      break;
    case 'region':
      elements.regionFilter.value = '';
      break;
  }

  applyFilters();
};

const clearAllFilters = () => {
  state.filters = { search: '', industry: '', size: '', region: '' };
  elements.searchInput.value = '';
  elements.industryFilter.value = '';
  elements.sizeFilter.value = '';
  elements.regionFilter.value = '';
  elements.clearSearch.style.display = 'none';
  applyFilters();
};

// ============================================================================
// UI UPDATES
// ============================================================================

const updateResultsCount = () => {
  if (elements.resultsCount) {
    const count = state.filteredOrganizations.length;
    const total = state.allOrganizations.length;

    if (count === total) {
      elements.resultsCount.textContent = `Showing ${count.toLocaleString()} organizations`;
    } else {
      elements.resultsCount.textContent = `Showing ${count.toLocaleString()} of ${total.toLocaleString()} organizations`;
    }
  }
};

const updateLoadMoreVisibility = () => {
  const loadingMore = elements.loadMoreSentinel?.querySelector('.po-loading-more');
  if (loadingMore) {
    loadingMore.style.display = state.displayedCount < state.filteredOrganizations.length ? 'flex' : 'none';
  }
};

const showLoadingState = () => {
  if (elements.grid) {
    elements.grid.innerHTML = `
      <div class="po-loading-state">
        <div class="po-loading-spinner"></div>
        <p>Loading organizations...</p>
      </div>
    `;
  }
};

const showErrorState = () => {
  if (elements.grid) {
    elements.grid.innerHTML = `
      <div class="po-loading-state">
        <p>Unable to load organizations. Please try again later.</p>
      </div>
    `;
  }
};

const showNoResults = () => {
  if (elements.noResults) {
    elements.noResults.style.display = 'block';
  }
};

const hideNoResults = () => {
  if (elements.noResults) {
    elements.noResults.style.display = 'none';
  }
};

const showLoadingMore = () => {
  const loadingMore = elements.loadMoreSentinel?.querySelector('.po-loading-more');
  if (loadingMore) {
    loadingMore.style.display = 'flex';
  }
};

const hideLoadingMore = () => {
  const loadingMore = elements.loadMoreSentinel?.querySelector('.po-loading-more');
  if (loadingMore) {
    loadingMore.style.display = 'none';
  }
};

// ============================================================================
// EVENT LISTENERS
// ============================================================================

const setupEventListeners = () => {
  // Search
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
  }

  if (elements.clearSearch) {
    elements.clearSearch.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.filters.search = '';
      elements.clearSearch.style.display = 'none';
      applyFilters();
    });
  }

  // Filters
  if (elements.industryFilter) {
    elements.industryFilter.addEventListener('change', (e) => {
      state.filters.industry = e.target.value;
      applyFilters();
    });
  }

  if (elements.sizeFilter) {
    elements.sizeFilter.addEventListener('change', (e) => {
      state.filters.size = e.target.value;
      applyFilters();
    });
  }

  if (elements.regionFilter) {
    elements.regionFilter.addEventListener('change', (e) => {
      state.filters.region = e.target.value;
      applyFilters();
    });
  }

  // View toggle
  elements.viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.viewMode = btn.dataset.view;
      elements.viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update grid class
      elements.grid.className = `po-organizations-grid ${state.viewMode === 'list' ? 'po-organizations-grid--list' : ''}`;

      // Update existing cards
      elements.grid.querySelectorAll('.po-org-card').forEach(card => {
        card.className = `po-org-card po-org-card--${state.viewMode}`;
        // Preserve data attributes
        const industry = card.getAttribute('data-industry');
        const letter = card.getAttribute('data-letter');
        if (industry) card.setAttribute('data-industry', industry);
        if (letter) card.setAttribute('data-letter', letter);
      });
    });
  });

  // Clear all filters
  if (elements.clearAllFilters) {
    elements.clearAllFilters.addEventListener('click', clearAllFilters);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Focus search on '/' key
    if (e.key === '/' && document.activeElement !== elements.searchInput) {
      e.preventDefault();
      elements.searchInput?.focus();
    }

    // Clear search on Escape
    if (e.key === 'Escape' && document.activeElement === elements.searchInput) {
      elements.searchInput.blur();
      if (state.filters.search) {
        clearFilter('search');
      }
    }
  });
};

// ============================================================================
// INITIALIZATION
// ============================================================================

const init = () => {
  initElements();
  setupEventListeners();
  setupInfiniteScroll();
  loadOrganizations();
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
