import type {
  DepartmentConfig,
  MetricValue,
  AlertItem,
  HealthStatus,
} from '../dashboard';

// Web Intelligence Department specific types

// ============================================
// TRAFFIC TYPES
// ============================================

export interface DailyTraffic {
  id: string;
  collectedDate: Date;
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number | null;
  avgSessionDuration: number | null;
  newUsers: number | null;
  returningUsers: number | null;
  pagesPerSession: number | null;
}

export interface PageTraffic {
  id: string;
  collectedDate: Date;
  pagePath: string;
  pageTitle: string | null;
  sessions: number;
  pageviews: number;
  uniquePageviews: number;
  avgTimeOnPage: number | null;
  bounceRate: number | null;
  exitRate: number | null;
  entrances: number;
}

export interface TrafficSource {
  id: string;
  collectedDate: Date;
  source: string;
  medium: string;
  sessions: number;
  users: number;
  newUsers: number;
  bounceRate: number | null;
  pagesPerSession: number | null;
  avgSessionDuration: number | null;
}

export interface TrafficGeo {
  id: string;
  collectedDate: Date;
  country: string;
  region: string | null;
  city: string | null;
  sessions: number;
  users: number;
  pageviews: number;
}

// ============================================
// RANKINGS TYPES
// ============================================

export type KeywordPriority = 'low' | 'medium' | 'high' | 'critical';
export type KeywordStatus = 'active' | 'paused' | 'archived';

export interface TrackedKeyword {
  id: string;
  keyword: string;
  searchVolume: number | null;
  difficulty: number | null;
  cpc: number | null;
  priority: KeywordPriority;
  targetUrl: string | null;
  category: string | null;
  status: KeywordStatus;
  volumeUpdatedAt: Date | null;
  createdAt: Date;
}

export interface CompetitorPosition {
  domain: string;
  position: number;
}

export interface DailyRanking {
  id: string;
  keywordId: string;
  collectedDate: Date;
  position: number | null;
  rankingUrl: string | null;
  hasFeaturedSnippet: boolean;
  featuredSnippetOwner: string | null;
  hasPeopleAlsoAsk: boolean;
  hasLocalPack: boolean;
  hasKnowledgePanel: boolean;
  hasVideoResults: boolean;
  hasImagePack: boolean;
  competitorPositions: CompetitorPosition[];
}

export type RankingChangeType =
  | 'improved'
  | 'dropped'
  | 'new_ranking'
  | 'lost_ranking';

export interface RankingChangeEvent {
  id: string;
  keywordId: string;
  detectedDate: Date;
  previousPosition: number | null;
  currentPosition: number | null;
  changeAmount: number;
  changeType: RankingChangeType;
  isSignificant: boolean;
  alertSent: boolean;
}

// ============================================
// TECHNICAL / GSC TYPES
// ============================================

export interface IndexCoverage {
  id: string;
  collectedDate: Date;
  indexedCount: number;
  crawledNotIndexed: number;
  discoveredNotIndexed: number;
  excludedCount: number;
  errorCount: number;
  errorDetails: Record<string, unknown>;
  excludedDetails: Record<string, unknown>;
}

export interface IndexError {
  id: string;
  collectedDate: Date;
  url: string;
  errorType: string;
  firstDetected: Date | null;
  lastDetected: Date | null;
  isResolved: boolean;
  resolvedAt: Date | null;
}

export type DeviceType = 'mobile' | 'desktop';
export type CwvStatus = 'good' | 'needs_improvement' | 'poor';

export interface CoreWebVitals {
  id: string;
  collectedDate: Date;
  deviceType: DeviceType;
  lcpGoodPct: number | null;
  lcpNeedsImprovementPct: number | null;
  lcpPoorPct: number | null;
  fidGoodPct: number | null;
  fidNeedsImprovementPct: number | null;
  fidPoorPct: number | null;
  clsGoodPct: number | null;
  clsNeedsImprovementPct: number | null;
  clsPoorPct: number | null;
  overallStatus: CwvStatus | null;
}

export interface SearchPerformance {
  id: string;
  collectedDate: Date;
  query: string | null;
  page: string | null;
  country: string | null;
  device: string | null;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface CrawlStats {
  id: string;
  collectedDate: Date;
  totalCrawlRequests: number;
  totalDownloadSizeBytes: number;
  avgResponseTimeMs: number | null;
  responses2xx: number;
  responses3xx: number;
  responses4xx: number;
  responses5xx: number;
  crawlDiscovery: number;
  crawlRefresh: number;
}

export interface MobileUsability {
  id: string;
  collectedDate: Date;
  url: string;
  issueType: string;
  firstDetected: Date | null;
  isResolved: boolean;
  resolvedAt: Date | null;
}

export interface SitemapStatus {
  id: string;
  collectedDate: Date;
  sitemapUrl: string;
  submittedUrls: number;
  indexedUrls: number;
  lastDownloaded: Date | null;
  isPending: boolean;
  hasErrors: boolean;
  errorDetails: string | null;
}

// ============================================
// CONTENT TYPES
// ============================================

export type ContentStatus = 'active' | 'redirect' | 'removed' | 'draft';
export type ContentHealthStatus = 'thin' | 'decaying' | 'healthy';
export type DecaySeverity = 'minor' | 'moderate' | 'severe';

export interface ContentInventory {
  id: string;
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  wordCount: number | null;
  publishDate: Date | null;
  lastModified: Date | null;
  lastCrawled: Date | null;
  contentType: string | null;
  category: string | null;
  status: ContentStatus;
  avgMonthlySessions: number | null;
  avgMonthlyPageviews: number | null;
}

export interface ContentDecay {
  id: string;
  contentId: string;
  detectedDate: Date;
  baselinePeriod: string | null;
  baselineSessions: number;
  currentSessions: number;
  decayPercentage: number;
  severity: DecaySeverity | null;
  isAddressed: boolean;
  addressedAt: Date | null;
  actionTaken: string | null;
}

export interface ThinContent {
  id: string;
  contentId: string;
  detectedDate: Date;
  wordCount: number | null;
  avgTimeOnPage: number | null;
  bounceRate: number | null;
  reason: string | null;
  recommendation: string | null;
  isAddressed: boolean;
  addressedAt: Date | null;
}

export type ContentCoverage = 'none' | 'partial' | 'indirect';

export interface ContentGap {
  id: string;
  keyword: string;
  detectedDate: Date;
  searchVolume: number | null;
  difficulty: number | null;
  currentCoverage: ContentCoverage | null;
  recommendedAction: string | null;
  priority: string;
  isAddressed: boolean;
  addressedAt: Date | null;
}

export interface InternalLink {
  id: string;
  collectedDate: Date;
  pageUrl: string;
  incomingLinks: number;
  outgoingLinks: number;
  isOrphan: boolean;
  depthFromHome: number | null;
}

// ============================================
// COMPETITOR TYPES
// ============================================

export interface Competitor {
  id: string;
  domain: string;
  name: string | null;
  isActive: boolean;
  notes: string | null;
}

export interface CompetitorRanking {
  id: string;
  competitorId: string;
  keywordId: string;
  collectedDate: Date;
  position: number | null;
  url: string | null;
}

export interface CompetitorTraffic {
  id: string;
  competitorId: string;
  collectedDate: Date;
  estimatedMonthlyVisits: number | null;
  estimatedOrganicTraffic: number | null;
  trafficRank: number | null;
  topKeywords: unknown[];
  trafficSources: Record<string, unknown>;
}

export interface SerpShare {
  id: string;
  collectedDate: Date;
  ourShare: number | null;
  competitorShares: Record<string, number>;
  keywordsTracked: number | null;
  keywordsRanking: number | null;
}

// ============================================
// BACKLINK TYPES
// ============================================

export interface BacklinkProfile {
  id: string;
  collectedDate: Date;
  totalBacklinks: number;
  referringDomains: number;
  dofollowLinks: number;
  nofollowLinks: number;
  domainRating: number | null;
  urlRating: number | null;
  newLinks7d: number;
  lostLinks7d: number;
}

export interface BacklinkItem {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string | null;
  isDofollow: boolean;
  domainRating: number | null;
  firstSeen: Date | null;
  lastSeen: Date | null;
  isLost: boolean;
  lostDate: Date | null;
  qualityScore: number | null;
  isToxic: boolean;
  toxicReason: string | null;
}

export type LinkOpportunityStatus =
  | 'new'
  | 'contacted'
  | 'acquired'
  | 'rejected'
  | 'expired';

export interface LinkOpportunity {
  id: string;
  sourceDomain: string;
  sourceUrl: string | null;
  opportunityType: string | null;
  domainRating: number | null;
  status: LinkOpportunityStatus;
  notes: string | null;
}

// ============================================
// AI INSIGHTS & REPORTS TYPES
// ============================================

export interface AiInsight {
  id: string;
  insightType: string;
  title: string;
  content: string;
  dataSources: string[];
  dateRangeStart: Date | null;
  dateRangeEnd: Date | null;
  priority: string;
  category: string | null;
  isActionable: boolean;
  isAddressed: boolean;
  addressedAt: Date | null;
  createdAt: Date;
}

export type RecommendationStatus =
  | 'new'
  | 'in_progress'
  | 'completed'
  | 'dismissed';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string | null;
  priority: string;
  estimatedImpact: string | null;
  sourceWorkflow: string | null;
  sourceData: Record<string, unknown>;
  status: RecommendationStatus;
  assignedTo: string | null;
  completedAt: Date | null;
}

// ============================================
// ALERT TYPES
// ============================================

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface WebIntelAlert {
  id: string;
  alertType: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  sourceWorkflow: string | null;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

// ============================================
// COLLECTION LOG TYPE
// ============================================

export type CollectionStatus = 'success' | 'partial' | 'failed';

export interface CollectionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  status: CollectionStatus;
  recordsProcessed: number;
  errorMessage: string | null;
  details: Record<string, unknown>;
  startedAt: Date;
  completedAt: Date | null;
}

// ============================================
// DASHBOARD METRICS & DATA
// ============================================

export interface WebIntelMetrics {
  dailySessions: MetricValue;
  weeklyTraffic: MetricValue;
  bounceRate: MetricValue;
  avgKeywordPosition: MetricValue;
  topPageviews: MetricValue;
  coreWebVitalsScore: MetricValue;
  indexedPages: MetricValue;
  backlinkCount: MetricValue;
}

export interface WebIntelDashboardData {
  metrics: WebIntelMetrics;
  traffic: DailyTraffic[];
  topPages: PageTraffic[];
  keywords: TrackedKeyword[];
  rankings: DailyRanking[];
  rankingChanges: RankingChangeEvent[];
  coreWebVitals: CoreWebVitals[];
  indexCoverage: IndexCoverage | null;
  searchPerformance: SearchPerformance[];
  contentDecay: ContentDecay[];
  competitors: Competitor[];
  backlinkProfile: BacklinkProfile | null;
  alerts: AlertItem[];
  overallHealth: HealthStatus;
}

// ============================================
// DEPARTMENT CONFIGURATION
// ============================================

export const webIntelDepartmentConfig: DepartmentConfig = {
  department: 'web-intel',
  title: 'Web Intelligence',
  summaryPrompt:
    'Provide a brief status of web intelligence including: daily traffic and trends, keyword ranking performance, Core Web Vitals health, indexed page count, backlink profile status, and any critical SEO or technical issues requiring attention.',
  keyMetrics: [
    {
      id: 'daily_sessions',
      label: 'Daily Sessions',
      description: 'Website sessions from the past 24 hours',
      source: 'supabase',
      query: 'daily_traffic',
      format: 'number',
      trend: true,
      icon: 'activity',
    },
    {
      id: 'avg_keyword_position',
      label: 'Avg Position',
      description: 'Average ranking position across tracked keywords',
      source: 'supabase',
      query: 'daily_rankings',
      format: 'number',
      trend: true,
      icon: 'trending-up',
      warningThreshold: 20,
      criticalThreshold: 50,
    },
    {
      id: 'core_web_vitals',
      label: 'Core Web Vitals',
      description: 'Overall CWV score (% pages passing)',
      source: 'supabase',
      query: 'core_web_vitals',
      format: 'percent',
      target: 90,
      trend: true,
      icon: 'gauge',
      warningThreshold: 75,
      criticalThreshold: 50,
    },
    {
      id: 'indexed_pages',
      label: 'Indexed Pages',
      description: 'Pages currently indexed in Google',
      source: 'supabase',
      query: 'index_coverage',
      format: 'number',
      trend: true,
      icon: 'file-text',
    },
    {
      id: 'backlink_count',
      label: 'Backlinks',
      description: 'Total backlinks from referring domains',
      source: 'supabase',
      query: 'backlink_profile',
      format: 'number',
      trend: true,
      icon: 'link',
    },
    {
      id: 'active_alerts',
      label: 'Active Alerts',
      description: 'Unacknowledged SEO and technical alerts',
      source: 'supabase',
      query: 'alerts',
      format: 'number',
      trend: false,
      icon: 'alert-triangle',
      warningThreshold: 3,
      criticalThreshold: 10,
    },
  ],
  quickActions: [
    {
      id: 'check_rankings',
      name: 'Check Rankings',
      command: '/web-intel rankings',
      description: 'View current keyword ranking positions',
      icon: 'trending-up',
    },
    {
      id: 'traffic_report',
      name: 'Traffic Report',
      command: '/web-intel traffic',
      description: 'View traffic trends and top pages',
      icon: 'bar-chart',
    },
    {
      id: 'content_health',
      name: 'Content Health',
      command: '/web-intel content',
      description: 'Check for content decay and thin content',
      icon: 'file-check',
    },
  ],
  statusIndicators: {
    healthy: {
      color: 'green',
      conditions: [
        'Core Web Vitals passing > 90%',
        'No critical ranking drops',
        'Index coverage stable',
        'No critical alerts',
        'Traffic trending up or stable',
      ],
    },
    warning: {
      color: 'yellow',
      conditions: [
        'Core Web Vitals 75-90%',
        'Ranking drops on 3+ keywords',
        'Index errors detected',
        'Traffic down 10-20%',
        'Backlink profile declining',
      ],
    },
    critical: {
      color: 'red',
      conditions: [
        'Core Web Vitals < 75%',
        'Major ranking drops (5+ positions)',
        'Significant index coverage loss',
        'Traffic down > 20%',
        'Manual action detected',
      ],
    },
  },
  dashboardSections: [
    {
      id: 'traffic_overview',
      title: 'Traffic Overview',
      type: 'metrics-grid',
      position: 'top',
      description: 'Daily traffic metrics and trends',
    },
    {
      id: 'rankings',
      title: 'Keyword Rankings',
      type: 'program-table',
      position: 'main',
      description: 'Tracked keywords and ranking positions',
    },
    {
      id: 'technical_health',
      title: 'Technical Health',
      type: 'metrics-summary',
      position: 'main',
      description: 'Core Web Vitals, index coverage, crawl stats',
    },
    {
      id: 'content',
      title: 'Content Performance',
      type: 'program-table',
      position: 'main',
      description: 'Top pages, content decay, thin content alerts',
    },
    {
      id: 'alerts',
      title: 'Alerts',
      type: 'alert-list',
      position: 'sidebar',
      description: 'Active SEO and technical alerts',
    },
  ],
  refreshIntervalSeconds: 3600,
};
