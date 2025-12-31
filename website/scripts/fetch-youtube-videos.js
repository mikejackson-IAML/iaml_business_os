/**
 * YouTube Channel Monitor - Multi-Channel Support with Two-Tier Synopsis System
 *
 * Monitors multiple YouTube channels for new videos and generates:
 * - QUICK SYNOPSIS: Substantial breakdown of what's actually discussed (auto-generated)
 * - FULL SYNOPSIS: Deep-dive with actionable insights (on-demand)
 *
 * Usage:
 *   node scripts/fetch-youtube-videos.js              # Check all channels
 *   node scripts/fetch-youtube-videos.js --digest     # Show pending videos for review
 *   node scripts/fetch-youtube-videos.js --full <id>  # Generate full synopsis for video
 *
 * Environment variables required:
 *   - YOUTUBE_API_KEY: Google API key with YouTube Data API v3 enabled
 *   - ANTHROPIC_API_KEY: For AI-generated synopses
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// MULTI-CHANNEL CONFIGURATION
// ============================================================================

const CHANNELS = [
  {
    id: process.env.YOUTUBE_CHANNEL_NATE || 'CONFIGURE_CHANNEL_ID',
    name: 'Nate B Jones',
    handle: '@NateBJones',
    searchQuery: 'Nate B Jones', // Used if ID not configured
    enabled: true
  }
  // Add more channels here:
  // {
  //   id: 'UC...',
  //   name: 'Channel Name',
  //   handle: '@handle',
  //   enabled: true
  // }
];

const CONFIG = {
  // How many videos to fetch per channel (max 50 per request)
  maxVideosPerChannel: 15,

  // YouTube Data API base URL
  apiBaseUrl: 'https://www.googleapis.com/youtube/v3',

  // Two-tier synopsis system
  synopsisTiers: {
    // QUICK SYNOPSIS - Generated automatically for all new videos
    // Tells you WHAT is actually discussed so you can decide if you want more
    quick: {
      name: 'Quick Synopsis',
      prompt: `Analyze this YouTube video and provide a QUICK SYNOPSIS that tells the viewer exactly what is discussed, so they can decide if they want a full deep-dive.

VIDEO CONTENT:
{content}

Provide your analysis in this EXACT format:

## What This Video Actually Covers

[3-5 sentences describing the specific topics, arguments, and information presented in this video. Be concrete - not vague. The reader should know exactly what they'll learn if they watch.]

## Specific Topics Discussed
- [Topic 1: Brief description of what's said about it]
- [Topic 2: Brief description of what's said about it]
- [Topic 3: Brief description of what's said about it]
- [Continue for all major topics...]

## Key Claims or Arguments Made
- [Specific claim or argument #1]
- [Specific claim or argument #2]
- [Continue...]

## Who Should Watch This
[1-2 sentences: Who would benefit from this video? Who can skip it?]

## Content Type
[Tag: e.g., "Tutorial", "Opinion/Commentary", "News/Update", "Story/Experience", "How-To", "Analysis", "Interview", "Q&A"]

---
NOTE: This is a quick synopsis. Request a FULL SYNOPSIS for detailed actionable insights, notable quotes, and deep analysis.`
    },

    // FULL SYNOPSIS - Generated on-demand when user requests it
    // Deep dive with actionable insights
    full: {
      name: 'Full Action-Insight Synopsis',
      prompt: `You are creating a FULL DEEP-DIVE SYNOPSIS of this YouTube video. The viewer has already seen the quick synopsis and wants the complete breakdown with actionable insights.

VIDEO CONTENT:
{content}

Provide a comprehensive synopsis using this framework:

## Core Message
What is the single most important point being made? (2-3 sentences with context)

## Detailed Breakdown

### Main Topics Explored
[For each major topic, provide:
- What was discussed
- Key points made
- Any data, examples, or evidence provided]

### Key Insights
[5-7 valuable insights with explanation of why each matters]

### Actionable Takeaways
[Specific actions the viewer can take based on this content]
- [ ] Action 1: [Description + how to implement]
- [ ] Action 2: [Description + how to implement]
- [ ] Action 3: [Description + how to implement]

## Notable Quotes
[2-4 memorable quotes worth saving]
> "Quote 1"
> "Quote 2"

## Context & Background
What background knowledge helps understand this video? Any references to previous content, current events, or prerequisite knowledge?

## Critical Analysis
- Strengths of the arguments/content
- Any gaps or things not addressed
- How this fits with other content on the topic

## Why This Matters
Why is this information valuable? How can it be applied?

## Related Topics to Explore
[2-3 related topics the viewer might want to research further]`
    }
  }
};

// ============================================================================
// YOUTUBE API FUNCTIONS
// ============================================================================

async function fetchChannelInfo(apiKey, channelId) {
  const url = `${CONFIG.apiBaseUrl}/channels?` + new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id: channelId,
    key: apiKey
  });

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.items?.[0] || null;
}

async function searchForChannel(apiKey, query) {
  const url = `${CONFIG.apiBaseUrl}/search?` + new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'channel',
    maxResults: 5,
    key: apiKey
  });

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function getUploadsPlaylistId(apiKey, channelId) {
  const channelInfo = await fetchChannelInfo(apiKey, channelId);
  if (!channelInfo) {
    throw new Error(`Channel not found: ${channelId}`);
  }

  return {
    playlistId: channelInfo.contentDetails?.relatedPlaylists?.uploads,
    channelTitle: channelInfo.snippet?.title,
    subscriberCount: channelInfo.statistics?.subscriberCount,
    videoCount: channelInfo.statistics?.videoCount
  };
}

async function fetchPlaylistVideos(apiKey, playlistId, maxResults = 15) {
  const allVideos = [];
  let pageToken = null;

  do {
    const params = {
      part: 'snippet,contentDetails',
      playlistId: playlistId,
      maxResults: Math.min(maxResults - allVideos.length, 50),
      key: apiKey
    };

    if (pageToken) params.pageToken = pageToken;

    const url = `${CONFIG.apiBaseUrl}/playlistItems?` + new URLSearchParams(params);
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YouTube API error ${response.status}: ${error}`);
    }

    const data = await response.json();
    allVideos.push(...(data.items || []));
    pageToken = data.nextPageToken;

    if (pageToken && allVideos.length < maxResults) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } while (pageToken && allVideos.length < maxResults);

  return allVideos;
}

async function fetchVideoDetails(apiKey, videoIds) {
  if (!videoIds.length) return [];

  const url = `${CONFIG.apiBaseUrl}/videos?` + new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id: videoIds.join(','),
    key: apiKey
  });

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.items || [];
}

// ============================================================================
// TRANSCRIPT FETCHING
// ============================================================================

/**
 * Attempt to fetch video transcript using youtube-transcript approach
 * Falls back gracefully if not available
 */
async function fetchVideoTranscript(videoId) {
  try {
    // Try to fetch transcript from a transcript service
    // This uses the unofficial YouTube transcript endpoint
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
    );

    if (!response.ok) return null;

    const html = await response.text();

    // Look for captions in the page data
    const captionsMatch = html.match(/"captions":\s*(\{[^}]+\})/);
    if (!captionsMatch) return null;

    // For now, return null - full transcript fetching requires more complex parsing
    // The quick synopsis will work with title + description
    // TODO: Implement full transcript extraction
    return null;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

function parseDuration(isoDuration) {
  if (!isoDuration) return 'Unknown';

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;

  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function transformVideo(playlistItem, videoDetails, channelConfig) {
  const snippet = playlistItem.snippet || {};
  const details = videoDetails || {};
  const stats = details.statistics || {};
  const contentDetails = details.contentDetails || {};
  const videoId = playlistItem.contentDetails?.videoId || snippet.resourceId?.videoId;

  return {
    id: videoId,
    title: snippet.title,
    description: snippet.description,
    publishedAt: snippet.publishedAt,
    thumbnails: snippet.thumbnails,

    // Channel info
    channelId: channelConfig.id,
    channelName: channelConfig.name,
    channelHandle: channelConfig.handle,

    // Video details
    duration: parseDuration(contentDetails.duration),
    durationRaw: contentDetails.duration,

    // Statistics
    viewCount: parseInt(stats.viewCount || 0),
    likeCount: parseInt(stats.likeCount || 0),
    commentCount: parseInt(stats.commentCount || 0),

    // URLs
    url: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,

    // Synopsis status
    quickSynopsis: null,  // To be filled
    fullSynopsis: null,   // Generated on-demand
    synopsisStatus: 'pending', // pending, quick, full

    // Metadata
    fetchedAt: new Date().toISOString()
  };
}

// ============================================================================
// TWO-TIER SYNOPSIS GENERATION
// ============================================================================

/**
 * Generate QUICK synopsis - substantial breakdown of what's discussed
 */
async function generateQuickSynopsis(video, transcript = null) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    return {
      content: generateFallbackQuickSynopsis(video),
      generatedAt: new Date().toISOString(),
      model: 'fallback',
      tier: 'quick'
    };
  }

  const contentForAnalysis = buildContentForAnalysis(video, transcript);
  const prompt = CONFIG.synopsisTiers.quick.prompt.replace('{content}', contentForAnalysis);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      generatedAt: new Date().toISOString(),
      model: 'claude-3-haiku-20240307',
      tier: 'quick',
      hasTranscript: !!transcript
    };
  } catch (error) {
    console.warn(`  Warning: Quick synopsis generation failed: ${error.message}`);
    return {
      content: generateFallbackQuickSynopsis(video),
      generatedAt: new Date().toISOString(),
      model: 'fallback',
      tier: 'quick',
      error: error.message
    };
  }
}

/**
 * Generate FULL synopsis - deep dive with actionable insights (on-demand)
 */
async function generateFullSynopsis(video, transcript = null) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY required for full synopsis generation');
  }

  const contentForAnalysis = buildContentForAnalysis(video, transcript);
  const prompt = CONFIG.synopsisTiers.full.prompt.replace('{content}', contentForAnalysis);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022', // Use Sonnet for better full synopsis
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.content?.[0]?.text || '',
    generatedAt: new Date().toISOString(),
    model: 'claude-3-5-sonnet-20241022',
    tier: 'full',
    hasTranscript: !!transcript
  };
}

function buildContentForAnalysis(video, transcript) {
  return `
TITLE: ${video.title}

CHANNEL: ${video.channelName}

DURATION: ${video.duration}

PUBLISHED: ${new Date(video.publishedAt).toLocaleDateString()}

DESCRIPTION:
${video.description || '(No description provided)'}

${transcript ? `TRANSCRIPT:\n${transcript}` : '(Transcript not available - analysis based on title and description)'}
`.trim();
}

function generateFallbackQuickSynopsis(video) {
  return `## What This Video Actually Covers

Based on the title "${video.title}" from ${video.channelName}, this appears to be a ${video.duration} video. Full analysis requires ANTHROPIC_API_KEY.

## Video Details
- **Title**: ${video.title}
- **Channel**: ${video.channelName}
- **Duration**: ${video.duration}
- **Published**: ${new Date(video.publishedAt).toLocaleDateString()}
- **Views**: ${video.viewCount.toLocaleString()}

## Description Preview
${video.description?.substring(0, 800) || '(No description)'}${video.description?.length > 800 ? '...' : ''}

---
NOTE: Set ANTHROPIC_API_KEY for AI-generated synopsis that tells you exactly what's discussed.`;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

function loadVideoCache(dataDir) {
  const cacheFile = path.join(dataDir, 'all-videos.json');

  if (!fs.existsSync(cacheFile)) {
    return { videos: [], videoIds: new Set(), byChannel: {} };
  }

  try {
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const videoIds = new Set(data.videos?.map(v => v.id) || []);
    const byChannel = {};

    (data.videos || []).forEach(v => {
      if (!byChannel[v.channelId]) byChannel[v.channelId] = [];
      byChannel[v.channelId].push(v);
    });

    return { videos: data.videos || [], videoIds, byChannel };
  } catch (error) {
    console.warn(`Warning: Could not load cache: ${error.message}`);
    return { videos: [], videoIds: new Set(), byChannel: {} };
  }
}

function loadPendingReview(dataDir) {
  const pendingFile = path.join(dataDir, 'pending-review.json');

  if (!fs.existsSync(pendingFile)) {
    return { videos: [] };
  }

  try {
    return JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
  } catch {
    return { videos: [] };
  }
}

function savePendingReview(dataDir, pendingVideos) {
  const pendingFile = path.join(dataDir, 'pending-review.json');
  fs.writeFileSync(pendingFile, JSON.stringify({
    generated: new Date().toISOString(),
    count: pendingVideos.length,
    videos: pendingVideos
  }, null, 2));
}

// ============================================================================
// DIGEST DISPLAY
// ============================================================================

function displayDigest(dataDir) {
  const pending = loadPendingReview(dataDir);

  console.log('');
  console.log('='.repeat(70));
  console.log('  YOUTUBE VIDEO DIGEST - Pending Review');
  console.log('='.repeat(70));
  console.log('');

  if (!pending.videos || pending.videos.length === 0) {
    console.log('  No videos pending review.');
    console.log('  Run without --digest to check for new videos.');
    console.log('');
    return;
  }

  console.log(`  ${pending.videos.length} video(s) awaiting your review:`);
  console.log('');

  pending.videos.forEach((video, index) => {
    const num = (index + 1).toString().padStart(2, ' ');
    console.log(`  ${num}. ${video.title}`);
    console.log(`      Channel: ${video.channelName} | Duration: ${video.duration}`);
    console.log(`      Published: ${new Date(video.publishedAt).toLocaleDateString()}`);
    console.log(`      URL: ${video.url}`);
    console.log('');

    if (video.quickSynopsis?.content) {
      console.log('      --- QUICK SYNOPSIS ---');
      const lines = video.quickSynopsis.content.split('\n');
      lines.forEach(line => {
        console.log(`      ${line}`);
      });
      console.log('');
    }

    console.log(`      To get FULL SYNOPSIS: node scripts/fetch-youtube-videos.js --full ${video.id}`);
    console.log('');
    console.log('  ' + '-'.repeat(66));
    console.log('');
  });

  console.log('='.repeat(70));
  console.log('');
}

// ============================================================================
// FULL SYNOPSIS ON-DEMAND
// ============================================================================

async function generateFullSynopsisForVideo(videoId, dataDir) {
  const cache = loadVideoCache(dataDir);
  const video = cache.videos.find(v => v.id === videoId);

  if (!video) {
    console.error(`Error: Video not found: ${videoId}`);
    console.error('Run the monitor first to fetch videos.');
    process.exit(1);
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('  GENERATING FULL SYNOPSIS');
  console.log('='.repeat(70));
  console.log('');
  console.log(`  Video: ${video.title}`);
  console.log(`  Channel: ${video.channelName}`);
  console.log(`  URL: ${video.url}`);
  console.log('');
  console.log('  Fetching transcript (if available)...');

  const transcript = await fetchVideoTranscript(videoId);
  console.log(transcript ? '  Transcript found!' : '  No transcript available, using description.');
  console.log('');
  console.log('  Generating full synopsis with Claude...');
  console.log('');

  try {
    const fullSynopsis = await generateFullSynopsis(video, transcript);

    // Save to synopses directory
    const synopsesDir = path.join(dataDir, 'synopses');
    fs.mkdirSync(synopsesDir, { recursive: true });

    const synopsisFile = path.join(synopsesDir, `${videoId}-full.json`);
    fs.writeFileSync(synopsisFile, JSON.stringify({
      video: {
        id: video.id,
        title: video.title,
        url: video.url,
        channelName: video.channelName,
        publishedAt: video.publishedAt,
        duration: video.duration
      },
      synopsis: fullSynopsis
    }, null, 2));

    // Update video in cache
    video.fullSynopsis = fullSynopsis;
    video.synopsisStatus = 'full';

    fs.writeFileSync(
      path.join(dataDir, 'all-videos.json'),
      JSON.stringify({
        generated: new Date().toISOString(),
        version: '2.0.0',
        videos: cache.videos
      }, null, 2)
    );

    // Remove from pending review
    const pending = loadPendingReview(dataDir);
    pending.videos = pending.videos.filter(v => v.id !== videoId);
    savePendingReview(dataDir, pending.videos);

    console.log('='.repeat(70));
    console.log('  FULL SYNOPSIS');
    console.log('='.repeat(70));
    console.log('');
    console.log(fullSynopsis.content);
    console.log('');
    console.log('='.repeat(70));
    console.log(`  Saved to: synopses/${videoId}-full.json`);
    console.log('='.repeat(70));
    console.log('');

  } catch (error) {
    console.error(`Error generating synopsis: ${error.message}`);
    process.exit(1);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Setup directories
  const dataDir = path.join(__dirname, '..', 'data', 'youtube');
  const synopsesDir = path.join(dataDir, 'synopses');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(synopsesDir, { recursive: true });

  // Handle --digest flag
  if (args.includes('--digest')) {
    displayDigest(dataDir);
    return;
  }

  // Handle --full <videoId> flag
  const fullIndex = args.indexOf('--full');
  if (fullIndex !== -1) {
    const videoId = args[fullIndex + 1];
    if (!videoId) {
      console.error('Error: --full requires a video ID');
      console.error('Usage: node scripts/fetch-youtube-videos.js --full <video-id>');
      process.exit(1);
    }
    await generateFullSynopsisForVideo(videoId, dataDir);
    return;
  }

  // Normal execution - check for new videos
  const API_KEY = process.env.YOUTUBE_API_KEY;

  if (!API_KEY) {
    console.error('Error: Missing YOUTUBE_API_KEY environment variable');
    console.error('');
    console.error('Setup instructions:');
    console.error('1. Go to https://console.cloud.google.com/');
    console.error('2. Enable "YouTube Data API v3"');
    console.error('3. Create an API Key');
    console.error('4. Set YOUTUBE_API_KEY environment variable');
    process.exit(1);
  }

  const generated = new Date().toISOString();

  console.log('');
  console.log('='.repeat(70));
  console.log('  YOUTUBE CHANNEL MONITOR - Multi-Channel');
  console.log('='.repeat(70));
  console.log(`  Timestamp: ${generated}`);
  console.log(`  Channels configured: ${CHANNELS.filter(c => c.enabled).length}`);
  console.log('');

  // Load existing cache
  const previousCache = loadVideoCache(dataDir);
  console.log(`  Previously cached videos: ${previousCache.videos.length}`);
  console.log('');

  const allNewVideos = [];
  const allVideos = [...previousCache.videos];

  // Process each enabled channel
  for (const channelConfig of CHANNELS.filter(c => c.enabled)) {
    console.log('-'.repeat(70));
    console.log(`  Channel: ${channelConfig.name} (${channelConfig.handle})`);
    console.log('-'.repeat(70));

    let channelId = channelConfig.id;

    // Search for channel if ID not configured
    if (channelId === 'CONFIGURE_CHANNEL_ID') {
      console.log(`  Searching for channel: ${channelConfig.searchQuery}...`);
      const searchResults = await searchForChannel(API_KEY, channelConfig.searchQuery);

      if (searchResults.length === 0) {
        console.log(`  Could not find channel. Skipping.`);
        continue;
      }

      channelId = searchResults[0].snippet.channelId;
      console.log(`  Found: ${searchResults[0].snippet.title} (${channelId})`);
      console.log(`  TIP: Set YOUTUBE_CHANNEL_NATE=${channelId} to skip search`);
    }

    try {
      // Get channel info
      const { playlistId, channelTitle, subscriberCount, videoCount } =
        await getUploadsPlaylistId(API_KEY, channelId);

      console.log(`  Subscribers: ${parseInt(subscriberCount).toLocaleString()}`);
      console.log(`  Total videos: ${parseInt(videoCount).toLocaleString()}`);

      // Fetch recent videos
      const playlistItems = await fetchPlaylistVideos(
        API_KEY,
        playlistId,
        CONFIG.maxVideosPerChannel
      );
      console.log(`  Fetched: ${playlistItems.length} recent videos`);

      // Get video details
      const videoIds = playlistItems.map(item =>
        item.contentDetails?.videoId || item.snippet?.resourceId?.videoId
      ).filter(Boolean);

      const videoDetails = await fetchVideoDetails(API_KEY, videoIds);
      const detailsMap = new Map(videoDetails.map(v => [v.id, v]));

      // Transform and identify new videos
      const channelVideos = playlistItems.map(item => {
        const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
        return transformVideo(item, detailsMap.get(videoId), { ...channelConfig, id: channelId });
      });

      const newVideos = channelVideos.filter(v => !previousCache.videoIds.has(v.id));

      if (newVideos.length > 0) {
        console.log('');
        console.log(`  NEW VIDEOS: ${newVideos.length}`);

        for (const video of newVideos) {
          console.log('');
          console.log(`    "${video.title}"`);
          console.log(`    Duration: ${video.duration} | Published: ${new Date(video.publishedAt).toLocaleDateString()}`);
          console.log(`    Generating quick synopsis...`);

          // Generate quick synopsis
          const transcript = await fetchVideoTranscript(video.id);
          video.quickSynopsis = await generateQuickSynopsis(video, transcript);
          video.synopsisStatus = 'quick';

          console.log(`    Quick synopsis generated.`);

          // Save individual quick synopsis
          const synopsisFile = path.join(synopsesDir, `${video.id}-quick.json`);
          fs.writeFileSync(synopsisFile, JSON.stringify({
            video: {
              id: video.id,
              title: video.title,
              url: video.url,
              channelName: video.channelName,
              publishedAt: video.publishedAt,
              duration: video.duration
            },
            synopsis: video.quickSynopsis
          }, null, 2));

          allNewVideos.push(video);
          allVideos.push(video);
        }
      } else {
        console.log(`  No new videos.`);
      }

    } catch (error) {
      console.error(`  Error processing channel: ${error.message}`);
    }

    console.log('');
  }

  // Save updated cache
  fs.writeFileSync(
    path.join(dataDir, 'all-videos.json'),
    JSON.stringify({
      generated,
      version: '2.0.0',
      source: 'youtube',
      channelCount: CHANNELS.filter(c => c.enabled).length,
      videoCount: allVideos.length,
      videos: allVideos
    }, null, 2)
  );

  // Update pending review queue
  const existingPending = loadPendingReview(dataDir);
  const allPending = [...(existingPending.videos || []), ...allNewVideos];
  savePendingReview(dataDir, allPending);

  // Save metadata
  fs.writeFileSync(
    path.join(dataDir, 'metadata.json'),
    JSON.stringify({
      generated,
      version: '2.0.0',
      channels: CHANNELS.filter(c => c.enabled).map(c => ({
        name: c.name,
        handle: c.handle
      })),
      totalVideosCached: allVideos.length,
      newVideosCount: allNewVideos.length,
      pendingReviewCount: allPending.length
    }, null, 2)
  );

  // Summary
  console.log('='.repeat(70));
  console.log('  SUMMARY');
  console.log('='.repeat(70));
  console.log(`  Channels monitored: ${CHANNELS.filter(c => c.enabled).length}`);
  console.log(`  Total videos cached: ${allVideos.length}`);
  console.log(`  New videos found: ${allNewVideos.length}`);
  console.log(`  Pending review: ${allPending.length}`);
  console.log('');

  if (allNewVideos.length > 0) {
    console.log('  NEW VIDEOS:');
    allNewVideos.forEach(v => {
      console.log(`    - [${v.channelName}] ${v.title}`);
    });
    console.log('');
    console.log('  Run with --digest to review with quick synopses');
    console.log('  Run with --full <video-id> to get detailed synopsis');
  }

  console.log('');
  console.log(`  Output: ${dataDir}`);
  console.log('='.repeat(70));
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
