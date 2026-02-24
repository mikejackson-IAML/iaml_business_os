---
name: queue-sales-nav
description: Queue Sales Navigator search URLs for scraping. Accepts single URL, comma-separated URLs, or file path.
---

# Queue Sales Navigator Searches

Add Sales Navigator search URLs to the scraping pipeline. URLs are queued in Supabase and processed by the n8n scraper workflow.

## Usage

```
/queue-sales-nav <url_or_urls> [search_name]
```

**Examples:**
- `/queue-sales-nav https://www.linkedin.com/sales/search/people?query=...` - Single URL
- `/queue-sales-nav https://linkedin.com/sales/search/people?q1, https://linkedin.com/sales/search/people?q2` - Multiple URLs
- `/queue-sales-nav urls.txt` - File with one URL per line
- `/queue-sales-nav https://linkedin.com/sales/search/people?query=... "Marketing Directors Bay Area"` - With search name

---

<instructions>

When the user runs `/queue-sales-nav`:

1. **Parse the arguments:**
   - If the argument is a file path (ends in `.txt` or `.csv`), read the file and extract URLs (one per line)
   - If the argument contains commas, split into multiple URLs
   - Otherwise, treat as a single URL
   - The last quoted string (if present) is the `search_name`
   - If no search name, auto-generate from the URL parameters

2. **Validate each URL:**
   - Must contain `linkedin.com/sales/search` (Sales Navigator search URL)
   - If any URL fails validation, show the error and skip that URL
   - Example error:
     ```
     ✗ Invalid URL: https://linkedin.com/in/johndoe
       Must be a Sales Navigator search URL (contains linkedin.com/sales/search)
     ```

3. **Insert each valid URL** into `sales_nav_searches` using this curl command:
   ```bash
   cd "/Users/mike/IAML Business OS" && source .env.local && curl -s -X POST "${SUPABASE_URL}/rest/v1/sales_nav_searches" \
     -H "apikey: ${SUPABASE_SERVICE_KEY}" \
     -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
     -H "Content-Type: application/json" \
     -H "Prefer: return=representation" \
     -d '{
       "search_url": "{URL}",
       "search_name": "{SEARCH_NAME}",
       "status": "queued",
       "requested_by": "claude_agent",
       "metadata": {}
     }'
   ```

4. **Show confirmation:**
   ```
   Queued {N} Sales Navigator search(es) for scraping:

   1. {search_name} — {url_truncated}
      ID: {id}

   The n8n scraper processes queued searches every 5 minutes.
   Full pipeline: Scrape → Dedupe → Apollo → Hunter.io → NeverBounce → Smartlead + HeyReach
   ```

5. **If no valid URLs found:**
   ```
   ✗ No valid Sales Navigator search URLs provided.

   URLs must contain linkedin.com/sales/search
   Example: https://www.linkedin.com/sales/search/people?query=(...)
   ```

</instructions>
