---
name: youtube-transcription
description: Extract transcripts from YouTube videos and generate Business Insights Reports. Use when user provides a YouTube URL containing business, strategy, marketing, operations, or professional development content they want to learn from.
---

# YouTube Business Insights Skill

## Overview

This skill extracts transcripts from YouTube videos and transforms them into structured Business Insights Reports. It's designed for professionals who consume video content for learning and want actionable, documented takeaways.

## When to Use

Activate this skill when:
- User provides a YouTube URL for business/educational content
- User wants to extract insights, key points, or learnings from a video
- User wants a transcript with analysis
- User mentions wanting to "learn from" or "take notes on" a video

Do NOT use for:
- Entertainment videos without business value
- Music videos or non-educational content
- Simple transcript requests without analysis (use basic transcription instead)

## Workflow

```
1. EXTRACT  →  Fetch transcript from YouTube URL
2. ANALYZE  →  Identify themes, insights, and actionable items
3. REPORT   →  Generate structured Business Insights Report
4. SAVE     →  Store report to specified location (if requested)
```

## Supported URL Formats

Parse these YouTube URL formats to extract video ID:
- Standard: `https://www.youtube.com/watch?v=VIDEO_ID`
- Shortened: `https://youtu.be/VIDEO_ID`
- Embedded: `https://www.youtube.com/embed/VIDEO_ID`
- With params: `https://www.youtube.com/watch?v=VIDEO_ID&t=123`
- Raw ID: `VIDEO_ID` (11 characters)

## Analysis Framework

For each video, systematically identify:

### 1. Core Message
The single-sentence thesis or main argument of the video.

### 2. Key Takeaways
Extract ALL valuable insights from the video. Do not limit the number—if the video contains 20 important points, capture all 20. Rank by business relevance:
- **Critical** - Game-changing insights that could significantly impact the business
- **High** - Important learnings worth implementing
- **Useful** - Good-to-know information for future reference

### 3. Actionable Ideas
Specific, concrete actions that could be implemented:
- **Immediate** (This Week) - Quick wins, low effort
- **Strategic** (This Quarter) - Larger initiatives requiring planning

### 4. Detailed Insights by Topic
Group related points into themes/topics. For each:
- Timestamp range where discussed
- Key points made
- Direct application to the user's business context

### 5. Timestamps
Create a reference table of valuable moments for easy video navigation.

### 6. Source Credibility Assessment
Evaluate:
- Speaker expertise and authority
- Data/research quality cited
- Recency and relevance of information

## Content Categories

Classify the video into one or more categories:
- Strategy & Vision
- Marketing & Growth
- Operations & Process
- HR & Culture
- Finance & Pricing
- Product & Technology
- Sales & Business Development
- Leadership & Management
- Industry Trends

## Output Format

Use the Business Insights Report template located at:
`templates/business-insights.md`

Key formatting requirements:
- Use tables for scannable data (takeaways, timestamps)
- Use checkboxes for actionable items
- Include timestamp references for all insights
- Use severity emojis for prioritization (as per IAML conventions)
- Estimate read time at the top

## Quality Standards

1. **Comprehensiveness** - Capture ALL valuable insights, not just the top few
2. **Accuracy** - Use exact timestamps, quote key phrases when valuable
3. **Actionability** - Every insight should connect to a potential action
4. **Business Context** - Frame insights in terms of business application
5. **Scannability** - Use formatting that allows quick review

## Example Interaction

**User:** "Get insights from https://youtu.be/abc123xyz - it's about pricing strategies"

**Response:**
1. Extract video transcript using youtube-transcript-api
2. Analyze for pricing-related insights, frameworks, and tactics
3. Generate full Business Insights Report
4. Present report with all key takeaways (unlimited)
5. Offer to save to file if desired

## File Naming Convention

When saving reports:
- Default: `[VIDEO_TITLE]-insights.md`
- With date: `[YYYY-MM-DD]-[VIDEO_TITLE]-insights.md`
- User-specified: Use exactly as requested

## Error Handling

- **No transcript available**: Inform user, suggest alternatives (auto-captions, manual notes)
- **Private/restricted video**: Explain limitation, ask for alternative URL
- **Non-English content**: Attempt translation or note language limitation

## Related Skills

This skill pairs well with:
- Meeting prep (apply video insights to upcoming meetings)
- Content planning (use insights for content creation)
- Strategy documents (incorporate learnings into plans)
