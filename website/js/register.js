/**
 * IAML Multi-Step Registration System
 * Handles dynamic step flow with format selection, program selection, session booking,
 * attendance selection (blocks), contact information, payment method choice, and confirmation
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION & CONSTANTS
  // ============================================

  const PROGRAM_DATA = {
    'Certificate in Employee Relations Law': {
      code: 'ER',
      duration: '4.5 days',
      price: 2375,
      blocks: {
        'in-person': {
          list: ['Comprehensive Labor Relations', 'Discrimination Prevention and Defense', 'Special Issues in Employment Law'],
          prices: {
            'Comprehensive Labor Relations': 1375,
            'Discrimination Prevention and Defense': 1375,
            'Special Issues in Employment Law': 575
          }
        },
        'virtual': {
          list: ['Comprehensive Labor Relations', 'Discrimination Prevention and Defense'],
          prices: { 'Comprehensive Labor Relations': 1375, 'Discrimination Prevention and Defense': 1375 }
        }
      }
    },
    'Certificate in Employee Benefits Law': {
      code: 'EB',
      duration: '4.5 days',
      price: 2375,
      blocks: {
        'in-person': {
          list: ['Retirement Plans', 'Benefit Plan Claims, Appeals and Litigation', 'Welfare Benefits Plan Issues'],
          prices: {
            'Retirement Plans': 1375,
            'Benefit Plan Claims, Appeals and Litigation': 575,
            'Welfare Benefits Plan Issues': 975
          }
        }
        // No virtual blocks for this program
      }
    },
    'Certificate in Strategic HR Leadership': {
      code: 'SH',
      duration: '4.5 days',
      price: 2375,
      blocks: {
        'in-person': {
          list: ['HR Law Fundamentals', 'Strategic HR Management'],
          prices: { 'HR Law Fundamentals': 1375, 'Strategic HR Management': 1575 }
        },
        'virtual': {
          list: ['HR Law Fundamentals', 'Strategic HR Management'],
          prices: { 'HR Law Fundamentals': 1375, 'Strategic HR Management': 1575 }
        }
      }
    },
    'Advanced Certificate in Strategic Employment Law': {
      code: 'SE',
      duration: '2 days',
      price: 1575
      // No blocks for any format
    },
    'Certificate in Workplace Investigations': {
      code: 'WI',
      duration: '2 days',
      price: 1575
      // No blocks for any format
    },
    'Advanced Certificate in Employee Benefits Law': {
      code: 'AB',
      duration: '2 days',
      price: 1575
      // No blocks for any format
    }
  };

  // Certificate programs to display (in order)
  const VISIBLE_PROGRAMS = [
    'Certificate in Employee Relations Law',
    'Advanced Certificate in Strategic Employment Law',
    'Certificate in Workplace Investigations',
    'Certificate in Strategic HR Leadership',
    'Certificate in Employee Benefits Law',
    'Advanced Certificate in Employee Benefits Law'
  ];

  // Map URL slugs to full program names for deep linking
  const PROGRAM_SLUG_MAP = {
    'employee-relations-law': 'Certificate in Employee Relations Law',
    'strategic-employment-law': 'Advanced Certificate in Strategic Employment Law',
    'strategic-hr': 'Certificate in Strategic HR Leadership',
    'workplace-investigations': 'Certificate in Workplace Investigations',
    'employee-benefits-law': 'Certificate in Employee Benefits Law',
    'advanced-benefits-law': 'Advanced Certificate in Employee Benefits Law'
  };

  const FORMAT_MAP = {
    'in-person': 'In-Person',
    'virtual': 'Virtual',
    'on-demand': 'On-Demand'
  };

  // Airtable View IDs for session queries (Program Instances table)
  const SESSION_VIEW_IDS = {
    // Certificate programs (full program views)
    'Certificate in Employee Relations Law': {
      'in-person': 'viwfys9oVCU3gFsel'
    },
    'Certificate in Strategic HR Leadership': {
      'in-person': 'viwjSrF7oSzlzYuIc'
    },
    'Advanced Certificate in Strategic Employment Law': {
      'in-person': 'viwqyJc8gx3hOppAu'
    },
    'Certificate in Workplace Investigations': {
      'in-person': 'viw3l8oabLZC5abrq'
    },
    'Certificate in Employee Benefits Law': {
      'in-person': 'viwui1caJxkkGKXiO'
    },
    'Advanced Certificate in Employee Benefits Law': {
      'in-person': 'viwlzVMIk78qDmL2W'
    },

    // Individual block views (for partial attendance)
    'Comprehensive Labor Relations': {
      'in-person': 'viwfRNxWVMk9nUxCc',
      'virtual': 'viwkxehH3VECGQrVU'
    },
    'Discrimination Prevention and Defense': {
      'in-person': 'viwgBsDDQfaHdPREf',
      'virtual': 'viw5ydjKfvbDKMzaf'
    },
    'HR Law Fundamentals': {
      'in-person': 'viwOR51HSgvqnvvtM',
      'virtual': 'viwI0VscueaVxM4Vk'
    },
    'Strategic HR Management': {
      'in-person': 'viwVZQi5IShScOoOP',
      'virtual': 'viw3RC4Ti0v2Xi5VJ'
    },
    'Retirement Plans': {
      'in-person': 'viwuXlg9Lk4I7AeCY'
    },
    'Benefit Plan Claims, Appeals and Litigation': {
      'in-person': 'viw0LjpGuf6lGKLZu'
    },
    'Welfare Benefits Plan Issues': {
      'in-person': 'viwa8yRYP99luXOQc'
    },
    'Special Issues in Employment Law': {
      'in-person': 'viwfRNxWVMk9nUxCc'
    }
  };

  // Left Panel Content Configuration
  const LEFT_PANEL_CONTENT = {
    'format': {
      type: 'quote',
      quote: '"My only wish is that I had attended this seminar earlier in my career!"',
      attribution: {
        name: 'Christina Lipetzky',
        title: 'Human Resources Manager',
        company: 'Montana Department of Environmental Quality'
      }
    },
    'program': {
      type: 'stats',
      headline: 'Practicing Attorneys, Not Academics',
      subtext: '45 years of training HR professionals who need answers they can use Monday morning.',
      stats: [
        { number: '45+', label: 'Years of Excellence' },
        { number: '7,000+', label: 'HR Professionals Trained' },
        { number: '9', label: 'Cities Nationwide' }
      ]
    },
    'session': {
      type: 'program-takeaways',
      headline: 'Great choice! After this program, you\'ll be able to...'
    },
    'blocks': {
      type: 'standard',
      headline: 'Flexible Learning Options',
      subtext: 'Attend the full program for the complete experience, or select specific blocks that address your immediate needs.'
    },
    'contact': {
      type: 'standard',
      headline: 'Join 7,000+ HR Professionals',
      subtext: 'Who have advanced their careers with IAML certification programs. You\'re in good company.'
    },
    'payment-method': {
      type: 'value-stack',
      headline: 'Your Investment in Excellence',
      values: [
        { text: 'Intensive, practical training', dynamic: 'duration' },
        { text: 'Expert faculty with real-world experience' },
        { text: 'Comprehensive course materials' },
        { text: 'Certificate of completion' },
        { text: 'Networking with HR peers' }
      ]
    }
  };

  // Program-specific takeaways for session step
  const PROGRAM_TAKEAWAYS = {
    'Certificate in Employee Relations Law': [
      'Handle employee terminations with confidence, knowing exactly what documentation you need',
      'Navigate FMLA/ADA intersection issues that trip up even experienced HR professionals',
      'Spot wage-hour compliance gaps before they become class action exposure',
      'Conduct workplace investigations that hold up under legal scrutiny',
      'Advise managers on discipline situations without second-guessing yourself',
      'Draft separation agreements and releases that actually protect your organization'
    ],
    'Certificate in Strategic HR Leadership': [
      'Move from tactical HR execution to strategic business partnership',
      'Build and develop high-performing HR teams that operate independently',
      'Create measurable HR metrics that demonstrate department value to leadership',
      'Handle complex employee situations without escalating everything upward',
      'Design performance management systems that actually improve performance',
      'Position yourself for advancement from manager to director-level roles'
    ],
    'Certificate in Employee Benefits Law': [
      'Navigate ACA, COBRA, and ERISA compliance without outside counsel for routine issues',
      'Manage HIPAA requirements across your benefits administration',
      'Handle Section 125 cafeteria plans and FSA administration confidently',
      'Complete Form 5500 filings accurately and on time',
      'Design benefits packages that attract talent while managing fiduciary risk',
      'Advise leadership on benefits strategy with credibility'
    ],
    'Advanced Certificate in Strategic Employment Law': [
      'Apply the latest case law developments to your organization\'s policies',
      'Anticipate regulatory changes before they impact your compliance posture',
      'Handle emerging issues like AI in hiring, pay transparency, and remote work compliance',
      'Network with peers facing similar challenges across industries',
      'Update your employment law knowledge in a concentrated format'
    ],
    'Certificate in Workplace Investigations': [
      'Conduct investigations from intake to final report using legally defensible methodology',
      'Interview witnesses effectively while maintaining neutrality and documentation',
      'Write investigation reports that withstand legal challenge',
      'Know when to bring in outside investigators vs. handle internally',
      'Preserve evidence and maintain confidentiality throughout the process',
      'Make credibility determinations you can defend'
    ],
    'Advanced Certificate in Employee Benefits Law': [
      'Handle complex multi-state benefits compliance across your organization',
      'Navigate ERISA fiduciary responsibilities with confidence',
      'Manage retirement plan administration and audit preparation',
      'Address sophisticated benefits questions without defaulting to outside counsel',
      'Design executive compensation arrangements that comply with regulatory requirements'
    ]
  };

  const CITY_ABBREVIATIONS = {
    'Chicago': 'CHI',
    'New York': 'NYC',
    'Los Angeles': 'LAX',
    'San Francisco': 'SFO',
    'Dallas': 'DAL',
    'Atlanta': 'ATL',
    'Boston': 'BOS',
    'Seattle': 'SEA',
    'Denver': 'DEN',
    'Phoenix': 'PHX'
  };

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const state = {
    // Navigation
    currentStep: 'format',
    steps: [],

    // User Selections
    format: '', // 'in-person', 'virtual', 'on-demand'
    program: '', // Full program name
    programRecord: null,
    sessionId: '',
    sessionRecord: null,

    // Attendance (Block Programs)
    blockSelectionType: 'Full', // 'Full' or 'Partial'
    selectedBlocks: [], // ['Block 1', 'Block 2']
    blockDates: {},
    dynamicStartDate: null,
    dynamicEndDate: null,

    // Pricing
    listPrice: 0,
    couponCode: '',
    couponRecord: null,
    couponDiscount: 0,
    finalPrice: 0,

    // Contact Information
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    contactTitle: '',
    contactCompany: '',

    // Payment
    paymentMethod: '', // 'invoice' or 'stripe'

    // Billing (Invoice Only)
    billingContactName: '',
    billingContactEmail: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingPO: '',
    billingNotes: '',

    // Registration
    registrationCode: '',
    contactRecordId: '',
    companyRecordId: '',
    registrationRecordId: '',

    // Session Metadata
    city: '',
    stateProvince: '',
    venueName: '',

    // Stripe
    stripe: null,
    cardElement: null,
    stripeClientSecret: '',
    paymentIntentId: '',

    // Program Duration (fetched from Airtable)
    programDuration: '',

    // URL Pre-selection flag
    preselectedFromURL: false
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const qs = (selector) => document.querySelector(selector);
  const qsa = (selector) => document.querySelectorAll(selector);

  // Parse URL parameters for deep linking
  function parseURLParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      format: params.get('format'),
      program: params.get('program'),
      session: params.get('session'),
      blocks: params.get('blocks')
    };
  }

  // Clear URL params after processing (prevents re-processing on refresh)
  function clearURLParams() {
    const url = new URL(window.location);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  }

  function formatDate(date) {
    if (!date) return '—';
    if (typeof date === 'string') date = new Date(date);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return '—';
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return start === end ? start : `${start} - ${end}`;
  }

  // Smart date range formatter - consolidates month when same
  // "October 20-24, 2026" for same month, "October 20 - November 2, 2026" for different
  function formatSmartDateRange(startDate, endDate) {
    if (!startDate || !endDate) return '—';

    // Parse dates as UTC to avoid timezone shift issues
    // Airtable sends dates like "2026-04-20" which JS interprets as midnight UTC
    // Using UTC methods ensures we get the correct date regardless of local timezone
    let start, end;
    if (typeof startDate === 'string') {
      const [y, m, d] = startDate.split('-').map(Number);
      start = new Date(Date.UTC(y, m - 1, d));
    } else {
      start = startDate;
    }
    if (typeof endDate === 'string') {
      const [y, m, d] = endDate.split('-').map(Number);
      end = new Date(Date.UTC(y, m - 1, d));
    } else {
      end = endDate;
    }

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '—';

    const startMonth = start.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
    const startDay = start.getUTCDate();
    const endDay = end.getUTCDate();
    const startYear = start.getUTCFullYear();
    const endYear = end.getUTCFullYear();

    // Same day
    if (start.getTime() === end.getTime()) {
      return `${startMonth} ${startDay}, ${startYear}`;
    }

    // Same month and year: "October 20-24, 2026"
    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonth} ${startDay}-${endDay}, ${startYear}`;
    }

    // Same year, different months: "October 20 - November 2, 2026"
    if (startYear === endYear) {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
    }

    // Different years: "December 28, 2026 - January 2, 2027"
    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatPhoneNumber(value) {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format based on length: (xxx) xxx-xxxx
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  function isBlockProgram(programName, format) {
    const program = PROGRAM_DATA[programName];
    if (!program || !program.blocks) return false;
    // Check if blocks exist for this specific format
    return program.blocks[format] && program.blocks[format].list && program.blocks[format].list.length > 0;
  }

  function getBlocksForFormat(programName, format) {
    const program = PROGRAM_DATA[programName];
    if (!program || !program.blocks || !program.blocks[format]) {
      return { list: [], prices: {} };
    }
    return program.blocks[format];
  }

  function saveStateToSessionStorage() {
    try {
      sessionStorage.setItem('iaml_registration_state', JSON.stringify(state));
      sessionStorage.setItem('iaml_registration_timestamp', Date.now().toString());
    } catch (e) {
      console.error('SessionStorage save failed:', e);
    }
  }

  function restoreStateFromSessionStorage() {
    try {
      const saved = sessionStorage.getItem('iaml_registration_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state, parsed);
        return true;
      }
    } catch (e) {
      console.error('SessionStorage restore failed:', e);
    }
    return false;
  }

  function clearStateFromSessionStorage() {
    try {
      sessionStorage.removeItem('iaml_registration_state');
      sessionStorage.removeItem('iaml_registration_timestamp');
    } catch (e) {
      console.error('SessionStorage clear failed:', e);
    }
  }

  // ============================================
  // STEP DETERMINATION
  // ============================================

  function determineSteps() {
    const steps = ['format', 'program'];

    // Skip session/blocks for on-demand
    if (state.format !== 'on-demand') {
      // Add blocks step BEFORE session for block programs
      if (isBlockProgram(state.program, state.format)) {
        steps.push('blocks');
      }
      steps.push('session');
    }

    steps.push('contact', 'payment-method');
    return steps;
  }

  // ============================================
  // BLOCK DATE PARSING
  // ============================================

  function parseBlockDates(sessionRecord) {
    if (!sessionRecord || !isBlockProgram(state.program, state.format)) {
      return {};
    }

    const blockData = getBlocksForFormat(state.program, state.format);
    const fields = sessionRecord.fields;
    const blockDates = {};

    blockData.list.forEach(blockName => {
      const datesField = fields[`${blockName} Dates`];
      if (datesField) {
        const parts = datesField.split(' - ');
        const start = new Date(parts[0].trim());
        const end = parts[1] ? new Date(parts[1].trim()) : start;
        blockDates[blockName] = { start, end };
      }
    });

    return blockDates;
  }

  function calculateDynamicDates() {
    if (state.blockSelectionType === 'Full') {
      state.dynamicStartDate = new Date(state.sessionRecord.fields['Start Date']);
      state.dynamicEndDate = new Date(state.sessionRecord.fields['End Date']);
    } else if (state.selectedBlocks.length > 0) {
      const selectedBlockDates = state.selectedBlocks.map(block => state.blockDates[block]).filter(Boolean);
      if (selectedBlockDates.length > 0) {
        state.dynamicStartDate = selectedBlockDates[0].start;
        state.dynamicEndDate = selectedBlockDates[selectedBlockDates.length - 1].end;
      }
    }
  }

  // ============================================
  // BLOCK VALIDATION
  // ============================================

  function getDisabledBlocks(currentSelection) {
    if (!isBlockProgram(state.program, state.format)) return [];

    const blockData = getBlocksForFormat(state.program, state.format);
    const blocks = blockData.list;

    if (currentSelection.length === 0) return [];

    const indices = currentSelection
      .map(block => blocks.indexOf(block))
      .sort((a, b) => a - b);

    const minIndex = Math.min(...indices);
    const maxIndex = Math.max(...indices);

    const disabled = [];
    blocks.forEach((block, idx) => {
      // Disable if it would create a gap
      if (idx < minIndex - 1 || idx > maxIndex + 1) {
        disabled.push(block);
      }
    });

    return disabled;
  }

  function validateConsecutiveBlocks(selectedBlocks) {
    if (selectedBlocks.length <= 1) return true;

    const blockData = getBlocksForFormat(state.program, state.format);
    const blockList = blockData.list;
    const indices = selectedBlocks.map(b => blockList.indexOf(b)).sort((a, b) => a - b);

    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) {
        return false;
      }
    }

    return true;
  }

  // ============================================
  // REGISTRATION CODE GENERATOR
  // ============================================

  function generateRegistrationCode() {
    const formatMap = { 'in-person': 'IP', 'virtual': 'VL', 'on-demand': 'OD' };
    const formatCode = formatMap[state.format] || 'XX';

    const programData = PROGRAM_DATA[state.program];
    const programCode = programData.code;

    let cityCode = 'ONL';
    if (state.format === 'in-person' && state.city) {
      cityCode = CITY_ABBREVIATIONS[state.city] || state.city.substring(0, 3).toUpperCase();
    } else if (state.format === 'virtual') {
      cityCode = 'VIR';
    }

    const date = state.dynamicStartDate || new Date(state.sessionRecord.fields['Start Date']);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    return `${formatCode}-${programCode}-${cityCode}-${month}${year}`;
  }

  // ============================================
  // CALENDAR INVITE (.ICS) GENERATION
  // ============================================

  function generateICSContent() {
    const startDate = state.dynamicStartDate || new Date(state.sessionRecord.fields['Start Date']);
    const endDate = state.dynamicEndDate || new Date(state.sessionRecord.fields['End Date']);

    const formatYYYYMMDD = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    let location = '';
    if (state.format === 'in-person') {
      location = state.venueName
        ? `${state.venueName}, ${state.city}, ${state.stateProvince}`
        : `${state.city}, ${state.stateProvince}`;
    } else if (state.format === 'virtual') {
      location = 'Virtual Classroom (Link will be provided via email)';
    } else {
      location = 'Online - Self-Paced';
    }

    const description = [
      `Program: ${state.program}`,
      `Format: ${FORMAT_MAP[state.format]}`,
      state.blockSelectionType !== 'Full' ? `Attendance: ${state.blockSelectionType}` : '',
      `Registration Code: ${state.registrationCode}`,
      '',
      'For more information, visit https://iaml.com or contact info@iaml.com'
    ]
      .filter(Boolean)
      .join('\\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IAML//Registration System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${state.registrationCode}-${Date.now()}@iaml.com`,
      `DTSTAMP:${formatYYYYMMDD(new Date())}`,
      `DTSTART;VALUE=DATE:${formatYYYYMMDD(startDate)}`,
      `DTEND;VALUE=DATE:${formatYYYYMMDD(endDate)}`,
      `SUMMARY:${state.program}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  function downloadCalendarInvite() {
    const content = generateICSContent();
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `IAML-${state.registrationCode}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ============================================
  // UI RENDERING
  // ============================================

  function buildStepperUI() {
    const stepperList = qs('#stepperList');
    stepperList.innerHTML = '';

    const stepLabels = {
      format: 'Format',
      program: 'Program',
      session: 'Session',
      attendance: 'Attendance',
      contact: 'Your Info',
      'payment-method': 'Payment',
      'confirm-invoice': 'Confirmation',
      'confirm-paid': 'Confirmation'
    };

    state.steps.forEach((step, index) => {
      const li = document.createElement('li');
      li.className = 'stepper-item';
      if (step === state.currentStep) li.classList.add('active');

      li.innerHTML = `
        <span class="stepper-number">${index + 1}</span>
        <span class="stepper-label">${stepLabels[step]}</span>
      `;

      stepperList.appendChild(li);
    });
  }

  function showStep(stepName) {
    // Validate before moving forward
    if (state.currentStep && state.steps.indexOf(state.currentStep) < state.steps.indexOf(stepName)) {
      if (!validateCurrentStep()) {
        return;
      }
    }

    // Update history
    history.pushState({ step: stepName }, '', `#step-${stepName}`);

    // Hide all steps
    qsa('.register-step').forEach(el => el.classList.add('hidden'));

    // Show current step
    const stepEl = qs(`#step-${stepName}`);
    if (stepEl) {
      stepEl.classList.remove('hidden');
    }

    state.currentStep = stepName;
    saveStateToSessionStorage();
    updateStepperUI();
    updateNavigationButtons();
    updateLeftPanel();

    // Load blocks when navigating to blocks step
    if (stepName === 'blocks' && isBlockProgram(state.program, state.format)) {
      loadBlocksOptions();
    }

    // Load sessions when navigating to session step
    if (stepName === 'session' && state.format !== 'on-demand' && state.program) {
      loadSessions();
    }

    // Update order summary when showing payment step
    if (stepName === 'payment-method') {
      updateOrderSummary();
    }

    // Show pre-selection summary on contact step if came from URL deep link
    if (stepName === 'contact' && state.preselectedFromURL) {
      showPreSelectionSummary();
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }

  // Show summary banner when user arrives via URL pre-selection
  function showPreSelectionSummary() {
    const contactStep = qs('#step-contact');
    if (!contactStep) return;

    // Remove existing summary if any
    const existingSummary = qs('#preSelectionSummary');
    if (existingSummary) existingSummary.remove();

    // Build location/dates display
    let locationDisplay = '';
    let datesDisplay = '';

    if (state.format === 'on-demand') {
      locationDisplay = 'On-Demand';
      datesDisplay = 'Start anytime';
    } else if (state.format === 'virtual') {
      locationDisplay = 'Virtual (Live Online)';
      if (state.sessionRecord?.fields) {
        const fields = state.sessionRecord.fields;
        datesDisplay = formatSmartDateRange(fields['Start Date'], fields['End Date']);
      }
    } else {
      // In-person
      locationDisplay = state.city && state.stateProvince
        ? `${state.city}, ${state.stateProvince}`
        : state.city || 'Location TBD';
      if (state.sessionRecord?.fields) {
        const fields = state.sessionRecord.fields;
        datesDisplay = formatSmartDateRange(fields['Start Date'], fields['End Date']);
      }
    }

    // Build blocks info if partial attendance
    let blocksNote = '';
    if (state.blockSelectionType === 'Partial' && state.selectedBlocks.length > 0) {
      blocksNote = `<span class="preselection-blocks">Attending: ${state.selectedBlocks.join(', ')}</span>`;
    }

    // Create summary element
    const summaryEl = document.createElement('div');
    summaryEl.id = 'preSelectionSummary';
    summaryEl.className = 'preselection-summary';
    summaryEl.innerHTML = `
      <div class="preselection-header">
        <span class="preselection-badge">${FORMAT_MAP[state.format] || state.format}</span>
        <button type="button" class="preselection-change-btn" id="changeSelectionBtn">Change</button>
      </div>
      <div class="preselection-details">
        <strong class="preselection-program">${state.program}</strong>
        <span class="preselection-location-dates">${locationDisplay}${datesDisplay ? ' • ' + datesDisplay : ''}</span>
        ${blocksNote}
      </div>
    `;

    // Insert at the top of contact step, before the title
    const stepTitle = contactStep.querySelector('.step-title');
    if (stepTitle) {
      contactStep.insertBefore(summaryEl, stepTitle);
    } else {
      contactStep.insertBefore(summaryEl, contactStep.firstChild);
    }

    // Add change button handler
    const changeBtn = qs('#changeSelectionBtn');
    if (changeBtn) {
      changeBtn.addEventListener('click', () => {
        // Reset pre-selection flag and go back to format step
        state.preselectedFromURL = false;
        summaryEl.remove();
        showStep('format');
      });
    }
  }

  function updateStepperUI() {
    const items = qsa('.stepper-item');
    const currentIndex = state.steps.indexOf(state.currentStep);

    items.forEach((item, index) => {
      item.classList.remove('active', 'completed');
      if (index < currentIndex) {
        item.classList.add('completed');
      } else if (index === currentIndex) {
        item.classList.add('active');
      }
    });
  }

  function updateNavigationButtons() {
    const currentIndex = state.steps.indexOf(state.currentStep);
    const backBtn = qs('#backBtn');
    const nextBtn = qs('#nextBtn');

    // Hide/show back button
    backBtn.style.display = currentIndex === 0 ? 'none' : 'block';

    // Update next button text
    const isLastStep = currentIndex === state.steps.length - 1;
    nextBtn.textContent = isLastStep ? 'Complete Registration' : 'Next →';

    // Update button visibility
    updateNextButtonVisibility();
  }

  function updateOrderSummary() {
    // Program name
    qs('#summaryProgram').textContent = state.program || '—';

    // Location
    let location = '—';
    if (state.format === 'in-person' && state.city) {
      location = state.stateProvince ? `${state.city}, ${state.stateProvince}` : state.city;
    } else if (state.format === 'virtual') {
      location = 'Virtual';
    } else if (state.format === 'on-demand') {
      location = 'On-Demand';
    }
    qs('#summaryLocation').textContent = location;

    // Dates
    let dates = '—';
    if (state.sessionRecord) {
      const fields = state.sessionRecord.fields;
      dates = formatSmartDateRange(fields['Start Date'], fields['End Date']);
    } else if (state.format === 'on-demand') {
      dates = 'Self-paced';
    }
    qs('#summaryDates').textContent = dates;

    // Price and Discount rows - only show if discount applied
    const priceRow = qs('#summaryPriceRow');
    const discountRow = qs('#summaryDiscountRow');
    const priceDivider = qs('#summaryPriceDivider');

    if (state.couponDiscount > 0) {
      // Show price breakdown when discount is applied
      priceRow.classList.remove('hidden');
      discountRow.classList.remove('hidden');
      priceDivider.classList.remove('hidden');
      qs('#summaryPrice').textContent = formatCurrency(state.listPrice);
      qs('#summaryDiscount').textContent = `-${formatCurrency(state.couponDiscount)}`;
    } else {
      // Hide price breakdown, only show total
      priceRow.classList.add('hidden');
      discountRow.classList.add('hidden');
      priceDivider.classList.add('hidden');
    }

    // Total
    qs('#summaryTotal').textContent = formatCurrency(state.finalPrice);
  }

  function updateNextButtonVisibility() {
    const nextBtn = qs('#nextBtn');
    const step = state.currentStep;

    // Always show on contact and payment-method steps
    if (step === 'contact' || step === 'payment-method') {
      nextBtn.style.display = 'block';
      nextBtn.style.opacity = '1';
      nextBtn.disabled = false;
      return;
    }

    // For selection steps, check if selection is made
    let hasValidSelection = false;

    switch (step) {
      case 'format':
        hasValidSelection = !!state.format;
        break;
      case 'program':
        hasValidSelection = !!state.program;
        break;
      case 'session':
        hasValidSelection = !!state.sessionId;
        break;
      case 'blocks':
        hasValidSelection = state.blockSelectionType === 'Full' ||
                           (state.blockSelectionType === 'Partial' && state.selectedBlocks.length > 0);
        break;
      default:
        hasValidSelection = true;
    }

    // Show/hide button based on validation
    if (hasValidSelection) {
      nextBtn.style.display = 'block';
      nextBtn.style.opacity = '1';
      nextBtn.disabled = false;
    } else {
      nextBtn.style.display = 'none';
    }
  }

  /**
   * Updates the left panel content based on current step
   */
  function updateLeftPanel() {
    const leftPanel = qs('#registerLeftPanel');
    const panelContent = qs('#leftPanelContent');

    if (!leftPanel || !panelContent) return;

    const content = LEFT_PANEL_CONTENT[state.currentStep];

    // Hide left panel for confirmation steps
    if (!content || state.currentStep.startsWith('confirm')) {
      leftPanel.classList.add('hidden');
      qs('.register-right-panel')?.classList.add('confirmation-active');
      return;
    }

    // Show left panel
    leftPanel.classList.remove('hidden');
    qs('.register-right-panel')?.classList.remove('confirmation-active');

    // Generate HTML based on content type
    let html = '';

    switch (content.type) {
      case 'quote':
        html = `
          <div class="panel-logo">
            <img src="https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/69042ba0346960d8775fb4a4.svg" alt="IAML" height="60">
          </div>
          <blockquote class="panel-quote">${content.quote}</blockquote>
          ${content.attribution ? `
            <div class="quote-attribution">
              <span class="attribution-name">${content.attribution.name}</span>
              <span class="attribution-title">${content.attribution.title}</span>
              <span class="attribution-company">${content.attribution.company}</span>
            </div>
          ` : ''}
          ${content.subtext ? `<p class="panel-subtext">${content.subtext}</p>` : ''}
        `;
        break;

      case 'stats':
        html = `
          <div class="panel-logo">
            <img src="https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/69042ba0346960d8775fb4a4.svg" alt="IAML" height="60">
          </div>
          <h2 class="panel-headline">${content.headline}</h2>
          <p class="panel-subtext">${content.subtext}</p>
          <div class="panel-stats">
            ${content.stats.map(stat => `
              <div class="stat-item">
                <span class="stat-number">${stat.number}</span>
                <span class="stat-label">${stat.label}</span>
              </div>
            `).join('')}
          </div>
        `;
        break;

      case 'standard':
        html = `
          <div class="panel-logo">
            <img src="https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/69042ba0346960d8775fb4a4.svg" alt="IAML" height="60">
          </div>
          <h2 class="panel-headline">${content.headline}</h2>
          <p class="panel-subtext">${content.subtext}</p>
        `;
        break;

      case 'program-takeaways':
        // Get takeaways for current program and randomly select 4
        const allTakeaways = PROGRAM_TAKEAWAYS[state.program] || [];
        const shuffled = [...allTakeaways].sort(() => Math.random() - 0.5);
        const selectedTakeaways = shuffled.slice(0, 4);

        html = `
          <div class="panel-logo">
            <img src="https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/69042ba0346960d8775fb4a4.svg" alt="IAML" height="60">
          </div>
          <h2 class="panel-headline">${content.headline}</h2>
          <div class="value-stack">
            ${selectedTakeaways.map(text => `
              <div class="value-item">
                <span class="value-icon">✓</span>
                <span class="value-text">${text}</span>
              </div>
            `).join('')}
            <div class="value-item">
              <span class="value-icon">✓</span>
              <span class="value-text">...and much more!</span>
            </div>
          </div>
        `;
        break;

      case 'value-stack':
        html = `
          <div class="panel-logo">
            <img src="https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/69042ba0346960d8775fb4a4.svg" alt="IAML" height="60">
          </div>
          <h2 class="panel-headline">${content.headline}</h2>
          <div class="value-stack">
            ${content.values.map(value => {
              let text = value.text;
              // Handle dynamic duration text
              if (value.dynamic === 'duration' && state.programDuration) {
                text = `${state.programDuration} of intensive, practical training`;
              }
              return `
                <div class="value-item">
                  <span class="value-icon">✓</span>
                  <span class="value-text">${text}</span>
                </div>
              `;
            }).join('')}
          </div>
        `;
        break;
    }

    panelContent.innerHTML = html;
  }

  // ============================================
  // VALIDATION
  // ============================================

  function validateCurrentStep() {
    const step = state.currentStep;

    switch (step) {
      case 'format':
        if (!state.format) {
          showErrorMessage('Please select a program format');
          return false;
        }
        return true;

      case 'program':
        if (!state.program) {
          showErrorMessage('Please select a program');
          return false;
        }
        return true;

      case 'session':
        if (!state.sessionId) {
          showErrorMessage('Please select a session');
          return false;
        }
        return true;

      case 'blocks':
        if (state.blockSelectionType === 'Partial' && state.selectedBlocks.length === 0) {
          showErrorMessage('Please select at least one block');
          return false;
        }
        if (!validateConsecutiveBlocks(state.selectedBlocks)) {
          showErrorMessage('Please select consecutive blocks only');
          return false;
        }
        return true;

      case 'contact':
        return validateContactForm();

      case 'payment-method':
        if (!state.paymentMethod) {
          showErrorMessage('Please select a payment method');
          return false;
        }
        if (state.paymentMethod === 'invoice') {
          return true;  // No billing form needed for invoice
        }
        return true;

      default:
        return true;
    }
  }

  function validateContactForm() {
    let hasError = false;

    const fields = [
      { id: 'firstName', errorId: 'firstNameError', message: 'First name is required' },
      { id: 'lastName', errorId: 'lastNameError', message: 'Last name is required' },
      { id: 'email', errorId: 'emailError', message: 'Valid email is required', type: 'email' },
      { id: 'phone', errorId: 'phoneError', message: 'Phone number is required' }
    ];

    fields.forEach(field => {
      const input = qs(`#${field.id}`);
      const errorEl = qs(`#${field.errorId}`);
      let isValid = input.value.trim().length > 0;

      if (isValid && field.type === 'email') {
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
      }

      if (!isValid) {
        errorEl.textContent = field.message;
        errorEl.classList.add('visible');
        hasError = true;
      } else {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
      }
    });

    if (hasError) {
      showErrorMessage('Please fill in all required fields');
      return false;
    }

    // Save contact info to state
    state.contactFirstName = qs('#firstName').value.trim();
    state.contactLastName = qs('#lastName').value.trim();
    state.contactEmail = qs('#email').value.trim();
    state.contactPhone = qs('#phone').value.trim();
    state.contactTitle = qs('#contactTitle').value.trim();
    state.contactCompany = qs('#company').value.trim();

    return true;
  }

  function showErrorMessage(message) {
    const banner = qs('#errorBanner');
    const errorMessage = qs('#errorMessage');
    errorMessage.textContent = message;
    banner.classList.remove('hidden');
  }

  function hideErrorMessage() {
    const banner = qs('#errorBanner');
    banner.classList.add('hidden');
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  function setupEventListeners() {
    // Format selection
    qsa('input[name="format"]').forEach(input => {
      input.addEventListener('change', (e) => {
        state.format = e.target.value;
        state.program = '';
        state.sessionId = '';
        state.blockSelectionType = 'Full';
        state.selectedBlocks = [];
        state.steps = determineSteps();
        buildStepperUI();
        loadPrograms();
        saveStateToSessionStorage();
        updateNextButtonVisibility();
        showStep('program');
      });
    });

    // Navigation buttons
    qs('#backBtn').addEventListener('click', () => {
      const currentIndex = state.steps.indexOf(state.currentStep);
      if (currentIndex > 0) {
        showStep(state.steps[currentIndex - 1]);
      }
    });

    qs('#nextBtn').addEventListener('click', () => {
      handleNextButton();
    });

    // Payment method selection
    qsa('input[name="paymentMethod"]').forEach(input => {
      input.addEventListener('change', (e) => {
        state.paymentMethod = e.target.value;
        const invoiceForm = qs('#invoiceForm');
        const stripeForm = qs('#stripePaymentForm');

        if (e.target.value === 'invoice') {
          invoiceForm.classList.add('hidden');  // No billing form for invoice
          stripeForm.classList.add('hidden');
        } else {
          invoiceForm.classList.add('hidden');
          stripeForm.classList.remove('hidden');
        }

        saveStateToSessionStorage();
      });
    });

    // Coupon code apply button
    const applyCouponBtn = qs('#applyCouponBtn');
    if (applyCouponBtn) {
      applyCouponBtn.addEventListener('click', handleApplyCoupon);
    }

    // Phone number auto-formatting
    const phoneInput = qs('#phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        e.target.value = formatPhoneNumber(e.target.value);
      });
    }

    // Error banner close
    qs('.error-close').addEventListener('click', hideErrorMessage);

    // Browser back button support
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.step) {
        const currentIndex = state.steps.indexOf(state.currentStep);
        const newIndex = state.steps.indexOf(e.state.step);
        if (newIndex >= 0 && newIndex !== currentIndex) {
          state.currentStep = e.state.step;
          showStep(e.state.step);
        }
      }
    });
  }

  function handleNextButton() {
    if (state.currentStep === 'payment-method') {
      if (state.paymentMethod === 'invoice') {
        submitInvoiceRegistration();
      } else {
        submitStripeRegistration();
      }
      return;
    }

    const currentIndex = state.steps.indexOf(state.currentStep);
    if (currentIndex < state.steps.length - 1) {
      showStep(state.steps[currentIndex + 1]);
    }
  }

  // ============================================
  // PROGRAM LOADING
  // ============================================

  async function loadPrograms() {
    const container = qs('#programOptions');
    container.innerHTML = '';

    // Use ordered list of certificate programs
    let programs = VISIBLE_PROGRAMS;

    programs.forEach(programName => {
      const programData = PROGRAM_DATA[programName];
      const card = document.createElement('label');
      card.className = 'program-option';

      card.innerHTML = `
        <input type="radio" name="program" value="${programName}">
        <span class="program-name">${programName}</span>
      `;

      card.addEventListener('change', (e) => {
        if (e.target.checked) {
          state.program = programName;
          state.sessionId = '';
          state.blockSelectionType = 'Full';
          state.selectedBlocks = [];
          state.steps = determineSteps();
          buildStepperUI();

          // Set initial pricing
          state.listPrice = programData.price;
          state.finalPrice = programData.price;

          saveStateToSessionStorage();
          updateNextButtonVisibility();
        }
      });

      container.appendChild(card);
    });
  }

  // ============================================
  // PROGRAM DURATION (FROM AIRTABLE)
  // ============================================

  /**
   * Fetches program duration from Airtable after session is selected
   * Used to display dynamic duration in the payment step value stack
   */
  async function fetchProgramDuration() {
    if (!state.sessionId) return;

    try {
      // Fetch the Program Instance record to get Program Duration
      const response = await fetch(
        `/api/airtable-programs?table=Program%20Instances&recordId=${state.sessionId}`
      );

      if (!response.ok) {
        console.warn('Failed to fetch program duration');
        return;
      }

      const data = await response.json();

      // Extract Program Duration field
      const duration = data.fields?.['Program Duration'] ||
                       data.fields?.['Duration'] ||
                       '';

      if (duration) {
        state.programDuration = duration;
        saveStateToSessionStorage();
      }

    } catch (error) {
      console.warn('Error fetching program duration:', error);
      // Fallback handled by default text in left panel content
    }
  }

  // ============================================
  // SESSION LOADING - Static Cache with API Fallback
  // ============================================
  const SESSION_CACHE_BASE = '/data/sessions/by-view';

  async function loadSessions() {
    const container = qs('#sessionList');
    container.innerHTML = '';

    const loadingDiv = qs('#sessionsLoading');
    const emptyDiv = qs('#sessionsEmpty');

    loadingDiv.classList.remove('hidden');
    emptyDiv.classList.add('hidden');

    try {
      // Determine which view to use based on program/format/blocks
      let viewId;

      if (state.blockSelectionType === 'Full' || !isBlockProgram(state.program, state.format)) {
        // Full program or non-block program - use program view
        viewId = SESSION_VIEW_IDS[state.program]?.[state.format];
      } else {
        // Partial attendance - use first selected block's view
        // (All selected blocks should have same sessions since consecutive)
        const firstBlock = state.selectedBlocks[0];
        viewId = SESSION_VIEW_IDS[firstBlock]?.[state.format];
      }

      if (!viewId) {
        console.error(`No view configured for ${state.program} / ${state.format}`);
        throw new Error('Session configuration not available');
      }

      let data;

      // Try static cache first for faster loading
      try {
        const cacheResponse = await fetch(`${SESSION_CACHE_BASE}/${viewId}.json`);
        if (cacheResponse.ok) {
          data = await cacheResponse.json();
          console.log('Sessions loaded from cache, generated:', data.generated);
        }
      } catch (cacheError) {
        console.warn('Session cache unavailable, falling back to API');
      }

      // Fallback to API if cache failed or unavailable
      if (!data || !data.records) {
        const response = await fetch(`/api/airtable-programs?table=tblympiL1p6PmQz9i&view=${viewId}`);

        if (!response.ok) {
          throw new Error('Failed to load sessions');
        }

        data = await response.json();
      }

      const sessions = data.records || [];

      loadingDiv.classList.add('hidden');

      if (sessions.length === 0) {
        emptyDiv.classList.remove('hidden');
        return;
      }

      // Sort sessions by start date (chronological order)
      sessions.sort((a, b) => {
        const dateA = a.fields['Start Date'] || '';
        const dateB = b.fields['Start Date'] || '';
        return dateA.localeCompare(dateB);
      });

      sessions.forEach(session => {
        const fields = session.fields;
        const card = document.createElement('label');
        card.className = 'session-option';

        const dateRange = formatSmartDateRange(fields['Start Date'], fields['End Date']);
        const location = state.format === 'in-person'
          ? `${fields['City']}, ${fields['State/Province']}`
          : fields['Virtual Platform'] || 'Virtual';

        card.innerHTML = `
          <input type="radio" name="session" value="${session.id}">
          <div class="session-card">
            <div class="session-dates">${dateRange}</div>
            <div class="session-location">${location}</div>
          </div>
        `;

        card.addEventListener('change', (e) => {
          if (e.target.checked) {
            state.sessionId = session.id;
            state.sessionRecord = session;
            state.city = fields['City'] || '';
            state.stateProvince = fields['State/Province'] || '';
            state.venueName = fields['Venue Name'] || '';

            // Parse block dates if applicable (for displaying dates after selection)
            if (isBlockProgram(state.program, state.format)) {
              state.blockDates = parseBlockDates(session);
              calculateDynamicDates();
            }

            // Fetch program duration for Step 6 value stack (async, non-blocking)
            fetchProgramDuration();

            saveStateToSessionStorage();
            updateNextButtonVisibility();
            // Don't auto-navigate - let user click Next
          }
        });

        container.appendChild(card);
      });
    } catch (error) {
      console.error('Error loading sessions:', error);
      loadingDiv.classList.add('hidden');
      showErrorMessage('Failed to load sessions. Please try again.');
    }
  }

  // Fetch a single session by Airtable record ID (for URL pre-selection)
  async function fetchSessionById(sessionId) {
    try {
      const response = await fetch(
        `/api/airtable-programs?table=tblympiL1p6PmQz9i&recordId=${encodeURIComponent(sessionId)}`
      );
      if (!response.ok) {
        console.error('Failed to fetch session:', response.status);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching session by ID:', error);
      return null;
    }
  }

  // ============================================
  // BLOCKS SELECTION
  // ============================================

  function loadBlocksOptions() {
    const container = qs('#blocksOptions');
    container.innerHTML = '';

    if (!isBlockProgram(state.program, state.format)) {
      // Skip blocks step - shouldn't happen but safety check
      return;
    }

    const programData = PROGRAM_DATA[state.program];
    const blockData = getBlocksForFormat(state.program, state.format);
    const blocks = blockData.list;
    const blockPrices = blockData.prices;

    // ===== FULL PROGRAM OPTION (Radio) =====
    const fullOption = document.createElement('div');
    fullOption.className = 'block-selection-option';
    fullOption.innerHTML = `
      <label class="block-selection-radio">
        <input type="radio" name="blockSelection" value="Full" ${state.blockSelectionType === 'Full' ? 'checked' : ''}>
        <div class="full-program-card">
          <div class="block-selection-indicator"></div>
          <div class="block-selection-content">
            <div class="block-selection-header">
              <span class="block-selection-title">Full Program</span>
              <span class="block-selection-badge">Best Value</span>
            </div>
            <div class="block-selection-meta">Includes all ${blocks.length} blocks</div>
          </div>
          <div class="block-selection-price">${formatCurrency(programData.price)}</div>
        </div>
      </label>
    `;

    fullOption.querySelector('input').addEventListener('change', () => {
      state.blockSelectionType = 'Full';
      state.selectedBlocks = [...blocks]; // All blocks selected
      state.listPrice = programData.price;
      state.finalPrice = state.listPrice - state.couponDiscount;
      saveStateToSessionStorage();
      updateNextButtonVisibility();
      updateBlockCheckboxStates();
    });

    container.appendChild(fullOption);

    // ===== INDIVIDUAL BLOCKS SECTION =====
    const individualSection = document.createElement('div');
    individualSection.className = 'block-selection-individual';
    individualSection.innerHTML = `
      <div class="block-selection-divider">
        <span>or select individual blocks</span>
      </div>
      <div class="individual-blocks-list" id="individualBlocksList"></div>
    `;
    container.appendChild(individualSection);

    // ===== INDIVIDUAL BLOCK CHECKBOXES =====
    const blocksList = qs('#individualBlocksList');
    blocks.forEach((blockName, index) => {
      const blockDiv = document.createElement('div');
      blockDiv.className = 'individual-block-item';
      const isSelected = state.blockSelectionType === 'Partial' &&
                         state.selectedBlocks.includes(blockName);

      blockDiv.innerHTML = `
        <label class="individual-block-label">
          <input type="checkbox" name="individualBlock" value="${blockName}" ${isSelected ? 'checked' : ''}>
          <div class="individual-block-card">
            <div class="individual-block-checkbox"></div>
            <div class="individual-block-info">
              <span class="individual-block-name">${blockName}</span>
              <span class="individual-block-order">Block ${index + 1}</span>
            </div>
            <div class="individual-block-price">${formatCurrency(blockPrices[blockName] || 0)}</div>
          </div>
        </label>
      `;

      blockDiv.querySelector('input').addEventListener('change', (e) => {
        handleBlockCheckboxChange(e, blocks, blockPrices, programData);
      });

      blocksList.appendChild(blockDiv);
    });

    updateBlockCheckboxStates();
  }

  function handleBlockCheckboxChange(e, blocks, blockPrices, programData) {
    // Uncheck Full Program radio when individual blocks are selected
    const fullRadio = qs('input[name="blockSelection"][value="Full"]');
    if (fullRadio) fullRadio.checked = false;

    state.blockSelectionType = 'Partial';

    // Get currently selected blocks
    const selectedBlocks = Array.from(qsa('#individualBlocksList input[type="checkbox"]:checked'))
      .map(cb => cb.value);

    // Validate consecutive blocks
    if (!validateConsecutiveBlocks(selectedBlocks)) {
      e.target.checked = false;
      showErrorMessage('Please select consecutive blocks only');
      return;
    }

    state.selectedBlocks = selectedBlocks;

    // Recalculate pricing
    if (selectedBlocks.length === blocks.length) {
      // All blocks selected = full program price
      state.listPrice = programData.price;
    } else {
      // Sum of individual block prices
      const totalBlockPrice = selectedBlocks.reduce((sum, block) =>
        sum + (blockPrices[block] || 0), 0);
      state.listPrice = totalBlockPrice;
    }
    state.finalPrice = state.listPrice - state.couponDiscount;

    saveStateToSessionStorage();
    updateNextButtonVisibility();
    updateBlockCheckboxStates();
  }

  function updateBlockCheckboxStates() {
    const disabledBlocks = getDisabledBlocks(state.selectedBlocks);
    const checkboxes = qsa('#individualBlocksList input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
      // Only disable non-consecutive blocks (for consecutive validation)
      checkbox.disabled = disabledBlocks.includes(checkbox.value);
      // Uncheck if Full is selected, but keep clickable
      if (state.blockSelectionType === 'Full') {
        checkbox.checked = false;
      }
    });
  }

  // ============================================
  // COUPON CODE HANDLING
  // ============================================

  async function handleApplyCoupon() {
    const couponInput = qs('#couponCode');
    const couponMessage = qs('#couponMessage');
    const code = couponInput.value.trim();

    if (!code) {
      couponMessage.textContent = 'Please enter a coupon code';
      couponMessage.className = 'coupon-message error';
      return;
    }

    // Clear previous message
    couponMessage.textContent = '';
    couponMessage.className = 'coupon-message';

    try {
      // Validate coupon via API
      const response = await fetch(`/api/airtable-coupons?code=${encodeURIComponent(code)}`);
      const data = await response.json();

      if (!response.ok || !data.records || data.records.length === 0) {
        couponMessage.textContent = 'Invalid coupon code';
        couponMessage.className = 'coupon-message error';
        return;
      }

      const coupon = data.records[0];
      const couponRecord = coupon.fields;

      // Check if coupon is active/valid
      if (couponRecord['Status'] !== 'Active') {
        couponMessage.textContent = 'This coupon is no longer valid';
        couponMessage.className = 'coupon-message error';
        return;
      }

      // Check expiration date
      if (couponRecord['Expiration Date']) {
        const expirationDate = new Date(couponRecord['Expiration Date']);
        if (new Date() > expirationDate) {
          couponMessage.textContent = 'This coupon has expired';
          couponMessage.className = 'coupon-message error';
          return;
        }
      }

      // Check usage limits
      const maxUses = couponRecord['Max Uses'] || Infinity;
      const timesUsed = couponRecord['Times Used'] || 0;
      if (timesUsed >= maxUses) {
        couponMessage.textContent = 'This coupon has reached its usage limit';
        couponMessage.className = 'coupon-message error';
        return;
      }

      // Apply the coupon
      state.couponCode = code;
      state.couponRecord = coupon;

      // Get discount amount
      const discountAmount = couponRecord['Discount Amount'] || 0;
      const discountPercent = couponRecord['Discount Percent'] || 0;

      // Calculate discount based on type
      if (discountPercent > 0) {
        state.couponDiscount = Math.round(state.listPrice * (discountPercent / 100));
      } else {
        state.couponDiscount = discountAmount;
      }

      // Ensure discount doesn't exceed list price
      state.couponDiscount = Math.min(state.couponDiscount, state.listPrice);

      // Recalculate final price
      state.finalPrice = state.listPrice - state.couponDiscount;

      // Show success message
      const discountText = discountPercent > 0
        ? `${discountPercent}% off`
        : formatCurrency(discountAmount);
      couponMessage.textContent = `Coupon applied! You saved ${discountText}`;
      couponMessage.className = 'coupon-message success';

      // Update sidebar with new pricing
      updateLeftPanel();

      // Save state
      saveStateToSessionStorage();

    } catch (error) {
      console.error('Coupon validation error:', error);
      couponMessage.textContent = 'Error validating coupon. Please try again.';
      couponMessage.className = 'coupon-message error';
    }
  }

  // ============================================
  // SUBMISSION HANDLERS
  // ============================================

  async function submitInvoiceRegistration() {
    hideErrorMessage();
    qs('#loadingOverlay').classList.remove('hidden');

    try {
      // Generate registration code
      state.registrationCode = generateRegistrationCode();

      // Create/find contact
      state.contactRecordId = await findOrCreateContact();

      // Create/find company
      let companyId = null;
      if (state.contactCompany) {
        companyId = await findOrCreateCompany();
      }
      state.companyRecordId = companyId;

      // Create registration in Airtable
      await createAirtableRegistration('Pending Payment');

      // Submit to GHL
      await submitToGoHighLevel('invoice');

      // Show confirmation
      showConfirmationPage('confirm-invoice');

    } catch (error) {
      console.error('Invoice submission error:', error);
      showErrorMessage('Failed to process registration. Please try again.');
    } finally {
      qs('#loadingOverlay').classList.add('hidden');
    }
  }

  async function submitStripeRegistration() {
    hideErrorMessage();
    qs('#loadingOverlay').classList.remove('hidden');

    try {
      // Generate registration code
      state.registrationCode = generateRegistrationCode();

      // Create PaymentIntent
      const intentResponse = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(state.finalPrice * 100),
          email: state.contactEmail,
          description: `${state.program} - ${FORMAT_MAP[state.format]}`,
          metadata: {
            program: state.program,
            format: state.format,
            registrationCode: state.registrationCode
          }
        })
      });

      if (!intentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const intentData = await intentResponse.json();
      state.stripeClientSecret = intentData.clientSecret;
      state.paymentIntentId = intentData.paymentIntentId;

      // Confirm payment with Stripe
      const { error, paymentIntent } = await state.stripe.confirmCardPayment(state.stripeClientSecret, {
        payment_method: {
          card: state.cardElement,
          billing_details: {
            name: `${state.contactFirstName} ${state.contactLastName}`,
            email: state.contactEmail,
            phone: state.contactPhone
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment not completed');
      }

      // Create/find contact
      state.contactRecordId = await findOrCreateContact();

      // Create/find company
      let companyId = null;
      if (state.contactCompany) {
        companyId = await findOrCreateCompany();
      }
      state.companyRecordId = companyId;

      // Create registration in Airtable
      await createAirtableRegistration('Paid');

      // Submit to GHL
      await submitToGoHighLevel('stripe');

      // Show confirmation
      showConfirmationPage('confirm-paid');

    } catch (error) {
      console.error('Stripe submission error:', error);
      showErrorMessage(`Payment failed: ${error.message}`);
    } finally {
      qs('#loadingOverlay').classList.add('hidden');
    }
  }

  async function findOrCreateContact() {
    const filter = `{Email}='${state.contactEmail.replace(/'/g, "\\'")}'`;
    const response = await fetch(`/api/airtable-contacts?filterByFormula=${encodeURIComponent(filter)}`);

    if (!response.ok) {
      throw new Error('Failed to search contacts');
    }

    const data = await response.json();
    if (data.records && data.records.length > 0) {
      return data.records[0].id;
    }

    // Create new contact
    const createResponse = await fetch('/api/airtable-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          'First Name': state.contactFirstName,
          'Last Name': state.contactLastName,
          'Email': state.contactEmail,
          'Phone': state.contactPhone,
          'Job Title': state.contactTitle || ''
        }
      })
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create contact');
    }

    const newContact = await createResponse.json();
    return newContact.id;
  }

  async function findOrCreateCompany() {
    const filter = `LOWER({Company Name})=LOWER('${state.contactCompany.replace(/'/g, "\\'")}')`
    const response = await fetch(`/api/airtable-companies?filterByFormula=${encodeURIComponent(filter)}`);

    if (!response.ok) {
      throw new Error('Failed to search companies');
    }

    const data = await response.json();
    if (data.records && data.records.length > 0) {
      return data.records[0].id;
    }

    // Create new company
    const createResponse = await fetch('/api/airtable-companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          'Company Name': state.contactCompany
        }
      })
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create company');
    }

    const newCompany = await createResponse.json();
    return newCompany.id;
  }

  async function createAirtableRegistration(paymentStatus) {
    // Get UTM tracking data if available
    const trackingData = typeof window.getIAMLTrackingData === 'function'
      ? window.getIAMLTrackingData()
      : {};

    const fields = {
      'Contact': [state.contactRecordId],
      'Company': state.companyRecordId ? [state.companyRecordId] : [],
      'Program Instance': [state.sessionId],
      'Registration Date': new Date().toISOString(),
      'Registration Source': 'Website',
      'List Price': state.listPrice,
      'Discount Amount': state.couponDiscount,
      'Final Price': state.finalPrice,
      'Payment Status': paymentStatus,
      'Payment Method': state.paymentMethod === 'invoice' ? 'Invoice' : 'Credit Card',
      'Registration Status': 'Confirmed'
    };

    // Add tracking fields only if they have values
    if (trackingData.utm_source) fields['UTM Source'] = trackingData.utm_source;
    if (trackingData.utm_medium) fields['UTM Medium'] = trackingData.utm_medium;
    if (trackingData.utm_campaign) fields['UTM Campaign'] = trackingData.utm_campaign;
    if (trackingData.utm_content) fields['UTM Content'] = trackingData.utm_content;
    if (trackingData.utm_term) fields['UTM Term'] = trackingData.utm_term;
    if (trackingData.landing_page) fields['Landing Page'] = trackingData.landing_page;
    if (trackingData.referring_url) fields['Referring URL'] = trackingData.referring_url;

    const response = await fetch('/api/airtable-registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    if (!response.ok) {
      throw new Error('Failed to create registration');
    }

    const registration = await response.json();
    state.registrationRecordId = registration.id;
    return registration;
  }

  async function submitToGoHighLevel(source) {
    // Get dates in YYYY-MM-DD format
    const startDate = state.dynamicStartDate || state.sessionRecord?.fields['Start Date'];
    const endDate = state.dynamicEndDate || state.sessionRecord?.fields['End Date'];

    // Determine location based on format
    let selectedLocation;
    if (state.format === 'in-person') {
      selectedLocation = `${state.city}, ${state.stateProvince}`;
    } else if (state.format === 'virtual') {
      selectedLocation = 'Virtual Classroom';
    } else {
      selectedLocation = 'Online (Self-Paced)';
    }

    const ghlData = {
      type: 'registration',
      data: {
        unique_identifier: crypto.randomUUID(),
        first_name: state.contactFirstName,
        last_name: state.contactLastName,
        title: state.contactTitle || '',
        company_name: state.contactCompany || '',
        phone: state.contactPhone,
        email: state.contactEmail,
        selected_program: state.program,
        program_format: FORMAT_MAP[state.format],
        selected_location: selectedLocation,
        program_start_date: startDate,
        program_end_date: endDate,
        attendance_type__3_block_programs: state.blockSelectionType || 'Full',
        coupon_code_used: state.couponCode || '',
        discount_amount: state.couponDiscount || 0,
        registration_code: state.registrationCode,
        amount_due: state.finalPrice,
        tags: ['new_registration']
      }
    };

    try {
      const response = await fetch('/api/ghl-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ghlData)
      });

      if (!response.ok) {
        console.error('GHL submission failed:', response.status);
        // Don't throw - GHL is async CRM, not critical
      }
    } catch (error) {
      console.error('GHL submission error:', error);
      // Don't throw - continue with confirmation
    }
  }

  // ============================================
  // CONFIRMATION PAGE
  // ============================================

  function showConfirmationPage(type) {
    // Clear UTM tracking data after successful registration
    if (typeof window.clearIAMLTrackingData === 'function') {
      window.clearIAMLTrackingData();
    }

    // Hide all steps
    qsa('.register-step').forEach(el => el.classList.add('hidden'));

    // Show confirmation
    qs(`#step-${type}`).classList.remove('hidden');

    // Update confirmation details
    const programName = state.program;
    const formatDisplay = FORMAT_MAP[state.format].toUpperCase();
    const datesDisplay = formatDateRange(state.dynamicStartDate, state.dynamicEndDate);
    const locationDisplay = state.format === 'in-person'
      ? `${state.city}, ${state.stateProvince}`
      : state.format === 'virtual'
      ? 'Virtual Classroom'
      : 'Online (Self-Paced)';

    if (type === 'confirm-invoice') {
      qs('#confInvoiceProgram').textContent = programName;
      qs('#confInvoiceName').textContent = `${state.contactFirstName} ${state.contactLastName}`;
      qs('#confInvoiceEmail').textContent = state.contactEmail;
      qs('#confInvoiceProgramName').textContent = programName;
      qs('#confInvoiceDates').textContent = datesDisplay;
      qs('#confInvoiceLocation').textContent = locationDisplay;
      qs('#confInvoicePrice').textContent = formatCurrency(state.finalPrice);
      qs('#confInvoiceFormatBadge').textContent = formatDisplay;

      // Hide location for on-demand
      if (state.format === 'on-demand') {
        qs('#confInvoiceLocationRow').style.display = 'none';
      }

      // Add calendar button listener
      const calendarBtn = qs('#downloadCalendarInvoice');
      if (calendarBtn && state.format !== 'on-demand') {
        calendarBtn.addEventListener('click', downloadCalendarInvite);
      } else if (calendarBtn) {
        calendarBtn.style.display = 'none';
      }
    } else {
      qs('#confPaidProgram').textContent = programName;
      qs('#confPaidName').textContent = `${state.contactFirstName} ${state.contactLastName}`;
      qs('#confPaidEmail').textContent = state.contactEmail;
      qs('#confPaidProgramName').textContent = programName;
      qs('#confPaidDates').textContent = datesDisplay;
      qs('#confPaidLocation').textContent = locationDisplay;
      qs('#confPaidPrice').textContent = formatCurrency(state.finalPrice);
      qs('#confPaidFormatBadge').textContent = formatDisplay;

      // Update Step 3 text for on-demand
      if (state.format === 'on-demand') {
        qs('#step3Title').textContent = 'Access Your Materials';
        qs('#step3Description').textContent = 'You\'ll receive access to your recorded course materials in the member portal.';
        qs('#confPaidLocationRow').style.display = 'none';
      }

      // Add calendar button listener
      const calendarBtn = qs('#downloadCalendarPaid');
      if (calendarBtn && state.format !== 'on-demand') {
        calendarBtn.addEventListener('click', downloadCalendarInvite);
      } else if (calendarBtn) {
        calendarBtn.style.display = 'none';
      }
    }

    // Hide navigation
    qs('.register-nav').style.display = 'none';

    // Clear sessionStorage
    clearStateFromSessionStorage();

    // Scroll to top
    window.scrollTo(0, 0);
  }

  // ============================================
  // URL PRE-SELECTION (Deep Linking)
  // ============================================

  // Map block indices (1-based) to actual block names for the program/format
  function mapBlockIndicesToNames(blockIndices, programName, format) {
    const blockData = getBlocksForFormat(programName, format);
    if (!blockData.list || blockData.list.length === 0) return [];

    return blockIndices
      .map(index => blockData.list[index - 1])  // Convert 1-based to 0-based
      .filter(Boolean);  // Remove undefined entries for invalid indices
  }

  // Process URL parameters for pre-selection
  async function processURLPreSelection() {
    const urlParams = parseURLParams();
    const { format, program, session, blocks } = urlParams;

    // Need at minimum format and program
    if (!format || !program) {
      return false;
    }

    // Validate format
    if (!['in-person', 'virtual', 'on-demand'].includes(format)) {
      console.warn('Invalid format parameter:', format);
      return false;
    }

    // Map program slug to full name
    const programName = PROGRAM_SLUG_MAP[program];
    if (!programName) {
      console.warn('Unknown program slug:', program);
      return false;
    }

    // Validate program exists in PROGRAM_DATA
    if (!PROGRAM_DATA[programName]) {
      console.warn('Program not found:', programName);
      return false;
    }

    // Set format and program
    state.format = format;
    state.program = programName;

    // Set initial pricing
    const programData = PROGRAM_DATA[programName];
    state.listPrice = programData.price;
    state.finalPrice = programData.price;

    // Process blocks if provided and applicable
    if (blocks && isBlockProgram(programName, format)) {
      const blockIndices = blocks.split(',').map(b => parseInt(b.trim(), 10)).filter(n => !isNaN(n));
      const blockNames = mapBlockIndicesToNames(blockIndices, programName, format);

      if (blockNames.length > 0) {
        state.blockSelectionType = 'Partial';
        state.selectedBlocks = blockNames;

        // Recalculate pricing for partial attendance
        const blockData = getBlocksForFormat(programName, format);
        const totalBlockPrice = blockNames.reduce((sum, block) =>
          sum + (blockData.prices[block] || 0), 0);
        state.listPrice = totalBlockPrice;
        state.finalPrice = totalBlockPrice;
      }
    } else if (isBlockProgram(programName, format)) {
      // Default to full program for block programs
      state.blockSelectionType = 'Full';
      const blockData = getBlocksForFormat(programName, format);
      state.selectedBlocks = [...blockData.list];
    }

    // Determine steps for this configuration
    state.steps = determineSteps();

    // Handle session pre-selection
    if (session && format !== 'on-demand') {
      // Show loading state
      const loadingOverlay = qs('#loadingOverlay');
      const loadingText = loadingOverlay?.querySelector('p');
      if (loadingText) loadingText.textContent = 'Loading your selection...';
      if (loadingOverlay) loadingOverlay.classList.remove('hidden');

      // Fetch session data
      const sessionRecord = await fetchSessionById(session);

      // Hide loading
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
      if (loadingText) loadingText.textContent = 'Processing your registration...';

      if (sessionRecord && sessionRecord.fields) {
        state.sessionId = session;
        state.sessionRecord = sessionRecord;
        state.city = sessionRecord.fields['City'] || '';
        state.stateProvince = sessionRecord.fields['State/Province'] || '';
        state.venueName = sessionRecord.fields['Venue Name'] || '';

        // Parse block dates if applicable
        if (isBlockProgram(programName, format)) {
          state.blockDates = parseBlockDates(sessionRecord);
          calculateDynamicDates();
        }

        // Fetch program duration (async, non-blocking)
        fetchProgramDuration();

        // All selections complete - skip to contact step
        buildStepperUI();
        showStep('contact');
        state.preselectedFromURL = true;

        // Clear URL params to prevent re-processing on refresh
        clearURLParams();

        return true;
      } else {
        // Session not found - show session step to let user select
        console.warn('Pre-selected session not found:', session);
      }
    }

    // Determine which step to show based on what's pre-selected
    buildStepperUI();

    if (format === 'on-demand') {
      // On-demand: skip to contact step
      showStep('contact');
      state.preselectedFromURL = true;
    } else if (isBlockProgram(programName, format) && !blocks) {
      // Block program without blocks specified: show blocks step
      showStep('blocks');
    } else {
      // Show session step to let user select
      showStep('session');
    }

    // Clear URL params
    clearURLParams();

    return true;
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  async function init() {
    // Initialize Stripe if needed
    if (window.ENV_CONFIG && window.ENV_CONFIG.STRIPE_PUBLISHABLE_KEY) {
      const stripe = Stripe(window.ENV_CONFIG.STRIPE_PUBLISHABLE_KEY);
      state.stripe = stripe;

      // Initialize Stripe Elements
      initializeStripeElements();
    }

    // Check for URL parameters FIRST (deep linking)
    const hasURLPreSelection = await processURLPreSelection();

    // If no URL pre-selection, try to restore from sessionStorage or start fresh
    if (!hasURLPreSelection) {
      const hasState = restoreStateFromSessionStorage();

      if (hasState) {
        state.steps = determineSteps();
        buildStepperUI();
        showStep(state.currentStep);
      } else {
        state.steps = determineSteps();
        buildStepperUI();
        showStep('format');
      }
    }

    setupEventListeners();
    updateLeftPanel();
  }

  // Initialize Stripe Elements
  function initializeStripeElements() {
    if (!state.stripe) return;

    const cardElement = qs('#card-element');
    if (!cardElement) return;

    const elements = state.stripe.elements();
    const cardInput = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      }
    });

    cardInput.mount('#card-element');
    state.cardElement = cardInput;

    // Handle real-time validation errors
    cardInput.on('change', (event) => {
      const cardErrors = qs('#card-errors');
      if (event.error) {
        cardErrors.textContent = event.error.message;
      } else {
        cardErrors.textContent = '';
      }
    });
  }

  // ============================================
  // STARTUP
  // ============================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
