# YouTube Channel Monitor Command

Check Nate B Jones's YouTube channel for new videos and generate synopses.

## Objective

Stay updated on Nate B Jones's content by monitoring his YouTube channel, detecting new videos, and generating actionable synopses with key insights.

## Configuration

- **Channel**: Nate B Jones (@NateBJones)
- **Synopsis Framework**: Action-Insight Framework
- **Cache Location**: `website/data/youtube/`
- **Synopses Location**: `website/data/youtube/synopses/`

---

## Execution Steps

### Phase 1: Check Current Status

1. Read the existing cache metadata:
   - `website/data/youtube/metadata.json`
   - Note last check time and video count

2. Read recent videos list:
   - `website/data/youtube/all-videos.json`
   - Identify the most recent video

### Phase 2: Manual Video Check (If API not available)

If YouTube API key is not configured, manually check:

1. Visit the channel: https://www.youtube.com/@NateBJones
2. Look for videos newer than the last cached video
3. For each new video:
   - Get video title, URL, and description
   - Note publish date and duration

### Phase 3: Generate Synopsis for New Videos

For each new video, create a synopsis using this framework:

```markdown
# Video Synopsis: [VIDEO TITLE]

**URL**: [VIDEO URL]
**Published**: [DATE]
**Duration**: [DURATION]

---

## Core Message
What is the single most important point Nate is making? (1-2 sentences)

## Key Insights
What are the 3-5 most valuable pieces of information?
- Insight 1
- Insight 2
- Insight 3
- ...

## Actionable Takeaways
What specific actions can you take based on this content?
- [ ] Action 1
- [ ] Action 2
- [ ] Action 3

## Notable Quotes
Any memorable quotes worth remembering?
> "Quote 1"
> "Quote 2"

## Context & Background
What background knowledge helps understand this video?

## Why This Matters
Why is this information valuable? Who should watch this?

---

*Synopsis generated: [TIMESTAMP]*
```

### Phase 4: Update Cache

1. Add new videos to the cache
2. Save individual synopses to `website/data/youtube/synopses/[video-id].json`
3. Update metadata with new check timestamp

### Phase 5: Report Summary

Output a summary:

```
YouTube Channel Check: Nate B Jones
====================================
Last Check: [PREVIOUS DATE]
Current Check: [NOW]

Channel Stats:
- Subscribers: [COUNT]
- Total Videos: [COUNT]

New Videos Since Last Check: [COUNT]

[If new videos:]
NEW VIDEO ALERT!
----------------
1. [VIDEO TITLE]
   URL: [URL]
   Published: [DATE]
   Duration: [DURATION]

   Synopsis Preview:
   [FIRST 200 CHARS OF SYNOPSIS]

[If no new videos:]
No new videos since last check.
Most recent video: [TITLE] ([DATE])
```

---

## Quick Commands

### Check for new videos only:
```bash
cd website && node scripts/fetch-youtube-videos.js
```

### Read latest synopsis:
```bash
ls -la website/data/youtube/synopses/ | head -5
```

### View cached videos:
```bash
cat website/data/youtube/metadata.json
```

---

## Synopsis Framework Explained

The **Action-Insight Framework** is designed to extract maximum value from each video:

| Section | Purpose | You Get |
|---------|---------|---------|
| Core Message | Main takeaway | Clarity on the video's purpose |
| Key Insights | Important information | Knowledge nuggets |
| Actionable Takeaways | What to do | Concrete next steps |
| Notable Quotes | Memorable phrases | Shareable wisdom |
| Context | Background info | Better understanding |
| Why This Matters | Relevance | Motivation to watch/apply |

---

## Environment Setup

To run the automated monitoring, you need:

1. **YouTube API Key**:
   - Go to https://console.cloud.google.com/
   - Enable "YouTube Data API v3"
   - Create an API key
   - Set `YOUTUBE_API_KEY` environment variable

2. **Channel ID** (optional):
   - Set `YOUTUBE_CHANNEL_ID` to skip channel search
   - Find it on the channel page source or use the script to search

3. **Anthropic API Key** (optional, for AI synopses):
   - Set `ANTHROPIC_API_KEY` for AI-generated synopses
   - Without it, synopses are template-based

---

## Notes

- The automated workflow runs every 6 hours
- Synopses are cached to avoid regeneration
- Manual checks can be run anytime with this command
- All data is stored in `website/data/youtube/`
- New videos trigger a commit with a descriptive message
