/**
 * AI Daily Brief - Comprehensive AI News Aggregator
 *
 * Aggregates AI-related content from multiple sources to keep you informed on:
 * - Investment & funding news
 * - New product launches & reviews
 * - Industry developments & analysis
 * - Tutorials & how-to content
 * - Research breakthroughs
 *
 * Sources:
 * - YouTube channels (via fetch-youtube-videos.js)
 * - AI news RSS feeds (TechCrunch, The Verge, VentureBeat, etc.)
 * - Product Hunt AI products
 * - AI newsletters & blogs
 *
 * Usage:
 *   node scripts/ai-daily-brief.js                    # Fetch all sources
 *   node scripts/ai-daily-brief.js --brief            # Show today's brief
 *   node scripts/ai-daily-brief.js --full <item-id>   # Deep dive on specific item
 *   node scripts/ai-daily-brief.js --sources          # List configured sources
 *
 * Environment variables:
 *   - YOUTUBE_API_KEY: For YouTube channel monitoring
 *   - ANTHROPIC_API_KEY: For AI-generated summaries
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// SOURCE CONFIGURATION
// ============================================================================

const SOURCES = {
  // ============================================================================
  // YOUTUBE CHANNELS - AI Content Creators
  // Comprehensive list of top AI YouTube creators for monitoring
  // ============================================================================
  youtube: {
    enabled: true,
    type: 'youtube',
    name: 'YouTube Channels',
    description: 'AI-focused YouTube creators',
    channels: [
      // --- Business & Productivity ---
      {
        id: process.env.YOUTUBE_CHANNEL_NATE || 'CONFIGURE',
        name: 'Nate B Jones',
        handle: '@NateBJones',
        searchQuery: 'Nate B Jones',
        focus: ['AI business', 'productivity', 'tools'],
        priority: 'high'
      },

      // --- AI News & Commentary ---
      {
        id: process.env.YOUTUBE_CHANNEL_AIEXPLAINED || 'CONFIGURE',
        name: 'AI Explained',
        handle: '@aiaboristhebard',
        searchQuery: 'AI Explained',
        focus: ['AI news', 'explainers', 'industry analysis'],
        priority: 'high'
      },
      {
        id: process.env.YOUTUBE_CHANNEL_MATTWOLFE || 'CONFIGURE',
        name: 'Matt Wolfe',
        handle: '@maboroshi',
        searchQuery: 'Matt Wolfe AI',
        focus: ['AI tools', 'tutorials', 'news'],
        priority: 'high'
      },
      {
        id: process.env.YOUTUBE_CHANNEL_WESROTH || 'CONFIGURE',
        name: 'Wes Roth',
        handle: '@WesRoth',
        searchQuery: 'Wes Roth AI',
        focus: ['AI commentary', 'breaking news', 'trends'],
        priority: 'high'
      },

      // --- Educational & Research ---
      {
        id: process.env.YOUTUBE_CHANNEL_TWOMINUTEPAPERS || 'CONFIGURE',
        name: 'Two Minute Papers',
        handle: '@TwoMinutePapers',
        searchQuery: 'Two Minute Papers',
        focus: ['research papers', 'breakthroughs', 'visual AI'],
        priority: 'high'
      },
      {
        id: process.env.YOUTUBE_CHANNEL_YANNICKILCHER || 'CONFIGURE',
        name: 'Yannic Kilcher',
        handle: '@YannicKilcher',
        searchQuery: 'Yannic Kilcher',
        focus: ['paper reviews', 'deep learning', 'technical analysis'],
        priority: 'medium'
      },
      {
        id: process.env.YOUTUBE_CHANNEL_3BLUE1BROWN || 'CONFIGURE',
        name: '3Blue1Brown',
        handle: '@3blue1brown',
        searchQuery: '3Blue1Brown',
        focus: ['math', 'neural networks', 'visualizations'],
        priority: 'medium'
      },
      {
        id: process.env.YOUTUBE_CHANNEL_DEEPLEARNINGAI || 'CONFIGURE',
        name: 'DeepLearning.AI',
        handle: '@Deeplearningai',
        searchQuery: 'DeepLearning.AI',
        focus: ['courses', 'tutorials', 'Andrew Ng'],
        priority: 'medium'
      },

      // --- Interviews & Thought Leadership ---
      {
        id: process.env.YOUTUBE_CHANNEL_LEXFRIDMAN || 'CONFIGURE',
        name: 'Lex Fridman',
        handle: '@lexfridman',
        searchQuery: 'Lex Fridman',
        focus: ['interviews', 'AI leaders', 'philosophy'],
        priority: 'medium'
      },

      // --- AI Safety & Ethics ---
      {
        id: process.env.YOUTUBE_CHANNEL_ROBERTMILES || 'CONFIGURE',
        name: 'Robert Miles',
        handle: '@RobertMilesAI',
        searchQuery: 'Robert Miles AI',
        focus: ['AI safety', 'alignment', 'risks'],
        priority: 'medium'
      },

      // --- Practical Tools & Tutorials ---
      {
        id: process.env.YOUTUBE_CHANNEL_SKILLLEAPAI || 'CONFIGURE',
        name: 'Skill Leap AI',
        handle: '@SkillLeapAI',
        searchQuery: 'Skill Leap AI',
        focus: ['tutorials', 'productivity', 'how-to'],
        priority: 'medium'
      },

      // --- AI Labs Official Channels ---
      {
        id: process.env.YOUTUBE_CHANNEL_ANTHROPIC || 'CONFIGURE',
        name: 'Anthropic',
        handle: '@AnthropicAI',
        searchQuery: 'Anthropic AI',
        focus: ['announcements', 'research', 'Claude'],
        priority: 'high'
      },
      {
        id: process.env.YOUTUBE_CHANNEL_OPENAI || 'CONFIGURE',
        name: 'OpenAI',
        handle: '@OpenAI',
        searchQuery: 'OpenAI',
        focus: ['announcements', 'products', 'research'],
        priority: 'high'
      },
      {
        id: process.env.YOUTUBE_CHANNEL_GOOGLEAI || 'CONFIGURE',
        name: 'Google AI',
        handle: '@Google_AI',
        searchQuery: 'Google AI',
        focus: ['Gemini', 'research', 'products'],
        priority: 'high'
      },

      // --- AI Creative & Filmmaking ---
      {
        id: process.env.YOUTUBE_CHANNEL_CURIOUSREFUGE || 'CONFIGURE',
        name: 'Curious Refuge',
        handle: '@curiousrefuge',
        searchQuery: 'Curious Refuge AI',
        focus: ['AI video', 'creative tools', 'filmmaking'],
        priority: 'low'
      }
    ]
  },

  // ============================================================================
  // AI NEWS SITES - Major Publications
  // RSS feeds from tech publications covering AI
  // ============================================================================
  rssFeeds: {
    enabled: true,
    type: 'rss',
    name: 'AI News Feeds',
    description: 'Major tech publications AI coverage',
    feeds: [
      // --- Tier 1: Must-Read Daily ---
      {
        url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
        name: 'TechCrunch AI',
        focus: ['funding', 'startups', 'products'],
        priority: 'high'
      },
      {
        url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
        name: 'The Verge AI',
        focus: ['products', 'reviews', 'industry'],
        priority: 'high'
      },
      {
        url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
        name: 'MIT Tech Review AI',
        focus: ['research', 'deep-dives', 'future'],
        priority: 'high'
      },
      {
        url: 'https://www.wired.com/feed/tag/ai/latest/rss',
        name: 'Wired AI',
        focus: ['analysis', 'society', 'ethics'],
        priority: 'high'
      },

      // --- Tier 2: Enterprise & Business ---
      {
        url: 'https://venturebeat.com/category/ai/feed/',
        name: 'VentureBeat AI',
        focus: ['enterprise', 'research', 'business'],
        priority: 'medium'
      },
      {
        url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml',
        name: 'ZDNet AI',
        focus: ['enterprise', 'how-to', 'reviews'],
        priority: 'medium'
      },
      {
        url: 'https://www.infoworld.com/category/artificial-intelligence/index.rss',
        name: 'InfoWorld AI',
        focus: ['enterprise', 'development', 'tools'],
        priority: 'low'
      },

      // --- Tier 3: AI Lab Official Blogs ---
      {
        url: 'https://openai.com/blog/rss/',
        name: 'OpenAI Blog',
        focus: ['announcements', 'research', 'products'],
        priority: 'high'
      },
      {
        url: 'https://www.anthropic.com/research/rss.xml',
        name: 'Anthropic Research',
        focus: ['research', 'safety', 'Claude'],
        priority: 'high'
      },
      {
        url: 'https://blog.google/technology/ai/rss/',
        name: 'Google AI Blog',
        focus: ['Gemini', 'research', 'products'],
        priority: 'high'
      },
      {
        url: 'https://ai.meta.com/blog/rss/',
        name: 'Meta AI Blog',
        focus: ['Llama', 'research', 'open source'],
        priority: 'medium'
      },
      {
        url: 'https://blogs.microsoft.com/ai/feed/',
        name: 'Microsoft AI Blog',
        focus: ['Copilot', 'Azure', 'enterprise'],
        priority: 'medium'
      },

      // --- Tier 4: Specialized ---
      {
        url: 'https://huggingface.co/blog/feed.xml',
        name: 'Hugging Face Blog',
        focus: ['open source', 'models', 'tools'],
        priority: 'medium'
      },
      {
        url: 'https://www.deepmind.com/blog/rss.xml',
        name: 'DeepMind Blog',
        focus: ['research', 'breakthroughs', 'science'],
        priority: 'medium'
      }
    ]
  },

  // ============================================================================
  // AI NEWSLETTERS - Curated Daily/Weekly Digests
  // Premium newsletter content (RSS where available)
  // ============================================================================
  newsletters: {
    enabled: true,
    type: 'rss',
    name: 'AI Newsletters',
    description: 'Curated AI newsletters and digests',
    feeds: [
      {
        url: 'https://www.bensbites.com/rss',
        name: "Ben's Bites",
        focus: ['daily digest', 'tools', 'business'],
        priority: 'high'
      },
      {
        url: 'https://tldr.tech/ai/rss',
        name: 'TLDR AI',
        focus: ['daily digest', 'research', 'news'],
        priority: 'high'
      },
      {
        url: 'https://thesequence.substack.com/feed',
        name: 'TheSequence',
        focus: ['technical', 'research', 'deep dives'],
        priority: 'medium'
      },
      {
        url: 'https://www.latent.space/feed',
        name: 'Latent Space',
        focus: ['AI engineering', 'technical', 'infrastructure'],
        priority: 'medium'
      },
      {
        url: 'https://importai.substack.com/feed',
        name: 'Import AI',
        focus: ['research', 'policy', 'weekly digest'],
        priority: 'medium'
      },
      {
        url: 'https://jack-clark.net/feed/',
        name: 'Jack Clark (Import AI author)',
        focus: ['policy', 'safety', 'industry'],
        priority: 'low'
      }
    ]
  },

  // ============================================================================
  // AI INVESTMENT & FUNDING NEWS
  // Track funding rounds, acquisitions, and valuations
  // ============================================================================
  funding: {
    enabled: true,
    type: 'rss',
    name: 'AI Funding News',
    description: 'Investment and funding in AI companies',
    feeds: [
      {
        url: 'https://news.crunchbase.com/feed/',
        name: 'Crunchbase News',
        filter: ['artificial intelligence', 'AI', 'machine learning', 'LLM', 'generative', 'OpenAI', 'Anthropic'],
        focus: ['funding', 'acquisitions', 'valuations'],
        priority: 'high'
      },
      {
        url: 'https://vcnewsdaily.com/feed/',
        name: 'VC News Daily',
        filter: ['AI', 'artificial intelligence', 'machine learning', 'generative'],
        focus: ['startups', 'funding', 'VC'],
        priority: 'medium'
      },
      {
        url: 'https://techcrunch.com/category/venture/feed/',
        name: 'TechCrunch Venture',
        filter: ['AI', 'artificial intelligence', 'machine learning', 'LLM'],
        focus: ['funding', 'startups', 'deals'],
        priority: 'medium'
      }
    ]
  },

  // ============================================================================
  // AI PRODUCT LAUNCHES
  // New AI products and tools
  // ============================================================================
  products: {
    enabled: true,
    type: 'rss',
    name: 'AI Product Launches',
    description: 'New AI products and tool announcements',
    feeds: [
      {
        url: 'https://www.producthunt.com/feed?category=artificial-intelligence',
        name: 'Product Hunt AI',
        focus: ['new products', 'launches', 'tools'],
        priority: 'medium'
      },
      {
        url: 'https://theresanaiforthat.com/rss/',
        name: "There's An AI For That",
        focus: ['AI tools', 'directory', 'new launches'],
        priority: 'medium'
      }
    ]
  },

  // ============================================================================
  // AI RESEARCH (Optional - can be overwhelming)
  // Academic papers and research breakthroughs
  // ============================================================================
  research: {
    enabled: false, // Set to true if you want academic papers
    type: 'rss',
    name: 'AI Research Papers',
    description: 'Latest AI research from arXiv and labs',
    feeds: [
      {
        url: 'http://export.arxiv.org/rss/cs.AI',
        name: 'arXiv AI',
        focus: ['research', 'papers', 'breakthroughs'],
        priority: 'low'
      },
      {
        url: 'http://export.arxiv.org/rss/cs.LG',
        name: 'arXiv Machine Learning',
        focus: ['research', 'papers', 'algorithms'],
        priority: 'low'
      },
      {
        url: 'http://export.arxiv.org/rss/cs.CL',
        name: 'arXiv NLP/LLMs',
        focus: ['language models', 'NLP', 'transformers'],
        priority: 'low'
      }
    ]
  },

  // ============================================================================
  // AI POLICY & REGULATION
  // Government and regulatory news about AI
  // ============================================================================
  policy: {
    enabled: true,
    type: 'rss',
    name: 'AI Policy & Regulation',
    description: 'AI governance, regulation, and policy news',
    feeds: [
      {
        url: 'https://www.brookings.edu/topic/artificial-intelligence/feed/',
        name: 'Brookings AI',
        focus: ['policy', 'governance', 'regulation'],
        priority: 'low'
      },
      {
        url: 'https://cset.georgetown.edu/feed/',
        name: 'Georgetown CSET',
        focus: ['security', 'policy', 'geopolitics'],
        priority: 'low'
      }
    ]
  }
};

// Content categories for filtering
const CATEGORIES = {
  funding: {
    name: 'Funding & Investment',
    icon: '💰',
    keywords: ['raises', 'funding', 'investment', 'valuation', 'series', 'seed', 'acquisition', 'acquired', 'ipo']
  },
  products: {
    name: 'Product Launches',
    icon: '🚀',
    keywords: ['launches', 'announces', 'releases', 'new', 'introducing', 'unveils', 'debuts']
  },
  reviews: {
    name: 'Reviews & Analysis',
    icon: '📊',
    keywords: ['review', 'hands-on', 'tested', 'comparison', 'vs', 'benchmark', 'analysis']
  },
  howto: {
    name: 'Tutorials & How-To',
    icon: '📚',
    keywords: ['how to', 'tutorial', 'guide', 'tips', 'learn', 'using', 'workflow']
  },
  industry: {
    name: 'Industry News',
    icon: '🏢',
    keywords: ['industry', 'market', 'report', 'trend', 'future', 'impact', 'regulation']
  },
  research: {
    name: 'Research & Breakthroughs',
    icon: '🔬',
    keywords: ['research', 'paper', 'breakthrough', 'discovery', 'study', 'model', 'algorithm']
  }
};

// ============================================================================
// RSS FEED FETCHING
// ============================================================================

/**
 * Parse RSS/Atom feed XML
 * Simple parser for common feed formats
 */
function parseRSSFeed(xmlText, feedConfig) {
  const items = [];

  // Try to extract items (works for RSS 2.0 and Atom)
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1] || match[2];

    const title = extractXMLTag(itemXml, 'title');
    const link = extractXMLTag(itemXml, 'link') || extractXMLAttr(itemXml, 'link', 'href');
    const description = extractXMLTag(itemXml, 'description') ||
      extractXMLTag(itemXml, 'summary') ||
      extractXMLTag(itemXml, 'content');
    const pubDate = extractXMLTag(itemXml, 'pubDate') ||
      extractXMLTag(itemXml, 'published') ||
      extractXMLTag(itemXml, 'updated');
    const author = extractXMLTag(itemXml, 'author') ||
      extractXMLTag(itemXml, 'dc:creator');

    if (title && link) {
      items.push({
        id: generateItemId(link),
        title: cleanHTMLTags(title),
        link: link,
        description: cleanHTMLTags(description || '').substring(0, 1000),
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        author: cleanHTMLTags(author || feedConfig.name),
        source: feedConfig.name,
        sourceType: 'rss',
        priority: feedConfig.priority || 'medium',
        focus: feedConfig.focus || []
      });
    }
  }

  return items;
}

function extractXMLTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? (match[1] || match[2] || '').trim() : null;
}

function extractXMLAttr(xml, tag, attr) {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function cleanHTMLTags(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function generateItemId(url) {
  // Create a simple hash from the URL
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'item_' + Math.abs(hash).toString(36);
}

/**
 * Fetch and parse an RSS feed
 */
async function fetchRSSFeed(feedConfig) {
  try {
    const response = await fetch(feedConfig.url, {
      headers: {
        'User-Agent': 'AI-Daily-Brief/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    if (!response.ok) {
      console.warn(`  Warning: Could not fetch ${feedConfig.name}: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    const items = parseRSSFeed(xmlText, feedConfig);

    // Apply keyword filter if specified
    if (feedConfig.filter && feedConfig.filter.length > 0) {
      const filterRegex = new RegExp(feedConfig.filter.join('|'), 'i');
      return items.filter(item =>
        filterRegex.test(item.title) || filterRegex.test(item.description)
      );
    }

    return items;
  } catch (error) {
    console.warn(`  Warning: Error fetching ${feedConfig.name}: ${error.message}`);
    return [];
  }
}

// ============================================================================
// CONTENT CATEGORIZATION
// ============================================================================

/**
 * Categorize an item based on its content
 */
function categorizeItem(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  const categories = [];

  for (const [key, category] of Object.entries(CATEGORIES)) {
    const matchCount = category.keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    if (matchCount > 0) {
      categories.push({ key, name: category.name, icon: category.icon, score: matchCount });
    }
  }

  // Sort by match score and return top categories
  categories.sort((a, b) => b.score - a.score);
  return categories.slice(0, 2);
}

/**
 * Calculate relevance score for an item
 */
function calculateRelevance(item) {
  let score = 50; // Base score

  // Priority boost
  if (item.priority === 'high') score += 20;
  if (item.priority === 'low') score -= 10;

  // Recency boost (items from last 24h get boost)
  const hoursSincePublished = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60);
  if (hoursSincePublished < 6) score += 30;
  else if (hoursSincePublished < 24) score += 15;
  else if (hoursSincePublished > 72) score -= 20;

  // Category boost
  const categories = categorizeItem(item);
  if (categories.length > 0) score += 10;

  return Math.min(100, Math.max(0, score));
}

// ============================================================================
// QUICK SYNOPSIS GENERATION
// ============================================================================

async function generateQuickSynopsis(item) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    return {
      content: generateFallbackSynopsis(item),
      model: 'fallback',
      tier: 'quick'
    };
  }

  const prompt = `Analyze this AI news item and provide a QUICK SYNOPSIS so the reader can decide if they want to learn more.

TITLE: ${item.title}
SOURCE: ${item.source}
PUBLISHED: ${new Date(item.publishedAt).toLocaleDateString()}

CONTENT:
${item.description}

Provide your analysis in this EXACT format:

## What This Is About
[2-3 sentences explaining specifically what this news/article covers. Be concrete.]

## Key Points
- [Point 1: specific detail]
- [Point 2: specific detail]
- [Point 3: specific detail if applicable]

## Why It Matters
[1-2 sentences on relevance/impact for someone following AI developments]

## Who Should Read This
[Brief: e.g., "AI startup founders", "Developers using LLMs", "Anyone tracking AI investments"]

## Category
[One of: Funding, Product Launch, Review, Tutorial, Industry News, Research]`;

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
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      model: 'claude-3-haiku-20240307',
      tier: 'quick',
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      content: generateFallbackSynopsis(item),
      model: 'fallback',
      tier: 'quick',
      error: error.message
    };
  }
}

function generateFallbackSynopsis(item) {
  const categories = categorizeItem(item);
  const categoryStr = categories.map(c => `${c.icon} ${c.name}`).join(', ') || 'General AI News';

  return `## What This Is About
${item.title}

## Source
${item.source} - ${new Date(item.publishedAt).toLocaleDateString()}

## Description
${item.description.substring(0, 500)}${item.description.length > 500 ? '...' : ''}

## Category
${categoryStr}

---
Set ANTHROPIC_API_KEY for AI-generated synopsis.`;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

function loadBriefCache(dataDir) {
  const cacheFile = path.join(dataDir, 'ai-brief-cache.json');

  if (!fs.existsSync(cacheFile)) {
    return { items: [], itemIds: new Set() };
  }

  try {
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return {
      items: data.items || [],
      itemIds: new Set((data.items || []).map(i => i.id))
    };
  } catch {
    return { items: [], itemIds: new Set() };
  }
}

function saveBriefCache(dataDir, items) {
  const cacheFile = path.join(dataDir, 'ai-brief-cache.json');
  fs.writeFileSync(cacheFile, JSON.stringify({
    generated: new Date().toISOString(),
    itemCount: items.length,
    items
  }, null, 2));
}

function loadPendingBrief(dataDir) {
  const pendingFile = path.join(dataDir, 'pending-brief.json');
  if (!fs.existsSync(pendingFile)) return { items: [] };
  try {
    return JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
  } catch {
    return { items: [] };
  }
}

function savePendingBrief(dataDir, items) {
  const pendingFile = path.join(dataDir, 'pending-brief.json');
  fs.writeFileSync(pendingFile, JSON.stringify({
    generated: new Date().toISOString(),
    count: items.length,
    items
  }, null, 2));
}

// ============================================================================
// BRIEF DISPLAY
// ============================================================================

function displayBrief(dataDir) {
  const pending = loadPendingBrief(dataDir);
  const youtubeData = loadYouTubeData(dataDir);

  console.log('');
  console.log('='.repeat(80));
  console.log('  AI DAILY BRIEF');
  console.log('  ' + new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }));
  console.log('='.repeat(80));
  console.log('');

  // YouTube section
  if (youtubeData.videos && youtubeData.videos.length > 0) {
    console.log('  📺 NEW YOUTUBE VIDEOS');
    console.log('  ' + '-'.repeat(76));
    youtubeData.videos.slice(0, 5).forEach((video, i) => {
      console.log(`  ${i + 1}. [${video.channelName}] ${video.title}`);
      console.log(`     Duration: ${video.duration} | ${new Date(video.publishedAt).toLocaleDateString()}`);
      console.log(`     ID: ${video.id}`);
      console.log('');
    });
    console.log('');
  }

  // News items by category
  if (pending.items && pending.items.length > 0) {
    // Group by category
    const byCategory = {};
    pending.items.forEach(item => {
      const cats = categorizeItem(item);
      const catKey = cats[0]?.key || 'industry';
      if (!byCategory[catKey]) byCategory[catKey] = [];
      byCategory[catKey].push(item);
    });

    for (const [catKey, items] of Object.entries(byCategory)) {
      const category = CATEGORIES[catKey];
      console.log(`  ${category.icon} ${category.name.toUpperCase()}`);
      console.log('  ' + '-'.repeat(76));

      items.slice(0, 5).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.title}`);
        console.log(`     Source: ${item.source} | ${new Date(item.publishedAt).toLocaleDateString()}`);
        console.log(`     ID: ${item.id}`);

        if (item.quickSynopsis?.content) {
          const preview = item.quickSynopsis.content.split('\n').slice(0, 4);
          preview.forEach(line => console.log(`     ${line}`));
        }
        console.log('');
      });
      console.log('');
    }
  } else {
    console.log('  No new items. Run without --brief to fetch latest content.');
  }

  console.log('='.repeat(80));
  console.log('  Commands:');
  console.log('    --full <id>  : Get detailed synopsis for an item');
  console.log('    (no args)    : Fetch latest content from all sources');
  console.log('='.repeat(80));
  console.log('');
}

function loadYouTubeData(dataDir) {
  const ytFile = path.join(dataDir, 'youtube', 'pending-review.json');
  if (!fs.existsSync(ytFile)) return { videos: [] };
  try {
    return JSON.parse(fs.readFileSync(ytFile, 'utf8'));
  } catch {
    return { videos: [] };
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dataDir = path.join(__dirname, '..', 'data', 'ai-brief');

  fs.mkdirSync(dataDir, { recursive: true });

  // Handle --brief flag
  if (args.includes('--brief')) {
    displayBrief(path.join(__dirname, '..', 'data'));
    return;
  }

  // Handle --sources flag
  if (args.includes('--sources')) {
    console.log('\nConfigured Sources:\n');
    for (const [key, source] of Object.entries(SOURCES)) {
      const status = source.enabled ? '✅' : '❌';
      console.log(`${status} ${source.name}`);
      console.log(`   Type: ${source.type}`);
      console.log(`   ${source.description}`);
      if (source.feeds) {
        console.log(`   Feeds: ${source.feeds.length}`);
      }
      if (source.channels) {
        console.log(`   Channels: ${source.channels.length}`);
      }
      console.log('');
    }
    return;
  }

  // Handle --full flag
  const fullIndex = args.indexOf('--full');
  if (fullIndex !== -1) {
    const itemId = args[fullIndex + 1];
    if (!itemId) {
      console.error('Error: --full requires an item ID');
      process.exit(1);
    }
    // TODO: Implement full synopsis generation for news items
    console.log(`Full synopsis for ${itemId} - coming soon`);
    return;
  }

  // Normal execution - fetch all sources
  console.log('');
  console.log('='.repeat(80));
  console.log('  AI DAILY BRIEF - Fetching Content');
  console.log('='.repeat(80));
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log('');

  const previousCache = loadBriefCache(dataDir);
  console.log(`  Previously cached items: ${previousCache.items.length}`);
  console.log('');

  const allNewItems = [];

  // Fetch RSS feeds
  for (const [sourceKey, source] of Object.entries(SOURCES)) {
    if (!source.enabled || source.type !== 'rss') continue;

    console.log(`  📡 ${source.name}`);

    for (const feed of (source.feeds || [])) {
      console.log(`     Fetching: ${feed.name}...`);
      const items = await fetchRSSFeed(feed);

      // Filter to new items only
      const newItems = items.filter(item => !previousCache.itemIds.has(item.id));

      if (newItems.length > 0) {
        console.log(`     Found ${newItems.length} new items`);

        // Generate quick synopsis for each new item
        for (const item of newItems.slice(0, 5)) { // Limit to avoid API overuse
          item.categories = categorizeItem(item);
          item.relevanceScore = calculateRelevance(item);
          item.quickSynopsis = await generateQuickSynopsis(item);
          allNewItems.push(item);
        }
      } else {
        console.log(`     No new items`);
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 200));
    }
    console.log('');
  }

  // Also run YouTube fetch
  console.log('  📺 YouTube Channels');
  console.log('     (Run fetch-youtube-videos.js separately for YouTube content)');
  console.log('');

  // Save updated cache
  const allItems = [...previousCache.items, ...allNewItems];
  saveBriefCache(dataDir, allItems);

  // Update pending brief
  const existingPending = loadPendingBrief(dataDir);
  const allPending = [...(existingPending.items || []), ...allNewItems];

  // Sort by relevance and recency
  allPending.sort((a, b) => {
    const scoreA = a.relevanceScore || 50;
    const scoreB = b.relevanceScore || 50;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  savePendingBrief(dataDir, allPending.slice(0, 50)); // Keep top 50

  // Summary
  console.log('='.repeat(80));
  console.log('  SUMMARY');
  console.log('='.repeat(80));
  console.log(`  New items found: ${allNewItems.length}`);
  console.log(`  Pending review: ${Math.min(allPending.length, 50)}`);
  console.log('');

  if (allNewItems.length > 0) {
    console.log('  Top new items:');
    allNewItems.slice(0, 5).forEach(item => {
      const cats = item.categories.map(c => c.icon).join('');
      console.log(`    ${cats} [${item.source}] ${item.title.substring(0, 60)}...`);
    });
    console.log('');
    console.log('  Run with --brief to see the full daily brief');
  }

  console.log('');
  console.log(`  Output: ${dataDir}`);
  console.log('='.repeat(80));
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
