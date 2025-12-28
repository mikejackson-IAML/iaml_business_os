# Migration Plan: Frontend API Calls to Serverless Proxies

## Objective
Migrate all direct Airtable API calls from frontend components to use serverless proxy endpoints. This removes the need for loading API keys into the browser and eliminates the env-config loading requirement.

## Current State
- **3 components** with direct API calls to `https://api.airtable.com/v0/`
- **1 program page** with direct API calls
- API keys loaded via `env-config.local.js` in browser
- Multiple `airtableList()` and direct fetch functions making authenticated requests

## Target State
- All API calls route through `/api/airtable-*` serverless proxies
- No API keys in frontend code
- No env-config loading needed (or removed from HTML)
- Same functionality with improved security

## Existing Proxy Endpoints
1. `/api/airtable-programs.js` - Handles GET requests for programs, sessions, instructors
   - Supports: `table`, `recordId`, `filterByFormula`, `maxRecords`, `view`, `sort`
   - Uses: `AIRTABLE_PROGRAMS_API_KEY`

2. `/api/airtable-quiz.js` - Handles GET, POST, PATCH for quiz data
   - Supports: `table`, `recordId`, `filterByFormula`, `maxRecords`, `view`, `pageSize`, `offset`
   - Methods: GET, POST, PATCH
   - Uses: `AIRTABLE_QUIZ_API_KEY`

3. `/api/airtable-coupons.js` - Handles coupon lookups
   - Supports: GET requests with filters
   - Uses: Different API key

## Components to Migrate

### 1. components/registration-modal.html
**Current API Calls:**
- `airtableList()` function (line 1983) - GET requests to Sessions and Coupons tables
- Direct PATCH call (line 2104) - Updates session registration
- Direct fetch with Authorization header (line 3295) - Gets session by recordId

**Tables Used:**
- TABLE_SESSIONS (tblzXcIgwisfko0WC)
- TABLE_COUPONS (tblBaUQKmYuIMsVQm)

**API Key Used:**
- AIRTABLE_REGISTRATION_API_KEY

**Strategy:**
1. Replace all `airtableList()` calls with `/api/airtable-quiz` proxy calls
2. Replace PATCH call with proxy (may need to check if proxy supports PATCH)
3. Replace direct fetch with proxy call
4. Remove AIRTABLE_API_KEY variable initialization

### 2. components/quiz-section.html
**Current API Calls:**
- Direct fetch calls for quiz questions (line 957)
- Direct fetch calls for creating/updating sessions (lines 894, 914, 941)
- Multiple POST/PATCH requests to Airtable

**Tables Used:**
- Quiz Questions, Answers, Sessions, Recommendations tables

**API Key Used:**
- AIRTABLE_CONFIG.apiKey (AIRTABLE_QUIZ_API_KEY)

**Strategy:**
1. Replace all fetch calls to `AIRTABLE_CONFIG.apiUrl` with `/api/airtable-quiz` calls
2. Maintain same method (POST, PATCH, GET) - proxy supports all
3. Remove direct Authorization header usage
4. Simplify endpoint URL construction

### 3. programs/employee-relations-law.html
**Current API Calls:**
- Direct fetch to get session by recordId (lines 6710-6711)

**Tables Used:**
- TABLE_SESSIONS

**API Key Used:**
- AIRTABLE_REGISTRATION_API_KEY

**Strategy:**
1. Replace with `/api/airtable-quiz` proxy call
2. Pass recordId as query parameter
3. Remove direct Authorization header

## Implementation Steps

### Step 1: Create Proxy Support for Registration Modal API Key
**Issue:** registration-modal.html uses AIRTABLE_REGISTRATION_API_KEY, but no existing proxy uses it.

**Solution Options:**
A. Create new `/api/airtable-registration.js` proxy
B. Reuse `/api/airtable-quiz.js` (since both use AIRTABLE_QUIZ_API_KEY? Check if same)
C. Extend `/api/airtable-programs.js` to accept API_KEY parameter

**Recommended:** Check if AIRTABLE_REGISTRATION_API_KEY and AIRTABLE_QUIZ_API_KEY are the same token. If yes, reuse `/api/airtable-quiz.js`. If no, extend quiz proxy to support both.

### Step 2: Migrate registration-modal.html
1. Remove `AIRTABLE_API_KEY` variable initialization
2. Replace `airtableList()` function with proxy calls:
   ```javascript
   // OLD:
   const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });

   // NEW:
   const res = await fetch('/api/airtable-quiz?table=TABLE_SESSIONS&recordId=xyz...');
   ```
3. Replace PATCH calls with proxy
4. Test all registration flows

### Step 3: Migrate quiz-section.html
1. Remove AIRTABLE_CONFIG.apiUrl and apiKey references
2. Replace all fetch calls:
   ```javascript
   // OLD:
   const url = `${AIRTABLE_CONFIG.apiUrl}/${AIRTABLE_CONFIG.baseId}/${AIRTABLE_CONFIG.tablesById.sessions}`;
   const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}` } });

   // NEW:
   const resp = await fetch('/api/airtable-quiz?table=tblzXcIgwisfko0WC', {
     method: 'POST',
     body: JSON.stringify({ fields: {...} })
   });
   ```
3. Test all quiz flows

### Step 4: Migrate programs/employee-relations-law.html
1. Replace single API call with proxy
2. Remove API key variable
3. Test session retrieval

### Step 5: Remove env-config Loading
1. Remove from `index.html:36-40`
2. Remove from `programs/employee-relations-law.html:36-40`
3. Keep `js/env-config.local.js` (gitignored) for backward compatibility
4. Verify all functionality works

## Key Considerations

1. **API Key Routing:** Ensure proxies use correct API key for each operation
   - Registration/Sessions: AIRTABLE_REGISTRATION_API_KEY
   - Quiz: AIRTABLE_QUIZ_API_KEY
   - Programs: AIRTABLE_PROGRAMS_API_KEY

2. **Sort Parameter:** Current proxy uses `sort[0][field]`, registration uses array of sort objects
   - May need to adjust registration calls or extend proxy

3. **Batch Operations:** Check if any components do batch operations
   - Quiz proxy supports `records` array for batch operations

4. **Error Handling:** Frontend currently has error handling, maintain it

5. **Testing:** Must verify:
   - All registration flows work
   - All quiz flows work
   - Session tracking works
   - No console errors
   - Network requests go through proxies

## Commit Strategy
- One commit per component migration + testing
- Final commit to remove env-config loading
- Clear commit messages explaining what was migrated

## Success Criteria
✓ No direct API calls to `api.airtable.com` from frontend
✓ No API keys in frontend code
✓ All functionality preserved
✓ env-config loading removed from HTML
✓ No console errors
✓ Tests pass
