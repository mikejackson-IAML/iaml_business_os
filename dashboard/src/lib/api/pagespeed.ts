// Google PageSpeed Insights API
// API docs: https://developers.google.com/speed/docs/insights/v5/get-started

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint (seconds)
  fid: number; // First Input Delay (ms) - now INP in field data
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte (seconds)
  fcp: number; // First Contentful Paint (seconds)
  performance: number; // Lighthouse performance score (0-100)
  accessibility: number; // Lighthouse accessibility score (0-100)
  seo: number; // Lighthouse SEO score (0-100)
  bestPractices: number; // Lighthouse best practices score (0-100)
  auditedAt: Date;
}

interface LighthouseAudit {
  numericValue?: number;
  score?: number;
}

interface PageSpeedResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score?: number };
      accessibility?: { score?: number };
      seo?: { score?: number };
      'best-practices'?: { score?: number };
    };
    audits?: {
      'largest-contentful-paint'?: LighthouseAudit;
      'total-blocking-time'?: LighthouseAudit;
      'cumulative-layout-shift'?: LighthouseAudit;
      'server-response-time'?: LighthouseAudit;
      'first-contentful-paint'?: LighthouseAudit;
    };
  };
}

async function fetchPageSpeed(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<PageSpeedResponse | null> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;

  if (!apiKey) {
    console.warn('GOOGLE_PAGESPEED_API_KEY not configured');
    return null;
  }

  const categories = ['performance', 'accessibility', 'seo', 'best-practices'].join('&category=');
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}&category=${categories}`;

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour (PageSpeed is expensive)
    });

    if (!response.ok) {
      console.error('PageSpeed API error:', response.status, response.statusText);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('PageSpeed API fetch error:', error);
    return null;
  }
}

export async function getCoreWebVitals(url: string = 'https://iaml.com'): Promise<CoreWebVitals> {
  const data = await fetchPageSpeed(url, 'mobile');

  if (!data?.lighthouseResult) {
    console.warn('No PageSpeed data available, returning defaults');
    return {
      lcp: 2.5,
      fid: 100,
      cls: 0.1,
      ttfb: 0.8,
      fcp: 1.8,
      performance: 85,
      accessibility: 90,
      seo: 95,
      bestPractices: 90,
      auditedAt: new Date(),
    };
  }

  const { categories, audits } = data.lighthouseResult;

  return {
    // Core Web Vitals (from audits, in ms -> convert to seconds where needed)
    lcp: (audits?.['largest-contentful-paint']?.numericValue || 2500) / 1000,
    fid: audits?.['total-blocking-time']?.numericValue || 100, // TBT is proxy for FID
    cls: audits?.['cumulative-layout-shift']?.numericValue || 0.1,
    ttfb: (audits?.['server-response-time']?.numericValue || 800) / 1000,
    fcp: (audits?.['first-contentful-paint']?.numericValue || 1800) / 1000,

    // Lighthouse scores (0-1 -> convert to 0-100)
    performance: Math.round((categories?.performance?.score || 0.85) * 100),
    accessibility: Math.round((categories?.accessibility?.score || 0.9) * 100),
    seo: Math.round((categories?.seo?.score || 0.95) * 100),
    bestPractices: Math.round((categories?.['best-practices']?.score || 0.9) * 100),

    auditedAt: new Date(),
  };
}

export async function getMultiPageVitals(urls: string[]): Promise<Map<string, CoreWebVitals>> {
  const results = new Map<string, CoreWebVitals>();

  // Fetch all pages in parallel (be mindful of rate limits)
  const promises = urls.map(async (url) => {
    const vitals = await getCoreWebVitals(url);
    results.set(url, vitals);
  });

  await Promise.all(promises);
  return results;
}

// Helper to determine status based on Core Web Vitals thresholds
export function getVitalStatus(metric: 'lcp' | 'fid' | 'cls', value: number): 'healthy' | 'warning' | 'critical' {
  const thresholds = {
    lcp: { good: 2.5, poor: 4.0 }, // seconds
    fid: { good: 100, poor: 300 }, // milliseconds
    cls: { good: 0.1, poor: 0.25 }, // score
  };

  const { good, poor } = thresholds[metric];
  if (value <= good) return 'healthy';
  if (value <= poor) return 'warning';
  return 'critical';
}
