# Program Page Setup Guide

**Quick reference for creating new program detail pages with Airtable integration.**

---

## Overview

All program pages follow the same standardized architecture:
- **Configuration section** with Airtable table/view IDs
- **Fetch functions** to pull program data from Airtable
- **Render functions** to display the data
- **Event handlers** for interactivity

This guide shows you the exact pattern to follow for any new program page.

---

## Step 1: Create Your Airtable View

In your Airtable base, create a new view that filters programs by your specific program type:

**Example:** For "Employee Relations Law" programs
- Base: IAML Program Database
- Table: Programs & Sessions
- Create a view that filters: `{Program} = "Certificate in Employee Relations Law"`

**Result:** You'll get a `viewID` like `viwX4En7WerGZSPCO`

---

## Step 2: Add Configuration

In your HTML file, find the `CONFIG` object (around line 3510-3530).

Add your program configuration following this pattern:

```javascript
const CONFIG = {
  AIRTABLE: {
    PROGRAMS_TABLE: 'tblFaya3JyTzyAdjJ',        // Same for all pages

    // YOUR PROGRAM VIEW (replace with your viewID)
    YOUR_PROGRAM_VIEW: 'viwXXXXXXXXXXXXXX',     // <-- Your view ID here

    // YOUR PROGRAM ENDPOINT (getter method)
    get YOUR_PROGRAM_ENDPOINT() {
      return `/api/airtable-programs?table=${encodeURIComponent(this.PROGRAMS_TABLE)}&view=${encodeURIComponent(this.YOUR_PROGRAM_VIEW)}`;
    },

    INSTRUCTORS_TABLE: 'Instructors',
    get INSTRUCTORS_ENDPOINT(){
      return `/api/airtable-programs?table=${encodeURIComponent(this.INSTRUCTORS_TABLE)}`;
    }
  },

  // YOUR_PROGRAM_DATA array to store fetched programs
  YOUR_PROGRAM_DATA: [],

  INSTRUCTORS_DATA: { byName:{}, byId:{} },

  // Other config as needed
  isLoading: false
};
```

**Example for Employee Relations Law:**
```javascript
EMPLOYEE_RELATIONS_VIEW: 'viwX4En7WerGZSPCO',
get EMPLOYEE_RELATIONS_ENDPOINT() {
  return `/api/airtable-programs?table=${encodeURIComponent(this.PROGRAMS_TABLE)}&view=${encodeURIComponent(this.EMPLOYEE_RELATIONS_VIEW)}`;
},
EMPLOYEE_RELATIONS_DATA: [],
```

---

## Step 3: Create Fetch Function

Add this function after the `buildAirtableUrl()` helper. Copy and customize the pattern from `fetchProgramsData()`:

```javascript
async function fetch[YourProgramName]Data() {
  const headers = { 'Content-Type': 'application/json' };
  let allRecords = [];
  let offset = null;

  console.log('Fetching [YourProgramName] programs...');

  do {
    const params = {
      'sort[0][field]': 'Session Start Date',
      'sort[0][direction]': 'asc',
      'pageSize': 100
    };

    if (offset) {
      params.offset = offset;
    }

    const url = buildAirtableUrl(CONFIG.AIRTABLE.YOUR_PROGRAM_ENDPOINT, params);

    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Batch received, records count:', data.records?.length || 0);

    allRecords = allRecords.concat(data.records);
    offset = data.offset;
  } while (offset);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const programs = allRecords
    .map(record => {
      try {
        const f = record.fields;
        const detectedFormat = determineProgramType(f);

        const safeString = (value) => {
          if (!value) return '';
          if (Array.isArray(value)) return value[0] || '';
          return String(value);
        };

        return {
          id: record.id,
          program: safeString(f.Program),
          format: detectedFormat,
          startDate: f['Session Start Date'] || null,
          endDate: f['Session End Date'] || null,
          city: safeString(f.City),
          state: safeString(f.State),
          venueName: safeString(f['Venue Name (1)']),
          heroImageUrl: normalizeImageFromFields(f),
          block1Instructor: safeString(f['Block 1 Instructor (from Instructors)']),
          block2Instructor: safeString(f['Block 2 Instructor (from Instructors)']),
          block3Instructor: safeString(f['Block 3 Instructor (from Instructors)']),
          price: (() => {
            const raw = f['Program Pricing'];
            const num = Number(String(raw).replace(/[^\d.]/g,'') || 0);
            return num || undefined;
          })()
        };
      } catch (error) {
        console.error('Error mapping record:', error);
        return null;
      }
    })
    .filter(program => program !== null)
    .filter(program => {
      // Filter out past programs - only show programs that haven't STARTED yet
      if (!program.startDate) {
        return true; // Keep programs with no start date
      }

      let startDate;
      try {
        if (program.startDate.includes('-')) {
          startDate = new Date(program.startDate + 'T00:00:00');
        } else {
          startDate = new Date(program.startDate);
        }
      } catch (e) {
        console.warn('Could not parse start date:', program.startDate);
        return true;
      }

      // Only show programs that START in the future
      return startDate > today;
    });

  console.log(`[YourProgramName] fetch completed: ${programs.length} programs`);
  return programs;
}
```

---

## Step 4: Create Render Function

Add a function to render your programs. Start with the simplest version and enhance as needed:

```javascript
function render[YourProgramName]Programs() {
  const container = document.querySelector('#your-programs-container');
  if (!container) {
    console.warn('Container not found');
    return;
  }

  const programs = CONFIG.YOUR_PROGRAM_DATA;

  if (programs.length === 0) {
    container.innerHTML = '<p>No programs available at this time.</p>';
    return;
  }

  // Build HTML for programs
  const html = programs.map(program => `
    <div class="program-card">
      <div class="program-image">
        <img src="${program.heroImageUrl}" alt="${program.program}">
      </div>
      <div class="program-info">
        <h3>${program.program}</h3>
        <p class="location">${program.city}, ${program.state}</p>
        <p class="date">${program.startDate}</p>
        <p class="format">${program.format}</p>
        ${program.price ? `<p class="price">$${program.price}</p>` : ''}
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
}
```

---

## Step 5: Call in loadData()

Find your `loadData()` function and add your fetch function to the Promise.all:

```javascript
async function loadData() {
  CONFIG.isLoading = true;

  try {
    const [
      programs,
      instructors,
      yourPrograms  // <-- ADD THIS
    ] = await Promise.all([
      fetchProgramsData().catch(err => {
        console.error('Programs fetch error:', err);
        return [];
      }),
      fetchInstructorsData().catch(err => {
        console.error('Instructors fetch error:', err);
        return { byName: {}, byId: {} };
      }),
      fetch[YourProgramName]Data().catch(err => {  // <-- ADD THIS
        console.error('[YourProgramName] fetch error:', err);
        return [];
      })
    ]);

    CONFIG.PROGRAMS_DATA = programs;
    CONFIG.INSTRUCTORS_DATA = instructors;
    CONFIG.YOUR_PROGRAM_DATA = yourPrograms;  // <-- ADD THIS

    render[YourProgramName]Programs();  // <-- ADD THIS

    CONFIG.isLoading = false;
  } catch (error) {
    console.error('Data loading failed:', error);
    CONFIG.isLoading = false;
  }
}
```

---

## Step 6: HTML Structure

Make sure your HTML has the container element:

```html
<div id="your-programs-container" class="programs-grid">
  <!-- Programs will be rendered here -->
</div>
```

---

## Complete Example: Employee Relations Law Page

Here's what was implemented for `employee-relations-law.html`:

### Configuration
```javascript
EMPLOYEE_RELATIONS_VIEW: 'viwX4En7WerGZSPCO',
get EMPLOYEE_RELATIONS_ENDPOINT() {
  return `/api/airtable-programs?table=${encodeURIComponent(this.PROGRAMS_TABLE)}&view=${encodeURIComponent(this.EMPLOYEE_RELATIONS_VIEW)}`;
},
EMPLOYEE_RELATIONS_DATA: [],
```

### Fetch Function
- Named: `fetchProgramsData()`
- Pulls from: `CONFIG.AIRTABLE.PROGRAMS_ENDPOINT`
- Stores in: `CONFIG.PROGRAMS_DATA`

### Render Function
- Named: `generateSessionCards()`
- Reads from: `CONFIG.PROGRAMS_DATA`, `CONFIG.VIRTUAL_COMPONENTS`
- Updates: Multiple sections (In-Person, Virtual, On-Demand)

### Data Loading
- Called in `loadData()` as part of Promise.all
- Results stored in CONFIG
- Render function called after successful fetch

---

## File Structure Reference

**Location of key code sections in employee-relations-law.html:**

| Component | Lines | Details |
|-----------|-------|---------|
| CONFIG object | 3510-3530 | Airtable table/view IDs, endpoints, data storage |
| buildAirtableUrl() | 3491-3505 | URL builder (don't modify) |
| fetchProgramsData() | ~3540-3941 | Example fetch function for In-Person programs |
| fetchVirtualComponents() | ~3955-4037 | Example fetch function for Virtual component programs |
| fetchInstructorsData() | ~4053-4095 | Instructor fetch function |
| loadData() | ~4254-4285 | Orchestrates all fetches via Promise.all |
| generateSessionCards() | ~4300-4600+ | Main render function (complex example) |

---

## Checklist for New Program Page

When adding a new program page, follow this checklist:

- [ ] Create Airtable view filtering for your program type
- [ ] Get the viewID from the view settings
- [ ] Add `YOUR_PROGRAM_VIEW` to CONFIG.AIRTABLE
- [ ] Add `YOUR_PROGRAM_ENDPOINT` getter to CONFIG.AIRTABLE
- [ ] Add `YOUR_PROGRAM_DATA: []` to CONFIG
- [ ] Create `fetch[YourProgramName]Data()` function
- [ ] Create `render[YourProgramName]Programs()` function (or enhance existing)
- [ ] Add fetch call to `loadData()` Promise.all
- [ ] Store result in `CONFIG.YOUR_PROGRAM_DATA`
- [ ] Call render function after data loaded
- [ ] Add HTML container with appropriate ID
- [ ] Test in browser - check console for errors
- [ ] Verify programs display with correct filtering (future dates only)
- [ ] Test responsiveness on mobile and desktop

---

## Troubleshooting

### Programs not displaying
1. Check console for API errors
2. Verify viewID is correct in CONFIG
3. Ensure Airtable view has the right filter
4. Check that fetch function is called in loadData()

### Wrong programs showing
1. Verify the Airtable view filter is correct
2. Check that view is filtering by program name correctly
3. Look at the API response in Network tab

### Blank fields in program cards
1. Check field names in Airtable match your mapping
2. Use `safeString()` helper to handle missing values
3. Add fallback values in render function

### Date filtering not working
1. Verify date format in Airtable (ISO format: YYYY-MM-DD)
2. Check that `today` variable is defined in fetch function
3. Ensure `startDate > today` logic is used (not `>=`)

---

## API Reference

### Airtable Proxy Endpoint
- **Base URL:** `/api/airtable-programs`
- **Query Parameters:**
  - `table` (required): Table ID from Airtable
  - `view` (required): View ID from Airtable
  - `sort[0][field]`: Field name to sort by
  - `sort[0][direction]`: 'asc' or 'desc'
  - `pageSize`: Records per page (max 100)
  - `offset`: For pagination

### Field Names to Expect
From the Programs & Sessions table:
- `Program`: Program name
- `Session Start Date`: ISO date format (YYYY-MM-DD)
- `Session End Date`: ISO date format (YYYY-MM-DD)
- `City`, `State`: Location
- `Venue Name (1)`: Venue name
- `Program Pricing`: Dollar amount
- `Hero Image`: Image URL
- `Block 1 Instructor (from Instructors)`: Instructor name (linked field)
- `Block 2 Instructor (from Instructors)`: Instructor name
- `Block 3 Instructor (from Instructors)`: Instructor name
- `Format`: 'In-Person', 'Virtual', 'On-Demand', etc.

---

## Quick Start Template

Copy this when creating a new program page:

```javascript
// CONFIG
YOUR_PROGRAM_VIEW: 'viwXXXXXXXXXXXXXX',  // <-- Replace with your viewID
get YOUR_PROGRAM_ENDPOINT() {
  return `/api/airtable-programs?table=${encodeURIComponent(this.PROGRAMS_TABLE)}&view=${encodeURIComponent(this.YOUR_PROGRAM_VIEW)}`;
},
YOUR_PROGRAM_DATA: [],

// FETCH FUNCTION - Copy from template above, replace placeholders
// RENDER FUNCTION - Copy from template above, replace placeholders

// In loadData(), add to Promise.all:
fetch[YourProgramName]Data().catch(err => {
  console.error('[YourProgramName] fetch error:', err);
  return [];
})

// Store result:
CONFIG.YOUR_PROGRAM_DATA = yourPrograms;

// Call render:
render[YourProgramName]Programs();
```

---

## Questions?

Refer back to the actual implementation in `employee-relations-law.html` for the full working example of this pattern.
