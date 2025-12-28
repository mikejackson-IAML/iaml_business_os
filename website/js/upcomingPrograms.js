/**
 * Upcoming Programs Section for Homepage
 * Loads 3 upcoming programs from session cache with block/session tables
 */

const UpcomingPrograms = (() => {
  // Configuration
  const SESSION_CACHE_PATH = '/data/sessions/all-sessions.json';
  const DISPLAY_COUNT = 3;

  // Full certificate programs (what we display)
  const ALLOWED_PROGRAMS = [
    'Certificate in Employee Relations Law',
    'Advanced Certificate in Strategic Employment Law',
    'Certificate in Strategic HR Leadership',
    'Certificate in Workplace Investigations',
    'Certificate in Employee Benefits Law',
    'Advanced Certificate in Employee Benefits Law'
  ];

  // Virtual component programs (used to build virtual certificate pairs)
  const VIRTUAL_COMPONENT_PROGRAMS = [
    'Comprehensive Labor Relations',
    'Discrimination Prevention & Defense',
    'HR Law Fundamentals',
    'Strategic HR Management'
  ];

  // Virtual certificate definitions - maps certificate name to its component sessions
  const VIRTUAL_CERTIFICATE_DEFS = {
    'Certificate in Employee Relations Law': {
      components: ['Comprehensive Labor Relations', 'Discrimination Prevention & Defense'],
      slug: 'employee-relations-law',
      description: 'Earn your Certificate in Employee Relations Law through two virtual sessions.',
      image: 'https://storage.googleapis.com/iaml-images-public/programs/employee-relations-law-hero.jpg'
    },
    'Certificate in Strategic HR Leadership': {
      components: ['HR Law Fundamentals', 'Strategic HR Management'],
      slug: 'strategic-hr',
      description: 'Earn your Certificate in Strategic HR Leadership through two virtual sessions.',
      image: 'https://storage.googleapis.com/iaml-images-public/programs/strategic-hr-hero.jpg'
    }
  };

  const PROGRAM_SLUG_MAP = {
    'Certificate in Employee Relations Law': 'employee-relations-law',
    'Advanced Certificate in Strategic Employment Law': 'strategic-employment-law',
    'Certificate in Strategic HR Leadership': 'strategic-hr',
    'Certificate in Workplace Investigations': 'workplace-investigations',
    'Certificate in Employee Benefits Law': 'employee-benefits-law',
    'Advanced Certificate in Employee Benefits Law': 'advanced-benefits-law'
  };

  // In-person program block definitions
  const BLOCK_DEFS = {
    'Certificate in Employee Relations Law': [
      { number: 1, title: 'Comprehensive Labor Relations', days: 'Monday - Tuesday' },
      { number: 2, title: 'Discrimination Prevention & Defense', days: 'Wednesday - Thursday' },
      { number: 3, title: 'Special Issues in Employment Law', days: 'Friday' }
    ],
    'Certificate in Strategic HR Leadership': [
      { number: 1, title: 'HR Law Fundamentals', days: 'Monday - Tuesday' },
      { number: 2, title: 'Strategic HR Management', days: 'Wednesday - Friday' }
    ],
    'Certificate in Employee Benefits Law': [
      { number: 1, title: 'Welfare Benefits Plan Issues', days: 'Monday - Tuesday' },
      { number: 2, title: 'Benefit Plan Claims, Appeals & Litigation', days: 'Wednesday' },
      { number: 3, title: 'Retirement Plans', days: 'Thursday - Friday' }
    ]
  };

  const VIRTUAL_IMAGES = {
    'Certificate in Employee Relations Law': [
      'https://i.imgur.com/sSzeD5U.jpg',
      'https://i.imgur.com/kGiKVzl.jpg',
      'https://i.imgur.com/r81GZTG.jpg'
    ],
    'Certificate in Strategic HR Leadership': [
      'https://i.imgur.com/CY3t9Ye.jpg',
      'https://i.imgur.com/Mb3eS71.jpg',
      'https://i.imgur.com/Vv4iODE.jpg'
    ]
  };

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop';

  let imageUsageIndex = {};

  // Initialize
  async function init() {
    const container = document.getElementById('upcoming-programs-list');
    if (!container) return;

    try {
      const programs = await loadAndSelectPrograms();
      if (programs.length === 0) {
        hideSection();
        return;
      }
      renderPrograms(container, programs);
    } catch (error) {
      console.error('Error loading upcoming programs:', error);
      hideSection();
    }
  }

  // Load data and select first 3 programs by date
  async function loadAndSelectPrograms() {
    const response = await fetch(SESSION_CACHE_PATH);
    if (!response.ok) throw new Error('Failed to load sessions');

    const data = await response.json();
    const records = data.records || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Transform all records
    const allTransformed = records.map(transformRecord);

    // Get regular certificate programs (in-person and non-component virtual)
    const regularPrograms = allTransformed
      .filter(p => {
        if (!ALLOWED_PROGRAMS.includes(p.title)) return false;
        if (!p.rawStartDate) return false;
        if (new Date(p.rawStartDate) < today) return false;
        if (p.format === 'on-demand') return false;
        return true;
      });

    // Get virtual component sessions for building virtual certificate pairs
    const virtualComponents = allTransformed
      .filter(p => {
        if (!VIRTUAL_COMPONENT_PROGRAMS.includes(p.title)) return false;
        if (p.format !== 'virtual') return false;
        if (!p.rawStartDate) return false;
        if (new Date(p.rawStartDate) < today) return false;
        return true;
      });

    // Build virtual certificate pairs
    const virtualCertificates = buildVirtualCertificatePairs(virtualComponents);

    // Combine and sort by start date, then by program order (ALLOWED_PROGRAMS priority)
    const allPrograms = [...regularPrograms, ...virtualCertificates]
      .sort((a, b) => {
        const dateDiff = new Date(a.rawStartDate) - new Date(b.rawStartDate);
        if (dateDiff !== 0) return dateDiff;
        // Secondary sort: prefer programs earlier in ALLOWED_PROGRAMS list
        const aIndex = ALLOWED_PROGRAMS.indexOf(a.title);
        const bIndex = ALLOWED_PROGRAMS.indexOf(b.title);
        return aIndex - bIndex;
      });

    // Take first 3
    return allPrograms.slice(0, DISPLAY_COUNT);
  }

  // Build virtual certificate pairs from component sessions
  function buildVirtualCertificatePairs(virtualComponents) {
    const pairs = [];
    const PAIR_WINDOW_DAYS = 28;

    for (const [certName, def] of Object.entries(VIRTUAL_CERTIFICATE_DEFS)) {
      const [comp1Name, comp2Name] = def.components;

      if (imageUsageIndex[certName] === undefined) imageUsageIndex[certName] = 0;

      const comp1Sessions = virtualComponents
        .filter(p => p.title === comp1Name)
        .sort((a, b) => new Date(a.rawStartDate) - new Date(b.rawStartDate));

      const comp2Sessions = virtualComponents
        .filter(p => p.title === comp2Name)
        .sort((a, b) => new Date(a.rawStartDate) - new Date(b.rawStartDate));

      for (const s1 of comp1Sessions) {
        const s1Start = new Date(s1.rawStartDate);

        for (const s2 of comp2Sessions) {
          const s2Start = new Date(s2.rawStartDate);
          const daysDiff = (s2Start - s1Start) / (1000 * 60 * 60 * 24);

          if (daysDiff >= 0 && daysDiff <= PAIR_WINDOW_DAYS) {
            const images = VIRTUAL_IMAGES[certName] || [];
            const imageIndex = imageUsageIndex[certName] % (images.length || 1);
            const image = images[imageIndex] || DEFAULT_IMAGE;
            imageUsageIndex[certName]++;

            pairs.push({
              id: `virtual-cert-${certName.replace(/\s+/g, '-')}-${s1.rawStartDate}`,
              title: certName,
              slug: def.slug,
              isVirtualCertificate: true,
              format: 'virtual',
              formatDisplay: 'Virtual',
              image: image,
              location: 'Virtual',
              venue: 'Online Live Sessions',
              rawStartDate: s1.rawStartDate,
              rawEndDate: s2.rawEndDate || s2.rawStartDate,
              virtualComponents: [
                {
                  number: 1,
                  title: comp1Name,
                  dates: formatDateRange(s1.rawStartDate, s1.rawEndDate)
                },
                {
                  number: 2,
                  title: comp2Name,
                  dates: formatDateRange(s2.rawStartDate, s2.rawEndDate)
                }
              ]
            });
          }
        }
      }
    }

    return pairs;
  }

  function transformRecord(record) {
    const f = record.fields;
    const rawProgramName = f['Program Name'];
    const programName = Array.isArray(rawProgramName) ? rawProgramName[0] : (rawProgramName || 'Untitled');
    const format = normalizeFormat(f['Format']);

    let image = f['Hero Image URL'];
    if (!image) {
      const images = VIRTUAL_IMAGES[programName] || [];
      if (images.length > 0) {
        const index = (imageUsageIndex[programName] || 0) % images.length;
        image = images[index];
        imageUsageIndex[programName] = (imageUsageIndex[programName] || 0) + 1;
      } else {
        image = DEFAULT_IMAGE;
      }
    }

    let location = 'Virtual';
    if (format === 'in-person' && f['City']) {
      location = f['State/Province'] ? `${f['City']}, ${f['State/Province']}` : f['City'];
    }

    // Get blocks for in-person programs
    const blocks = BLOCK_DEFS[programName] || [];

    return {
      id: record.id,
      title: programName,
      slug: PROGRAM_SLUG_MAP[programName] || programName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      location: location,
      venue: f['Location'] || (format === 'virtual' ? 'Online Live Sessions' : ''),
      rawStartDate: f['Start Date'],
      rawEndDate: f['End Date'],
      format: format,
      formatDisplay: format === 'virtual' ? 'Virtual' : 'In-Person',
      image: image,
      blocks: blocks,
      isVirtualCertificate: false,
      virtualComponents: null
    };
  }

  function normalizeFormat(format) {
    if (!format) return 'in-person';
    const lower = format.toLowerCase();
    if (lower.includes('virtual')) return 'virtual';
    if (lower.includes('demand')) return 'on-demand';
    return 'in-person';
  }

  function formatDateRange(rawStart, rawEnd) {
    if (!rawStart) return '';
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];

    const start = new Date(rawStart);
    const end = rawEnd ? new Date(rawEnd) : null;

    const startMonth = months[start.getUTCMonth()];
    const startDay = start.getUTCDate();
    const startYear = start.getUTCFullYear();

    if (!end || start.getTime() === end.getTime()) {
      return `${startMonth} ${startDay}, ${startYear}`;
    }

    const endMonth = months[end.getUTCMonth()];
    const endDay = end.getUTCDate();
    const endYear = end.getUTCFullYear();

    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonth} ${startDay}–${endDay}, ${startYear}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;
  }

  function renderBlocksTable(program) {
    // Virtual certificate with component sessions
    if (program.isVirtualCertificate && program.virtualComponents) {
      return `
        <table class="hp-upcoming-blocks-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Topic</th>
              <th>Dates</th>
            </tr>
          </thead>
          <tbody>
            ${program.virtualComponents.map(comp => `
              <tr>
                <td><span class="hp-upcoming-session-num">${comp.number}</span></td>
                <td>${comp.title}</td>
                <td>${comp.dates}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="hp-upcoming-blocks-footnote">*Complete both sessions to earn your certificate</p>
      `;
    }

    // In-person program with blocks
    if (program.blocks && program.blocks.length > 0) {
      return `
        <table class="hp-upcoming-blocks-table">
          <thead>
            <tr>
              <th>Block</th>
              <th>Topic</th>
              <th>Days</th>
            </tr>
          </thead>
          <tbody>
            ${program.blocks.map(block => `
              <tr>
                <td><span class="hp-upcoming-session-num">${block.number}</span></td>
                <td>${block.title}</td>
                <td>${block.days}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="hp-upcoming-blocks-footnote">*Individual blocks available for separate registration</p>
      `;
    }

    return '';
  }

  function renderPrograms(container, programs) {
    container.innerHTML = programs.map(program => `
      <article class="hp-upcoming-card">
        <div class="hp-upcoming-image-col">
          <img src="${program.image}" alt="${program.title}" class="hp-upcoming-hero-image" loading="lazy">
          <div class="hp-upcoming-image-overlay">
            <span class="hp-upcoming-format-badge ${program.format}">${program.formatDisplay}</span>
          </div>
        </div>
        <div class="hp-upcoming-info-col">
          <h3 class="hp-upcoming-program-title">${program.title}</h3>
          <div class="hp-upcoming-dates-location">
            <time datetime="${program.rawStartDate}">${formatDateRange(program.rawStartDate, program.rawEndDate)}</time>
            <span class="hp-upcoming-location">
              ${program.location}${program.venue ? ` - ${program.venue}` : ''}
            </span>
          </div>
          ${renderBlocksTable(program)}
        </div>
        <div class="hp-upcoming-action-col">
          <a href="/programs/${program.slug}" class="hp-upcoming-learn-btn">
            Learn More
          </a>
        </div>
      </article>
    `).join('');
  }

  function hideSection() {
    const section = document.getElementById('upcoming-programs-section');
    if (section) section.style.display = 'none';
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', UpcomingPrograms.init);
