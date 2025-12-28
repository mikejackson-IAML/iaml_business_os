# Environment Configuration Setup

## Overview

This project uses environment variables to securely manage API keys and webhooks. All sensitive credentials are stored in `js/env-config.local.js`, which is **NOT** committed to git.

## For Local Development

### Step 1: Verify Local Config File Exists
Confirm that `js/env-config.local.js` exists in your project directory. This file should already be created with your API keys.

### Step 2: Verify .gitignore
The `.gitignore` file should include `env-config.local.js` to prevent accidental commits:
```
env-config.local.js
```

### Step 3: Load Environment Config in HTML
All HTML files that use API calls must load the environment configuration. The scripts should be loaded in this order:

```html
<head>
    <!-- ... other head content ... -->

    <!-- Environment Configuration - MUST BE FIRST -->
    <script src="/js/env-config.local.js"></script>

    <!-- Fallback to template if local doesn't exist (for production) -->
    <script>
        if (typeof ENV_CONFIG === 'undefined') {
            document.write('<script src="/js/env-config.js"><\/script>');
        }
    </script>

    <!-- ... other scripts ... -->
</head>
```

### Step 4: Use ENV_CONFIG in JavaScript

Instead of hardcoding API keys:
```javascript
// ❌ DON'T DO THIS
const apiKey = 'pat123456...';
const webhook = 'https://services.leadconnectorhq.com/...';

// ✅ DO THIS
const apiKey = ENV_CONFIG.AIRTABLE_PROGRAMS_API_KEY;
const webhook = ENV_CONFIG.GHL_REGISTRATION_WEBHOOK;
```

## Available Configuration Keys

### Airtable Configuration
- `ENV_CONFIG.AIRTABLE_BASE_ID` - Your Airtable base ID
- `ENV_CONFIG.AIRTABLE_PROGRAMS_API_KEY` - For fetching programs/instructors
- `ENV_CONFIG.AIRTABLE_REGISTRATION_API_KEY` - For registration form submissions
- `ENV_CONFIG.AIRTABLE_NEXT_PROGRAM_API_KEY` - For "Next Program" widget
- `ENV_CONFIG.AIRTABLE_QUIZ_API_KEY` - For quiz functionality

### Airtable Table IDs
- `ENV_CONFIG.AIRTABLE_PROGRAMS_TABLE`
- `ENV_CONFIG.AIRTABLE_COUPONS_TABLE`
- `ENV_CONFIG.AIRTABLE_QUIZ_QUESTIONS_TABLE`
- `ENV_CONFIG.AIRTABLE_QUIZ_ANSWERS_TABLE`
- `ENV_CONFIG.AIRTABLE_QUIZ_RECOMMENDATIONS_TABLE`
- `ENV_CONFIG.AIRTABLE_QUIZ_SESSIONS_TABLE`
- `ENV_CONFIG.AIRTABLE_VIEW_ID`

### GoHighLevel Webhooks
- `ENV_CONFIG.GHL_REGISTRATION_WEBHOOK` - For registration form submissions
- `ENV_CONFIG.GHL_CONTACT_WEBHOOK` - For contact/inquiry form submissions

### Google Analytics
- `ENV_CONFIG.GA4_ID` - Your Google Analytics 4 ID

## For Production Deployment

### GitHub Pages
GitHub Pages cannot load local JavaScript files with secrets. Instead:

1. **Option 1: Use Netlify or Vercel**
   - These platforms support environment variables
   - Add `env-config.local.js` as an environment variable
   - The deployment process will inject it

2. **Option 2: Backend Proxy (Recommended)**
   - Create serverless functions to handle API calls
   - Store secrets as environment variables on the function platform
   - Frontend calls your proxy, proxy calls Airtable
   - This keeps keys completely hidden from browsers

3. **Option 3: Airtable Native Forms**
   - Use Airtable's built-in web forms where possible
   - Eliminates need for direct API access

## Security Best Practices

### ✅ DO:
- Keep `env-config.local.js` secret and local-only
- Regenerate API keys immediately if they're exposed
- Use environment variables on your hosting platform
- Use HTTPS for all API communications
- Rotate API keys regularly

### ❌ DON'T:
- Commit `env-config.local.js` to git
- Share API keys in Slack, email, or chat
- Hard-code API keys in any tracked files
- Log API keys to console in production
- Use the same API key across multiple projects

## If API Keys Are Exposed

### Immediate Actions:
1. **Delete this file**: `js/env-config.local.js`
2. **Revoke keys in Airtable**:
   - Go to Airtable Account Settings → Personal Access Tokens
   - Delete all exposed tokens immediately
3. **Revoke webhooks in GoHighLevel**:
   - Go to GoHighLevel Integrations
   - Delete or regenerate exposed webhooks
4. **Generate new keys**:
   - Create new Personal Access Tokens in Airtable
   - Create new webhooks in GoHighLevel
5. **Update local config**:
   - Recreate `js/env-config.local.js` with new values
6. **Force push to GitHub** (if secrets were committed):
   - Use BFG Repo-Cleaner to remove from history
   - Or recreate the repository without the secrets

## Troubleshooting

### ENV_CONFIG is undefined
- Check that `env-config.local.js` is loaded BEFORE any code that uses it
- Verify the file path is correct: `/js/env-config.local.js`
- Check browser console for JavaScript errors

### API calls are failing
- Verify the API keys in `env-config.local.js` are correct
- Check that Airtable Base ID matches your setup
- Verify webhook URLs haven't changed
- Check browser Network tab for actual error responses

### File not loading
- Ensure `env-config.local.js` exists in the `/js/` directory
- Verify `.gitignore` has `env-config.local.js` (to prevent accidental commits)
- Check file permissions allow reading

## Files Modified for This Setup

- `.gitignore` - Added `env-config.local.js` and `code`
- `js/env-config.js` - Enhanced template with all required keys
- `js/env-config.local.js` - NEW: Contains your actual secrets (gitignored)
- `programs/employee-relations-law.html` - Updated to use ENV_CONFIG
- `js/modals.js` - Updated to use ENV_CONFIG
- `components/header.html` - Updated to use ENV_CONFIG
- `index.html` - Updated to load env-config
- `code` - DELETED: Contained exposed secrets

## Need Help?

Check these files for usage examples:
- `/components/quiz-section.html` - Example of ENV_CONFIG usage
- `/components/registration-modal.html` - Example of ENV_CONFIG usage
