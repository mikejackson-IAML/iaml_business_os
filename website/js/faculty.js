/**
 * IAML Faculty Module
 * Dynamically loads and renders faculty members for program pages
 * Data sourced from cached JSON (preferred) or Airtable API (fallback)
 *
 * Features:
 * - Cache-first loading (weekly cache from GitHub Actions)
 * - Fallback to real-time Airtable API if cache unavailable
 * - Random shuffle on each page load (Fisher-Yates algorithm)
 * - Progressive enhancement (fallback to static HTML if all fetches fail)
 * - Responsive grid layout with line-clamped bios
 */

// Cache configuration
const FACULTY_CACHE_BASE = '/data/faculty/by-program';

/**
 * Fisher-Yates shuffle algorithm
 * Randomizes array in O(n) time with true randomness
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Fetch faculty from cache (preferred method)
 * Returns null if cache is unavailable
 */
const fetchFacultyFromCache = async (programSlug) => {
  try {
    const cacheUrl = `${FACULTY_CACHE_BASE}/${programSlug}.json`;
    const response = await fetch(cacheUrl);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    console.log(`Faculty loaded from cache, generated: ${data.generated}`);
    return data.faculty || [];
  } catch (error) {
    console.log('Faculty cache unavailable:', error.message);
    return null;
  }
};

/**
 * Fetch program record from Airtable by slug
 * First step of two-step API query to get program record ID
 */
const fetchProgramBySlug = async (slug) => {
  const formula = `{Slug}='${slug}'`;
  // Use global API_BASE (set in HTML head) - port 3001 on localhost, relative path in production
  const apiBase = window.API_BASE || '';
  const url = `${apiBase}/api/airtable-programs?table=tbl6jgbX0WW641L84&filterByFormula=${encodeURIComponent(formula)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Program fetch failed: ${response.statusText}`);
    }
    const data = await response.json();

    if (!data.records || data.records.length === 0) {
      console.warn(`Program not found for slug: ${slug}`);
      return null;
    }

    return data.records[0].id;
  } catch (error) {
    console.error('Error fetching program:', error);
    throw error;
  }
};

/**
 * Fetch faculty records linked to a specific program from Airtable
 * Second step of two-step API query using program record ID
 */
const fetchFacultyByProgram = async (programRecordId) => {
  const formula = `SEARCH("${programRecordId}", ARRAYJOIN({Program Record IDs}))`;
  // Use global API_BASE (set in HTML head) - port 3001 on localhost, relative path in production
  const apiBase = window.API_BASE || '';
  const url = `${apiBase}/api/airtable-programs?table=tblVz9VPGhZgE4jBD&filterByFormula=${encodeURIComponent(formula)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Faculty fetch failed: ${response.statusText}`);
    }
    const data = await response.json();

    if (!data.records) {
      console.warn(`No faculty found for program ID: ${programRecordId}`);
      return [];
    }

    // Map Airtable fields to our template format
    return data.records.map(record => ({
      id: record.id,
      name: record.fields['Full Name with Credentials'] || '',
      firstName: record.fields['First Name'] || '',
      title: record.fields['Current Title'] || '',
      organization: record.fields['Current Firm/Organization'] || '',
      bio: record.fields['Short Bio (250-300 characters)'] || '',
      imageUrl: record.fields['Headshot Photo'] || '',
      bioLink: record.fields['Full Bio URL'] || ''
    }));
  } catch (error) {
    console.error('Error fetching faculty:', error);
    throw error;
  }
};

/**
 * Fetch faculty from Airtable API (fallback method)
 */
const fetchFacultyFromAPI = async (programSlug) => {
  console.log('Falling back to Airtable API for faculty...');

  const programId = await fetchProgramBySlug(programSlug);
  if (!programId) {
    return [];
  }

  return await fetchFacultyByProgram(programId);
};

/**
 * Fetch faculty for a program - tries cache first, then API
 */
const fetchFacultyForProgram = async (programSlug) => {
  // Try cache first
  const cachedFaculty = await fetchFacultyFromCache(programSlug);
  if (cachedFaculty !== null && cachedFaculty.length > 0) {
    return cachedFaculty;
  }

  // Fallback to API
  return await fetchFacultyFromAPI(programSlug);
};

/**
 * Generate HTML for a single faculty card
 * Uses template literal for performance and readability
 */
const createFacultyCardHTML = (faculty) => {
  // Combine title and organization with comma if both exist
  const titleLine = [faculty.title, faculty.organization]
    .filter(Boolean)  // Remove empty values
    .join(', ');      // Join with comma and space

  return `
    <article class="faculty-card">
      <div class="faculty-card-inner">
        <div class="faculty-image">
          <img src="${faculty.imageUrl}" alt="${faculty.name}">
        </div>
        <div class="faculty-content">
          <h3 class="faculty-name">${faculty.name}</h3>
          <p class="faculty-title">${titleLine}</p>
          <p class="faculty-bio">${faculty.bio}</p>
          <a href="${faculty.bioLink}" class="faculty-link">Read ${faculty.firstName}'s full bio →</a>
        </div>
      </div>
    </article>
  `;
};

/**
 * Render faculty cards to the DOM
 * Replaces placeholder content with dynamically loaded faculty
 */
const renderFacultyCards = (facultyArray) => {
  const container = document.querySelector('.faculty-grid');

  if (!container) {
    console.warn('Faculty grid container not found');
    return;
  }

  // Shuffle faculty for variety on each page load
  const shuffledFaculty = shuffleArray(facultyArray);

  // Generate HTML for all faculty cards
  const facultyHTML = shuffledFaculty
    .map(faculty => createFacultyCardHTML(faculty))
    .join('');

  // Replace existing content with dynamically loaded faculty
  container.innerHTML = facultyHTML;
};

/**
 * Main initialization function
 * Orchestrates cache-first fetch and render process
 */
const initializeFaculty = async () => {
  const facultySection = document.querySelector('[data-program-slug]');

  // Progressive enhancement: only proceed if data attribute exists
  if (!facultySection) {
    console.warn('Faculty section with data-program-slug not found');
    return;
  }

  const programSlug = facultySection.dataset.programSlug;

  if (!programSlug) {
    console.warn('data-program-slug attribute is empty');
    return;
  }

  try {
    // Fetch faculty (cache-first with API fallback)
    const faculty = await fetchFacultyForProgram(programSlug);

    if (faculty.length === 0) {
      console.warn(`No faculty found for program: ${programSlug}`);
      return; // Fallback to static HTML
    }

    // Render faculty cards
    renderFacultyCards(faculty);

    console.log(`Loaded ${faculty.length} faculty members for ${programSlug}`);
  } catch (error) {
    console.error('Faculty initialization failed:', error);
    console.log('Falling back to static HTML faculty content');
    // Progressive enhancement: let static HTML remain visible on error
  }
};

/**
 * Auto-initialize on DOMContentLoaded
 * Supports both early and late script loading
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFaculty);
} else {
  // DOM already loaded (late script execution)
  initializeFaculty();
}
