# Company Enrichment Waterfall Workflow

Automatically enriches company records in Airtable using a waterfall approach: Apollo (primary) → Exa (fallback) → marks as failed if no data found.

## Quick Start

1. Add required fields to Airtable (see below)
2. Import workflow into n8n
3. Configure API credentials
4. Run manually or enable scheduled trigger

---

## Airtable Schema Setup

Add these 4 fields to your COMPANIES table (`tbl90HikZUp0GEkKZ`):

| Field Name | Field Type | Options |
|------------|------------|---------|
| **Enrichment Source** | Single Select | `apollo`, `exa`, `firecrawl`, `manual`, `mixed` |
| **Enrichment Status** | Single Select | `pending`, `complete`, `partial`, `failed` |
| **Enriched Date** | Date (include time) | - |
| **Enrichment Notes** | Long Text | - |

### How to add fields in Airtable:
1. Go to your COMPANIES table
2. Click the `+` at the end of the header row
3. Select the appropriate field type
4. For Single Select fields, add the options listed above

---

## n8n Setup

### Step 1: Import the Workflow

1. Open n8n at https://n8n.realtyamp.ai
2. Click **Workflows** → **Import from File**
3. Select `n8n-workflows/company-enrichment-waterfall.json`
4. Click **Import**

### Step 2: Configure Credentials

You need to set up 3 credentials in n8n:

#### Airtable API
1. Go to **Credentials** → **New Credential**
2. Search for "Airtable"
3. Select "Airtable Personal Access Token"
4. Enter your Airtable API key: `${AIRTABLE_API_KEY}`

#### Apollo API (Header Auth)
1. Go to **Credentials** → **New Credential**
2. Search for "Header Auth"
3. Name it "Apollo API"
4. Set:
   - **Name**: `x-api-key`
   - **Value**: Your Apollo API key

#### Exa API (Header Auth)
1. Go to **Credentials** → **New Credential**
2. Search for "Header Auth"
3. Name it "Exa API"
4. Set:
   - **Name**: `x-api-key`
   - **Value**: Your Exa API key

### Step 3: Update Workflow Nodes

After importing, update these nodes with your credentials:

1. **Get Companies to Enrich** - Select your Airtable credential
2. **Apollo - Search Company** - Select your Apollo API credential
3. **Exa - Semantic Search** - Select your Exa API credential
4. **Update Airtable Record** - Select your Airtable credential

### Step 4: Configure Airtable Update Fields

The **Update Airtable Record** node needs field mapping:

1. Click the node
2. Under "Columns to Match On", select **id**
3. Under "Fields to Send", add mappings:
   - Map `fieldsToUpdate.Company Domain` → `Company Domain`
   - Map `fieldsToUpdate.Industry` → `Industry`
   - Map `fieldsToUpdate.Company Size` → `Company Size`
   - Map `fieldsToUpdate.Employee Count` → `Employee Count`
   - Map `fieldsToUpdate.Main Phone` → `Main Phone`
   - Map `fieldsToUpdate.Address` → `Address`
   - Map `fieldsToUpdate.City` → `City`
   - Map `fieldsToUpdate.State` → `State`
   - Map `fieldsToUpdate.Country` → `Country`
   - Map `fieldsToUpdate.LinkedIn URL` → `LinkedIn URL`
   - Map `fieldsToUpdate.Website` → `Website`
   - Map `fieldsToUpdate.Enrichment Source` → `Enrichment Source`
   - Map `fieldsToUpdate.Enrichment Status` → `Enrichment Status`
   - Map `fieldsToUpdate.Enriched Date` → `Enriched Date`
   - Map `fieldsToUpdate.Enrichment Notes` → `Enrichment Notes`

---

## How It Works

### Waterfall Logic

```
Company Record (Enrichment Status = empty or "pending")
          ↓
    ┌─────────────┐
    │   APOLLO    │  Search by company name
    │  (Primary)  │  Returns: domain, size, industry, contact info
    └─────────────┘
          ↓
      Found? ──Yes──→ Update Airtable (source: apollo)
          │
         No
          ↓
    ┌─────────────┐
    │     EXA     │  Semantic search for company website
    │ (Secondary) │  Returns: domain, website, LinkedIn
    └─────────────┘
          ↓
      Found? ──Yes──→ Update Airtable (source: exa)
          │
         No
          ↓
    Update Airtable (status: failed)
```

### Enrichment Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Ready to be enriched |
| `complete` | Key fields (domain, industry, employee count) found |
| `partial` | Some data found but missing key fields |
| `failed` | No data found from any source |

---

## Running the Workflow

### Manual Run
1. Open the workflow in n8n
2. Click **Execute Workflow**
3. It will process all records with empty or "pending" Enrichment Status

### Scheduled Run
1. The workflow includes a disabled "Run Every Hour" trigger
2. To enable: click the trigger node → toggle **Active** on
3. Activate the workflow (toggle in top right)

### Trigger New Records Only
To only enrich newly added records:
1. Set `Enrichment Status` to "pending" when creating new records
2. The workflow filter will pick them up automatically

---

## API Rate Limits

Be aware of rate limits:

| API | Rate Limit | Notes |
|-----|------------|-------|
| Apollo | 100 requests/min | Free tier has monthly limits |
| Exa | 1000 requests/month (free) | Consider paid tier for volume |
| Airtable | 5 requests/sec | Built-in batch processing helps |

The workflow processes one record at a time to respect rate limits.

---

## Troubleshooting

### No data returned from Apollo
- Verify API key is correct
- Check Apollo dashboard for remaining credits
- Company name might be too generic - try adding location

### Exa returns wrong company
- The semantic search tries to filter out social/directory sites
- Very common company names may match wrong entities
- Consider manual review for partial matches

### Airtable update fails
- Check that all field names match exactly (case-sensitive)
- Verify the record ID is being passed correctly
- Check Airtable API key permissions

### Workflow not triggering
- Ensure the schedule trigger is enabled
- Verify workflow is activated (toggle in top right)
- Check that records have empty or "pending" Enrichment Status

---

## Extending the Workflow

### Add Firecrawl for Website Scraping
To add website scraping after finding a domain:

1. Add HTTP Request node after the merge
2. Configure Firecrawl API call to scrape the company website
3. Extract contact info from the scraped content
4. Merge with existing enrichment data

### Add Email Validation
Integrate with NeverBounce (you have an MCP server for this):

1. Add a Code node to check if Main Email was enriched
2. Call NeverBounce API to validate
3. Add an "Email Valid" boolean field to track

---

## Files

- **Workflow JSON**: `n8n-workflows/company-enrichment-waterfall.json`
- **Documentation**: `docs/company-enrichment-workflow.md`
- **Airtable Base**: `applWPVmMkgMWoZIC`
- **Airtable Table**: `tbl90HikZUp0GEkKZ`
