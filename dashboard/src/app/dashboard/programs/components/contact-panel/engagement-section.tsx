'use client';

import { useState, useEffect, ReactNode } from 'react';
import { ChevronDown, Mail, Globe, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// PROG-27: Engagement history section
// PROG-28: Email engagement counts
// PROG-29: Website behavior
// PROG-30: Conversion attribution via last activity dates
// PROG-31: Email source indicated by data source

interface EngagementSectionProps {
  email: string;
}

interface SmartLeadData {
  openCount: number;
  clickCount: number;
  replyCount: number;
  bounced: boolean;
  lastOpenedAt: string | null;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

interface GHLData {
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  lastActivityAt: string | null;
  conversations: Array<{
    id: string;
    type: string;
    lastMessageDate: string;
  }>;
}

interface GA4Data {
  pageViews: number;
  totalTimeOnSite: number;
  lastVisitDate: string | null;
  pages: Array<{
    path: string;
    views: number;
    date: string;
  }>;
}

interface IntegrationStatus {
  smartlead: { configured: boolean; data: SmartLeadData | null };
  ghl: { configured: boolean; data: GHLData | null };
  ga4: { configured: boolean; data: GA4Data | null };
}

/**
 * Format a date string into relative format like "3 days ago"
 */
function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '';

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return '';
  }
}

/**
 * Format a date string into readable format
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

interface EngagementCardProps {
  title: string;
  icon: ReactNode;
  summary: string;
  lastActivity: string | null;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * Helper component for expandable engagement cards
 */
function EngagementCard({
  title,
  icon,
  summary,
  lastActivity,
  expanded,
  onToggle,
  children,
}: EngagementCardProps) {
  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{summary}</span>
          {lastActivity && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              (Last: {formatRelativeDate(lastActivity)})
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </button>
      {expanded && (
        <div className="p-3 pt-0 border-t space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

export function EngagementSection({ email }: EngagementSectionProps) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadEngagement() {
      setLoading(true);

      // Fetch all three in parallel
      const [smartleadRes, ghlRes, ga4Res] = await Promise.all([
        fetch(`/api/smartlead/engagement?email=${encodeURIComponent(email)}`)
          .then((r) => r.json())
          .catch(() => ({ configured: false, data: null })),
        fetch(`/api/ghl/engagement?email=${encodeURIComponent(email)}`)
          .then((r) => r.json())
          .catch(() => ({ configured: false, data: null })),
        fetch(`/api/ga4/user-behavior?email=${encodeURIComponent(email)}`)
          .then((r) => r.json())
          .catch(() => ({ configured: false, data: null })),
      ]);

      setStatus({ smartlead: smartleadRes, ghl: ghlRes, ga4: ga4Res });
      setLoading(false);
    }

    loadEngagement();
  }, [email]);

  function toggleSection(section: string) {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  if (loading) {
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Engagement History
        </h3>
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </section>
    );
  }

  // Check if any integration is configured
  const anyConfigured =
    status &&
    (status.smartlead.configured ||
      status.ghl.configured ||
      status.ga4.configured);

  // Check if we have data from configured integrations
  const hasSmartLeadData = status?.smartlead.configured && status.smartlead.data;
  const hasGHLData = status?.ghl.configured && status.ghl.data;
  const hasGA4Data = status?.ga4.configured && status.ga4.data;

  if (!anyConfigured) {
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Engagement History
        </h3>
        <div className="flex items-center gap-2 text-muted-foreground text-sm p-4 bg-muted/50 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            No engagement integrations configured (GA4, SmartLead, GHL)
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Engagement History
      </h3>

      <div className="space-y-2">
        {/* Cold Email (SmartLead) */}
        {hasSmartLeadData && (
          <EngagementCard
            title="Cold Email (SmartLead)"
            icon={<Mail className="h-4 w-4 text-blue-500" />}
            summary={`${status.smartlead.data!.openCount} opens, ${status.smartlead.data!.clickCount} clicks`}
            lastActivity={status.smartlead.data!.lastOpenedAt}
            expanded={expandedSections['smartlead'] ?? false}
            onToggle={() => toggleSection('smartlead')}
          >
            {status.smartlead.data!.campaigns.length > 0 ? (
              status.smartlead.data!.campaigns.map((c) => (
                <div key={c.id} className="text-sm flex justify-between py-1">
                  <span className="truncate pr-2">{c.name}</span>
                  <span className="text-muted-foreground flex-shrink-0">
                    {c.status}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                No campaigns found
              </span>
            )}
            {status.smartlead.data!.bounced && (
              <div className="text-sm text-red-500 mt-1">
                Email has bounced
              </div>
            )}
          </EngagementCard>
        )}

        {/* Warm Email (GHL) */}
        {hasGHLData && (
          <EngagementCard
            title="Warm Email (GoHighLevel)"
            icon={<Mail className="h-4 w-4 text-green-500" />}
            summary={`${status.ghl.data!.emailsOpened} opens, ${status.ghl.data!.emailsClicked} clicks`}
            lastActivity={status.ghl.data!.lastActivityAt}
            expanded={expandedSections['ghl'] ?? false}
            onToggle={() => toggleSection('ghl')}
          >
            {status.ghl.data!.conversations.length > 0 ? (
              status.ghl.data!.conversations.map((c) => (
                <div key={c.id} className="text-sm flex justify-between py-1">
                  <span className="truncate pr-2">{c.type}</span>
                  <span className="text-muted-foreground flex-shrink-0">
                    {formatDate(c.lastMessageDate)}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                No conversations
              </span>
            )}
          </EngagementCard>
        )}

        {/* Website Behavior (GA4) */}
        {hasGA4Data && (
          <EngagementCard
            title="Website Activity (GA4)"
            icon={<Globe className="h-4 w-4 text-purple-500" />}
            summary={`${status.ga4.data!.pageViews} page views`}
            lastActivity={status.ga4.data!.lastVisitDate}
            expanded={expandedSections['ga4'] ?? false}
            onToggle={() => toggleSection('ga4')}
          >
            {status.ga4.data!.pages.length > 0 ? (
              status.ga4.data!.pages.map((p, i) => (
                <div key={i} className="text-sm flex justify-between py-1">
                  <span className="truncate pr-2">{p.path}</span>
                  <span className="text-muted-foreground flex-shrink-0">
                    {p.views} views
                  </span>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                No pages tracked
              </span>
            )}
          </EngagementCard>
        )}

        {/* Not configured messages */}
        <div className="space-y-1 mt-2">
          {status && !status.smartlead.configured && (
            <div className="text-xs text-muted-foreground">
              SmartLead: Not connected
            </div>
          )}
          {status && !status.ghl.configured && (
            <div className="text-xs text-muted-foreground">
              GoHighLevel: Not connected
            </div>
          )}
          {status && !status.ga4.configured && (
            <div className="text-xs text-muted-foreground">
              GA4: Not connected
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
