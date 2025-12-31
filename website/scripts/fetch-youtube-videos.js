/**
 * YouTube Channel Monitor - Nate B Jones
 *
 * Monitors YouTube channel for new videos and generates AI-powered synopses.
 * Designed to help you stay updated on Nate B Jones's content with actionable insights.
 *
 * Usage: node scripts/fetch-youtube-videos.js
 *
 * Environment variables required:
 *   - YOUTUBE_API_KEY: Google API key with YouTube Data API v3 enabled
 *   - ANTHROPIC_API_KEY: (optional) For AI-generated synopses
 *
 * What this script does:
 *   1. Fetches latest videos from the configured YouTube channel
 *   2. Compares with cached data to detect new videos
 *   3. Fetches video transcripts when available
 *   4. Generates structured synopses with key takeaways
 *   5. Caches everything for future reference
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Nate B Jones YouTube Channel
  // You can find channel ID by going to the channel page and viewing page source
  // or using: https://www.youtube.com/channel/[CHANNEL_ID]
  channelName: 'Nate B Jones',

  // Channel handle (for display purposes)
  channelHandle: '@NateBJones',

  // You'll need to set this after finding the actual channel ID
  // To find: Go to channel page -> View Page Source -> search for "channelId"
  // Or use: https://www.youtube.com/@NateBJones -> inspect network requests
  channelId: process.env.YOUTUBE_CHANNEL_ID || 'CHANNEL_ID_TO_BE_CONFIGURED',

  // How many videos to fetch (max 50 per request)
  maxVideos: 20,

  // YouTube Data API base URL
  apiBaseUrl: 'https://www.googleapis.com/youtube/v3',

  // Synopsis framework - what YOU want to know from each video
  synopsisFramework: {
    name: 'Action-Insight Framework',
    sections: [
      {
        key: 'core_message',
        title: '🎯 Core Message',
        prompt: 'What is the single most important point Nate is making in this video? (1-2 sentences)'
      },
      {
        key: 'key_insights',
        title: '💡 Key Insights',
        prompt: 'What are the 3-5 most valuable insights or pieces of information? (bullet points)'
      },
      {
        key: 'actionable_takeaways',
        title: '✅ Actionable Takeaways',
        prompt: 'What specific actions can the viewer take based on this content? (bullet points)'
      },
      {
        key: 'notable_quotes',
        title: '💬 Notable Quotes',
        prompt: 'Any memorable quotes or phrases worth remembering? (2-3 max)'
      },
      {
        key: 'context',
        title: '📚 Context & Background',
        prompt: 'What background knowledge or context is helpful for understanding this video?'
      },
      {
        key: 'relevance',
        title: '🔗 Why This Matters',
        prompt: 'Why is this information valuable? Who should watch this?'
      }
    ]
  }
};

// ============================================================================
// YOUTUBE API FUNCTIONS
// ============================================================================

/**
 * Fetch channel information to verify we have the right channel
 */
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

/**
 * Search for a channel by name/handle if channel ID is not configured
 */
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

/**
 * Get the uploads playlist ID for a channel
 */
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

/**
 * Fetch videos from a playlist (uploads playlist = all videos)
 */
async function fetchPlaylistVideos(apiKey, playlistId, maxResults = 20) {
  const allVideos = [];
  let pageToken = null;

  do {
    const params = {
      part: 'snippet,contentDetails',
      playlistId: playlistId,
      maxResults: Math.min(maxResults - allVideos.length, 50),
      key: apiKey
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    const url = `${CONFIG.apiBaseUrl}/playlistItems?` + new URLSearchParams(params);
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YouTube API error ${response.status}: ${error}`);
    }

    const data = await response.json();
    allVideos.push(...(data.items || []));
    pageToken = data.nextPageToken;

    // Rate limiting
    if (pageToken && allVideos.length < maxResults) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

  } while (pageToken && allVideos.length < maxResults);

  return allVideos;
}

/**
 * Fetch detailed video information (duration, views, etc.)
 */
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

/**
 * Attempt to fetch video transcript/captions
 * Note: This requires additional setup - YouTube doesn't provide transcripts via Data API
 * We'll use the video description and title for now, with a placeholder for transcript
 */
async function fetchVideoTranscript(videoId) {
  // YouTube Data API doesn't directly provide transcripts
  // Options for getting transcripts:
  // 1. Use youtube-transcript npm package (requires separate setup)
  // 2. Use Whisper API to transcribe
  // 3. Use YouTube's auto-generated captions API (complex)

  // For now, return null - synopsis will be based on title/description
  // TODO: Integrate youtube-transcript or similar
  return null;
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

/**
 * Parse ISO 8601 duration to human-readable format
 */
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

/**
 * Transform raw video data to our format
 */
function transformVideo(playlistItem, videoDetails) {
  const snippet = playlistItem.snippet || {};
  const details = videoDetails || {};
  const stats = details.statistics || {};
  const contentDetails = details.contentDetails || {};

  return {
    id: playlistItem.contentDetails?.videoId || snippet.resourceId?.videoId,
    title: snippet.title,
    description: snippet.description,
    publishedAt: snippet.publishedAt,
    thumbnails: snippet.thumbnails,
    channelTitle: snippet.channelTitle,

    // Video details
    duration: parseDuration(contentDetails.duration),
    durationRaw: contentDetails.duration,

    // Statistics
    viewCount: parseInt(stats.viewCount || 0),
    likeCount: parseInt(stats.likeCount || 0),
    commentCount: parseInt(stats.commentCount || 0),

    // URLs
    url: `https://www.youtube.com/watch?v=${playlistItem.contentDetails?.videoId || snippet.resourceId?.videoId}`,
    embedUrl: `https://www.youtube.com/embed/${playlistItem.contentDetails?.videoId || snippet.resourceId?.videoId}`,

    // Metadata
    fetchedAt: new Date().toISOString()
  };
}

// ============================================================================
// SYNOPSIS GENERATION
// ============================================================================

/**
 * Generate a synopsis for a video
 * Uses Claude API if available, otherwise creates a structured template
 */
async function generateSynopsis(video, transcript = null) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Build content for analysis
  const contentForAnalysis = `
Title: ${video.title}

Description:
${video.description}

${transcript ? `Transcript:\n${transcript}` : '(No transcript available - analysis based on title and description)'}

Duration: ${video.duration}
Published: ${video.publishedAt}
`.trim();

  // If we have an API key, use Claude to generate synopsis
  if (anthropicKey) {
    try {
      const synopsis = await generateAISynopsis(anthropicKey, video, contentForAnalysis);
      return synopsis;
    } catch (error) {
      console.warn(`  Warning: AI synopsis generation failed: ${error.message}`);
      console.warn('  Falling back to template-based synopsis');
    }
  }

  // Fallback: template-based synopsis
  return generateTemplateSynopsis(video);
}

/**
 * Generate AI-powered synopsis using Claude
 */
async function generateAISynopsis(apiKey, video, content) {
  const prompt = `You are analyzing a YouTube video from ${CONFIG.channelName} to create a helpful synopsis.

Video Content:
${content}

Please provide a synopsis using this framework:

${CONFIG.synopsisFramework.sections.map(s => `## ${s.title}\n${s.prompt}`).join('\n\n')}

Keep each section concise but valuable. Focus on actionable insights the viewer can use.
If the transcript is not available, do your best with the title and description, and note that your analysis is limited.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  const synopsisText = data.content?.[0]?.text || '';

  // Parse the structured synopsis
  return {
    raw: synopsisText,
    generatedAt: new Date().toISOString(),
    model: 'claude-3-haiku-20240307',
    hasTranscript: content.includes('Transcript:'),
    framework: CONFIG.synopsisFramework.name
  };
}

/**
 * Generate a template-based synopsis (no AI)
 */
function generateTemplateSynopsis(video) {
  return {
    raw: `## 🎯 Core Message
*Synopsis pending - run with ANTHROPIC_API_KEY for AI-generated synopsis*

## 💡 Key Insights
Based on the title "${video.title}":
- Topic appears to be: ${extractTopicFromTitle(video.title)}
- Duration: ${video.duration}

## ✅ Actionable Takeaways
- Watch the full video for complete context
- ${video.url}

## 📚 Context
Published: ${new Date(video.publishedAt).toLocaleDateString()}
Views: ${video.viewCount.toLocaleString()}

## 💬 Description Preview
${video.description?.substring(0, 500)}${video.description?.length > 500 ? '...' : ''}
`,
    generatedAt: new Date().toISOString(),
    model: 'template',
    hasTranscript: false,
    framework: 'basic'
  };
}

/**
 * Simple topic extraction from video title
 */
function extractTopicFromTitle(title) {
  // Remove common YouTube title patterns
  const cleaned = title
    .replace(/\|.*$/, '')
    .replace(/#\w+/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();

  return cleaned || title;
}

// ============================================================================
// CACHING & COMPARISON
// ============================================================================

/**
 * Load existing cache to compare for new videos
 */
function loadExistingCache(dataDir) {
  const cacheFile = path.join(dataDir, 'all-videos.json');

  if (!fs.existsSync(cacheFile)) {
    return { videos: [], videoIds: new Set() };
  }

  try {
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const videoIds = new Set(data.videos?.map(v => v.id) || []);
    return { videos: data.videos || [], videoIds };
  } catch (error) {
    console.warn(`Warning: Could not load existing cache: ${error.message}`);
    return { videos: [], videoIds: new Set() };
  }
}

/**
 * Identify new videos that weren't in the previous cache
 */
function identifyNewVideos(currentVideos, previousCache) {
  return currentVideos.filter(video => !previousCache.videoIds.has(video.id));
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const API_KEY = process.env.YOUTUBE_API_KEY;

  if (!API_KEY) {
    console.error('Error: Missing required environment variable YOUTUBE_API_KEY');
    console.error('');
    console.error('To get a YouTube API key:');
    console.error('1. Go to https://console.cloud.google.com/');
    console.error('2. Create a project (or select existing)');
    console.error('3. Enable "YouTube Data API v3"');
    console.error('4. Create credentials -> API Key');
    console.error('5. Set YOUTUBE_API_KEY environment variable');
    process.exit(1);
  }

  // Setup directories
  const dataDir = path.join(__dirname, '..', 'data', 'youtube');
  const synopsesDir = path.join(dataDir, 'synopses');

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(synopsesDir, { recursive: true });

  const generated = new Date().toISOString();

  console.log('='.repeat(60));
  console.log('YouTube Channel Monitor - ' + CONFIG.channelName);
  console.log('='.repeat(60));
  console.log(`Timestamp: ${generated}`);
  console.log('');

  // Load existing cache
  console.log('Loading existing cache...');
  const previousCache = loadExistingCache(dataDir);
  console.log(`  Found ${previousCache.videos.length} previously cached videos`);
  console.log('');

  let channelId = CONFIG.channelId;

  // If channel ID is not configured, try to find it
  if (channelId === 'CHANNEL_ID_TO_BE_CONFIGURED') {
    console.log(`Searching for channel: ${CONFIG.channelName}...`);
    const searchResults = await searchForChannel(API_KEY, CONFIG.channelName);

    if (searchResults.length === 0) {
      console.error('Could not find channel. Please configure YOUTUBE_CHANNEL_ID manually.');
      process.exit(1);
    }

    console.log('Found channels:');
    searchResults.forEach((ch, i) => {
      console.log(`  ${i + 1}. ${ch.snippet.title} (${ch.snippet.channelId})`);
      console.log(`     ${ch.snippet.description?.substring(0, 100)}...`);
    });

    // Use first result
    channelId = searchResults[0].snippet.channelId;
    console.log(`\nUsing: ${searchResults[0].snippet.title}`);
    console.log(`Channel ID: ${channelId}`);
    console.log('');
    console.log('TIP: Set YOUTUBE_CHANNEL_ID environment variable to skip search next time');
    console.log('');
  }

  // Get uploads playlist
  console.log('Fetching channel info...');
  const { playlistId, channelTitle, subscriberCount, videoCount } =
    await getUploadsPlaylistId(API_KEY, channelId);

  console.log(`  Channel: ${channelTitle}`);
  console.log(`  Subscribers: ${parseInt(subscriberCount).toLocaleString()}`);
  console.log(`  Total Videos: ${parseInt(videoCount).toLocaleString()}`);
  console.log('');

  // Fetch recent videos
  console.log(`Fetching last ${CONFIG.maxVideos} videos...`);
  const playlistItems = await fetchPlaylistVideos(API_KEY, playlistId, CONFIG.maxVideos);
  console.log(`  Retrieved ${playlistItems.length} videos from playlist`);

  // Get detailed video info
  const videoIds = playlistItems.map(item =>
    item.contentDetails?.videoId || item.snippet?.resourceId?.videoId
  ).filter(Boolean);

  console.log('Fetching video details...');
  const videoDetails = await fetchVideoDetails(API_KEY, videoIds);
  const detailsMap = new Map(videoDetails.map(v => [v.id, v]));

  // Transform videos
  const videos = playlistItems.map(item => {
    const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
    return transformVideo(item, detailsMap.get(videoId));
  });

  console.log('');

  // Identify new videos
  const newVideos = identifyNewVideos(videos, previousCache);

  if (newVideos.length > 0) {
    console.log('🎉 NEW VIDEOS DETECTED!');
    console.log('='.repeat(60));

    for (const video of newVideos) {
      console.log(`\n📺 ${video.title}`);
      console.log(`   Published: ${new Date(video.publishedAt).toLocaleString()}`);
      console.log(`   Duration: ${video.duration}`);
      console.log(`   URL: ${video.url}`);

      // Generate synopsis for new videos
      console.log('   Generating synopsis...');
      const transcript = await fetchVideoTranscript(video.id);
      const synopsis = await generateSynopsis(video, transcript);

      // Save individual synopsis
      const synopsisFile = path.join(synopsesDir, `${video.id}.json`);
      fs.writeFileSync(synopsisFile, JSON.stringify({
        video: {
          id: video.id,
          title: video.title,
          url: video.url,
          publishedAt: video.publishedAt,
          duration: video.duration
        },
        synopsis,
        generatedAt: generated
      }, null, 2));

      console.log(`   ✅ Synopsis saved to: synopses/${video.id}.json`);

      // Print synopsis preview
      if (synopsis.raw) {
        console.log('\n   --- Synopsis Preview ---');
        const preview = synopsis.raw.split('\n').slice(0, 10).map(l => '   ' + l).join('\n');
        console.log(preview);
        if (synopsis.raw.split('\n').length > 10) {
          console.log('   ...(see full synopsis in file)');
        }
      }
    }
    console.log('');
  } else {
    console.log('No new videos since last check.');
    console.log('');
  }

  // Save all videos cache
  const allVideosOutput = {
    generated,
    version: '1.0.0',
    source: 'youtube',
    channel: {
      id: channelId,
      name: channelTitle,
      handle: CONFIG.channelHandle,
      subscribers: parseInt(subscriberCount),
      totalVideos: parseInt(videoCount)
    },
    videoCount: videos.length,
    videos
  };

  fs.writeFileSync(
    path.join(dataDir, 'all-videos.json'),
    JSON.stringify(allVideosOutput, null, 2)
  );

  // Save new videos separately for easy access
  if (newVideos.length > 0) {
    const newVideosOutput = {
      generated,
      detectedAt: generated,
      count: newVideos.length,
      videos: newVideos
    };

    fs.writeFileSync(
      path.join(dataDir, 'new-videos.json'),
      JSON.stringify(newVideosOutput, null, 2)
    );
  }

  // Save metadata
  const metadata = {
    generated,
    version: '1.0.0',
    channel: {
      id: channelId,
      name: channelTitle,
      handle: CONFIG.channelHandle
    },
    totalVideosCached: videos.length,
    newVideosCount: newVideos.length,
    lastNewVideo: newVideos[0]?.publishedAt || null,
    synopsisFramework: CONFIG.synopsisFramework.name
  };

  fs.writeFileSync(
    path.join(dataDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  // Summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Channel: ${channelTitle}`);
  console.log(`Videos cached: ${videos.length}`);
  console.log(`New videos: ${newVideos.length}`);
  if (newVideos.length > 0) {
    console.log(`\nNew video titles:`);
    newVideos.forEach(v => console.log(`  - ${v.title}`));
  }
  console.log(`\nOutput directory: ${dataDir}`);
  console.log('');

  // Return summary for GitHub Actions
  return {
    channelName: channelTitle,
    totalCached: videos.length,
    newVideos: newVideos.length,
    newVideoTitles: newVideos.map(v => v.title)
  };
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
