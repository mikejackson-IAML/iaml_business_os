# Meeting Prep Feature Setup

This document covers setup for the meeting prep functionality, including required MCP servers and configuration.

## Quick Start

The meeting prep command is ready to use:
```
/meeting-prep "Company Name"
/meeting-prep "Company Name" "Contact Name"
```

The meeting prep builder skill helps configure custom meeting prep:
```
Use the meeting-prep-builder skill when you need to customize meeting prep for a new situation.
```

---

## Required MCP Servers

The meeting prep feature uses these MCP servers (in priority order):

### Core Research (Highly Recommended)

#### 1. Apollo.io - Company & Person Enrichment
Already configured in your MCP setup. Provides:
- Company enrichment (industry, size, revenue, tech stack)
- Person enrichment (title, tenure, LinkedIn)
- News articles about companies
- Job postings

#### 2. Perplexity - AI-Powered Research
Already configured. Provides:
- Real-time company news
- Industry trends
- Deep research on specific topics

#### 3. GoHighLevel - CRM History
Already configured. Provides:
- Prior contact history
- Previous conversations
- Existing relationship context

#### 4. Airtable - Internal Records
Already configured. Provides:
- Past program registrations
- Previous attendees from the company
- Historical relationship data

### Enhanced Research (Optional)

#### 5. LinkedIn MCP - Direct LinkedIn Access
**Not yet configured.** Add this to enable:
- Direct profile scraping
- Company page data
- Job postings
- Connection information

**To add LinkedIn MCP:**

Add this to your `.mcp.json` file:

```json
{
  "linkedin": {
    "command": "uvx",
    "args": ["--from", "git+https://github.com/stickerdaniel/linkedin-mcp-server", "linkedin-mcp-server"],
    "env": {
      "LI_AT_COOKIE": "${LINKEDIN_LI_AT_COOKIE}"
    }
  }
}
```

**Getting the LinkedIn Cookie:**
1. Log into LinkedIn in Chrome
2. Open DevTools (F12) → Application → Cookies → linkedin.com
3. Find the `li_at` cookie and copy its value
4. Store in your environment: `LINKEDIN_LI_AT_COOKIE=your_cookie_value`

**Note:** The cookie expires every 30 days and needs refresh.

#### 6. Firecrawl - Website Scraping
Already configured. Provides:
- Careers page scraping (HR job signals)
- About page content
- Any public web content

#### 7. Exa - Semantic Search
Already configured. Provides:
- Semantic search for company + topics
- Press release discovery
- Content matching

#### 8. Brave Search - Web Search
Already configured. Provides:
- General web search fallback
- News search
- Current information

---

## Usage Patterns

### Pattern 1: Quick Discovery Prep
```
/meeting-prep "Acme Corporation"
```
Generates a 5-minute brief with company research, questions, and program recommendations.

### Pattern 2: Full Discovery Prep with Contact
```
/meeting-prep "Acme Corporation" "Jane Smith"
```
Adds contact research including LinkedIn profile, title, tenure, and rapport builders.

### Pattern 3: Custom Meeting Prep
1. Use the `meeting-prep-builder` skill
2. Answer the configuration questions
3. Generate a custom template for your meeting type
4. Optionally save as a new command for reuse

---

## Customization

### Modify the Discovery Call Template
Edit `.claude/commands/meeting-prep.md` to:
- Adjust the question framework
- Update program recommendations
- Change the pricing structure
- Add/remove sections

### Create Additional Meeting Prep Commands
Copy `meeting-prep.md` and customize for different meeting types:
- `/meeting-prep-qbr` - Quarterly business reviews
- `/meeting-prep-partner` - Partnership discussions
- `/meeting-prep-vendor` - Vendor evaluations

### Use the Builder for New Types
The `meeting-prep-builder` skill guides you through creating custom prep templates for any meeting type.

---

## Troubleshooting

### Limited Research Results
If MCP queries return limited data:
- Check that API keys are correctly configured
- Verify the company name spelling
- Try alternative company name variations
- Use manual research to supplement

### MCP Server Not Available
If a specific MCP is unavailable:
- The command will skip that data source
- Other sources will still be queried
- A note will indicate which sources were unavailable

### LinkedIn Cookie Expired
If LinkedIn MCP stops working:
1. Log into LinkedIn fresh
2. Extract new `li_at` cookie
3. Update your environment variable
4. Restart Claude Code

---

## Data Sources Summary

| MCP | Primary Use | Key Data |
|-----|-------------|----------|
| **apollo** | Company/person enrichment | Size, industry, revenue, contact info |
| **perplexity** | Current information | News, trends, real-time data |
| **gohighlevel** | CRM history | Prior contacts, conversations |
| **airtable** | Internal records | Past registrations, alumni |
| **linkedin** | Direct LinkedIn | Profiles, companies, jobs |
| **firecrawl** | Web scraping | Careers pages, about pages |
| **exa** | Semantic search | Press releases, mentions |
| **brave-search** | Web search | General information |

---

## Future Enhancements

Potential additions to the meeting prep system:
- [ ] Calendar integration (auto-trigger prep for upcoming meetings)
- [ ] Notion integration (save briefs for team access)
- [ ] Email integration (auto-extract meeting context)
- [ ] Voice prep (audio summary via ElevenLabs)
- [ ] Post-meeting notes (compare prep vs. actual outcomes)
