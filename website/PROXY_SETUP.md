# Local Airtable Proxy Setup

This proxy allows you to test the faculty integration locally without deploying to production.

## How It Works

1. **Local Proxy Server** (port 3001) - Handles Airtable API requests
2. **Development Server** (port 8000) - Your local website
3. **Faculty Module** - Automatically detects `localhost` and routes requests to the proxy

## Quick Start

### Terminal 1: Start the Proxy

```bash
cd /Users/mikejackson/Documents/IAML
node local-proxy.js
```

You should see:
```
=================================
🚀 Local Airtable Proxy Running
=================================
Port: 3001
Base ID: [your-base-id]

Ready to handle faculty requests!
```

### Terminal 2: Start Your Development Server

```bash
# Keep your existing dev server running on port 8000
python -m http.server 8000
# or whatever command you use
```

### Terminal 3: View the Site

Open http://localhost:8000 in your browser and navigate to a program page:
- http://localhost:8000/programs/strategic-hr-leadership.html
- http://localhost:8000/programs/employee-relations-law.html

## What to Look For

### Success Indicators

✓ Faculty cards load from Airtable with randomized order
✓ Console shows: `Loaded X faculty members for [program-slug]`
✓ No 404 errors in the Network tab
✓ Title shows as "Title, Organization" format

### Debugging

**Faculty not showing?**
- Check browser console for errors
- Look at Network tab to see if API calls succeed
- Verify proxy is running and shows request logs

**404 errors in proxy logs?**
- Confirm PROGRAMS table has "Slug" field with correct values
- Verify faculty are linked to programs in the "PROGRAMS (Faculty)" field
- Check .env.local has correct AIRTABLE_PROGRAMS_API_KEY

**Slow loads?**
- Proxy logs should show response times
- If Airtable is slow, it will delay the requests

## How Faculty Integration Uses the Proxy

1. Page loads: `faculty.js` runs `initializeFaculty()`
2. Detects `window.location.hostname === 'localhost'`
3. Routes to: `http://localhost:3001/api/airtable-programs`
4. Proxy makes actual Airtable API call with your credentials
5. Returns faculty data to the page

## Environment Variables

Make sure your `.env.local` has:

```
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_PROGRAMS_API_KEY=your_api_key
```

The proxy reads these from `.env.local` on startup.

## Production vs Development

- **Development (localhost)** → Routes through proxy on port 3001
- **Production (deployed)** → Uses `/api/airtable-programs` serverless function

No code changes needed—the faculty module automatically detects which environment it's in.

## Stopping the Proxy

Press `Ctrl+C` in the terminal running the proxy.

The development server on port 8000 will continue running and pages will still load, but Airtable API calls will fail (showing the static HTML fallback).

## Troubleshooting

### Proxy won't start
```
✗ Error loading .env.local: ENOENT
```
→ Create `.env.local` in the root of your IAML project with the environment variables

### Airtable API errors
```
✗ Airtable request failed: 401
```
→ Check that AIRTABLE_PROGRAMS_API_KEY is correct in `.env.local`

### Faculty still don't load
1. Check proxy console logs (should show request being proxied)
2. Check browser Network tab for the `/api/airtable-programs` request
3. Check browser Console for JavaScript errors
4. Verify PROGRAMS table has Slug field populated
5. Verify Faculty are linked to programs in PROGRAMS (Faculty) field

## Next Steps

Once you confirm faculty load correctly with the proxy, you can:

1. Test randomization by refreshing multiple times
2. Verify 3-line bio truncation works
3. Test on mobile/tablet/desktop
4. Test with JavaScript disabled (should show static fallback)
5. Deploy to Vercel/Netlify for production
