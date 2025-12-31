# YouTube Channel Check Command

Check AI YouTube channels for new videos with two-tier synopsis system.

## Quick Commands

```bash
# Check for new videos
cd website && node scripts/fetch-youtube-videos.js

# View pending videos with quick synopses
cd website && node scripts/fetch-youtube-videos.js --digest

# Get full synopsis for a specific video
cd website && node scripts/fetch-youtube-videos.js --full <video-id>
```

## Monitored Channels (16)

| Category | Channels |
|----------|----------|
| **Business** | Nate B Jones |
| **News & Commentary** | AI Explained, Matt Wolfe, Wes Roth |
| **Educational** | Two Minute Papers, Yannic Kilcher, 3Blue1Brown, DeepLearning.AI |
| **Interviews** | Lex Fridman |
| **AI Safety** | Robert Miles |
| **Tutorials** | Skill Leap AI |
| **AI Labs** | Anthropic, OpenAI, Google AI |
| **Creative** | Curious Refuge |

## Two-Tier Synopsis System

### Quick Synopsis (Automatic)
Generated for all new videos. Tells you:
- What the video actually covers (not just the clickbait title)
- Specific topics discussed
- Key claims or arguments made
- Who should watch this
- Content type tag

### Full Synopsis (On-Demand)
Request with `--full <video-id>`. Provides:
- Core message with context
- Detailed breakdown of all topics
- Actionable takeaways
- Notable quotes
- Critical analysis
- Related topics to explore

## Integration

This is part of the AI Daily Brief system. For the complete experience:
- Use `/ai-brief` for all AI news (YouTube + news sites + newsletters)
- Use `/youtube-check` for YouTube-only monitoring

## Data Files

- `website/data/youtube/all-videos.json` - All cached videos
- `website/data/youtube/pending-review.json` - Videos awaiting your review
- `website/data/youtube/synopses/` - Individual synopsis files

## Scheduled Automation

GitHub Actions runs every 6 hours:
- `.github/workflows/youtube-channel-monitor.yml`
