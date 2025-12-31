# AI Daily Brief Command

Your comprehensive AI intelligence briefing - everything you need to know about AI, delivered daily.

## Objective

Stay informed on AI developments across multiple dimensions:
- **Funding & Investments**: Who's raising money, acquisitions, valuations
- **Product Launches**: New AI tools, features, and services
- **Industry News**: Business moves, partnerships, market shifts
- **Research**: Breakthroughs, new models, technical advances
- **Tutorials & How-To**: Practical applications and workflows
- **Policy & Regulation**: Government actions, safety discussions

## Source Categories

### YouTube Channels (16 creators)
| Category | Channels |
|----------|----------|
| Business & Productivity | Nate B Jones |
| AI News & Commentary | AI Explained, Matt Wolfe, Wes Roth |
| Educational | Two Minute Papers, Yannic Kilcher, 3Blue1Brown, DeepLearning.AI |
| Interviews | Lex Fridman |
| AI Safety | Robert Miles |
| Tutorials | Skill Leap AI |
| AI Labs | Anthropic, OpenAI, Google AI |
| Creative | Curious Refuge |

### News Sites (14 sources)
- **Tier 1 (Daily Must-Read)**: TechCrunch AI, The Verge AI, MIT Tech Review, Wired AI
- **Tier 2 (Enterprise)**: VentureBeat, ZDNet, InfoWorld
- **Tier 3 (AI Labs)**: OpenAI Blog, Anthropic Research, Google AI, Meta AI, Microsoft AI
- **Tier 4 (Specialized)**: Hugging Face, DeepMind

### Newsletters (6 sources)
Ben's Bites, TLDR AI, TheSequence, Latent Space, Import AI, Jack Clark

### Investment & Funding (3 sources)
Crunchbase News, VC News Daily, TechCrunch Venture

### Product Launches (2 sources)
Product Hunt AI, There's An AI For That

### Policy & Regulation (2 sources)
Brookings AI, Georgetown CSET

---

## Quick Commands

### Show Today's Brief
```bash
cd website && node scripts/ai-daily-brief.js --brief
```

### Fetch Latest Content
```bash
cd website && node scripts/ai-daily-brief.js
```

### List All Sources
```bash
cd website && node scripts/ai-daily-brief.js --sources
```

### Get Full Synopsis for an Item
```bash
cd website && node scripts/ai-daily-brief.js --full <item-id>
```

---

## Execution Steps

### Phase 1: Check Current Brief

1. Read pending brief file:
   - `website/data/ai-brief/pending-brief.json`
   - Count items by category
   - Note last fetch time

2. Read YouTube pending:
   - `website/data/youtube/pending-review.json`
   - Count new videos

### Phase 2: Display Brief

For each category with items:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AI DAILY BRIEF - [DATE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📺 NEW VIDEOS (3)
──────────────────
1. [Nate B Jones] "Title Here"
   Duration: 12:34 | Published: Today
   Quick Synopsis: What this video covers...
   → Full synopsis: /ai-brief --full VIDEO_ID

💰 FUNDING (2)
──────────────────
1. [TechCrunch] "Company Raises $X"
   Why it matters: ...

🚀 PRODUCT LAUNCHES (4)
──────────────────
1. [Product Hunt] "New AI Tool"
   What it does: ...

🏢 INDUSTRY NEWS (3)
──────────────────
...

📊 REVIEWS & ANALYSIS (1)
──────────────────
...

🔬 RESEARCH (2)
──────────────────
...
```

### Phase 3: Triage Options

After displaying, offer:

1. **Mark as read**: Remove items you've seen
2. **Get full synopsis**: Deep dive on specific items
3. **Skip category**: Dismiss entire category
4. **Refresh**: Fetch latest from all sources

---

## Two-Tier Synopsis System

### Quick Synopsis (Automatic)
Generated for ALL new items. Tells you:
- What this is actually about (not just the headline)
- Specific topics covered
- Who should read/watch this
- Content type tag

### Full Synopsis (On-Demand)
Request with `--full <id>`. Provides:
- Core message with context
- Detailed breakdown of all topics
- Actionable takeaways with implementation steps
- Notable quotes
- Critical analysis
- Related topics to explore

---

## Integration Points

### Scheduled Automation
- **6 AM Daily**: Fetch all sources, generate quick synopses
- **GitHub Actions**: `youtube-channel-monitor.yml` handles YouTube
- **n8n Workflow**: `ai-brief-distribution.json` (to be created)

### Output Destinations
- **CLI**: This command for interactive review
- **Slack**: `#daily-brief` channel (coming soon)
- **Email**: Morning digest (coming soon)
- **Web Dashboard**: Browse and search (future)

### Data Storage
- `website/data/ai-brief/` - News item cache
- `website/data/youtube/` - YouTube video cache
- Supabase - Historical storage (future)

---

## Environment Variables

For full functionality:

```
# YouTube Monitoring
YOUTUBE_API_KEY=your-key
YOUTUBE_CHANNEL_NATE=UCxxxxx  (auto-discovered if not set)

# AI Synopsis Generation
ANTHROPIC_API_KEY=your-key

# Future: Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
ALERT_EMAIL=your@email.com
```

---

## Customization

### Add a YouTube Channel
Edit `website/scripts/fetch-youtube-videos.js`:
```javascript
{
  id: process.env.YOUTUBE_CHANNEL_NEWCHANNEL || 'CONFIGURE',
  name: 'Channel Name',
  handle: '@handle',
  searchQuery: 'Channel Name',
  focus: ['topic1', 'topic2'],
  priority: 'high' // or 'medium', 'low'
}
```

### Add an RSS Feed
Edit `website/scripts/ai-daily-brief.js` in the appropriate source section:
```javascript
{
  url: 'https://example.com/feed.xml',
  name: 'Source Name',
  focus: ['topic1', 'topic2'],
  priority: 'high',
  filter: ['keyword1', 'keyword2'] // optional
}
```

### Change Priorities
- `high`: Always included in brief, synopsis generated first
- `medium`: Included if relevant, standard processing
- `low`: Optional, included if space allows

---

## Workflow Integration

This command fits into your daily routine:

```
MORNING BRIEF (6:00 AM)
├─ AI Daily Brief ← THIS COMMAND
├─ Content Insights (quiz data)
└─ Operations Status

WORK DAY
├─ Deep dives on selected items
├─ Apply learnings to projects
└─ Share relevant items

EVENING DEBRIEF
├─ Mark items as read
├─ Queue items for tomorrow
└─ Adjust source priorities
```

---

## Notes

- First run may take 2-3 minutes to fetch all sources
- YouTube channel IDs are auto-discovered on first run
- Quick synopses cached to avoid regeneration
- RSS feeds refresh on each run (no caching of feed lists)
- Some RSS feeds may be rate-limited or unavailable
