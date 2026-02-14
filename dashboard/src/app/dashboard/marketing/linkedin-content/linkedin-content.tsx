'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Linkedin,
  CalendarDays,
  FileText,
  BarChart3,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  PenLine,
  Users,
  Hash,
  ThumbsUp,
  ThumbsDown,
  X,
  Undo2,
} from 'lucide-react';
import Link from 'next/link';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/dashboard-kit/components/ui/tabs';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { LinkedInContentSummary, TopicRecommendationDb } from '@/lib/api/linkedin-content-queries';

interface LinkedInContentDashboardProps {
  data: LinkedInContentSummary;
}

const SERIES_LABELS: Record<string, string> = {
  not_being_told: 'AI in HR: What You\'re Not Being Told',
  compliance_radar: 'The HR Compliance Radar',
  ask_ai_guy: 'Ask the AI Guy',
  flex: 'Flex / Bonus',
};

const SERIES_DAYS: Record<string, string> = {
  not_being_told: 'Tuesday',
  compliance_radar: 'Wednesday',
  ask_ai_guy: 'Thursday',
  flex: 'Friday',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  open: { bg: 'bg-muted', text: 'text-muted-foreground', icon: Clock },
  pending: { bg: 'bg-muted', text: 'text-muted-foreground', icon: Clock },
  assigned: { bg: 'hsl(var(--info-muted))', text: 'hsl(var(--info))', icon: PenLine },
  draft: { bg: 'hsl(var(--warning-muted))', text: 'hsl(var(--warning))', icon: FileText },
  generated: { bg: 'hsl(var(--warning-muted))', text: 'hsl(var(--warning))', icon: Sparkles },
  approved: { bg: 'hsl(var(--success-muted))', text: 'hsl(var(--success))', icon: CheckCircle2 },
  scheduled: { bg: 'hsl(var(--info-muted))', text: 'hsl(var(--info))', icon: Clock },
  published: { bg: 'hsl(var(--success-muted))', text: 'hsl(var(--success))', icon: CheckCircle2 },
  rejected: { bg: 'hsl(var(--error-muted))', text: 'hsl(var(--error))', icon: AlertCircle },
  failed: { bg: 'hsl(var(--error-muted))', text: 'hsl(var(--error))', icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.open;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {status}
    </span>
  );
}

export function LinkedInContentDashboard({ data }: LinkedInContentDashboardProps) {
  const {
    thisWeekTopics,
    drafts,
    upcomingCalendar,
    recentPosts,
    weeklyStats,
    engagementNetwork,
    recentComments,
    hookLibraryCount,
  } = data;

  const router = useRouter();
  const [topicStatuses, setTopicStatuses] = useState<Record<string, string>>({});

  function getEffectiveStatus(topic: TopicRecommendationDb): string {
    return topicStatuses[topic.id] || topic.status;
  }

  async function handleStatusChange(
    topicId: string,
    newStatus: 'approved' | 'rejected' | 'pending'
  ) {
    const previousStatus =
      topicStatuses[topicId] ||
      thisWeekTopics.find((t) => t.id === topicId)?.status ||
      'pending';

    // Optimistic update
    setTopicStatuses((prev) => ({ ...prev, [topicId]: newStatus }));

    try {
      const res = await fetch(`/api/linkedin-content/topics/${topicId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      router.refresh(); // Revalidate server data
    } catch {
      // Revert on failure
      setTopicStatuses((prev) => ({ ...prev, [topicId]: previousStatus }));
    }
  }

  const approvedTopics = thisWeekTopics.filter((t) => getEffectiveStatus(t) === 'approved').length;
  const pendingTopics = thisWeekTopics.filter((t) => getEffectiveStatus(t) === 'pending').length;
  const pendingDrafts = drafts.filter((d) => d.status === 'draft').length;
  const scheduledPosts = drafts.filter((d) => d.status === 'scheduled').length;

  return (
    <div className="relative min-h-screen">
      <FallingPattern
        color="hsl(var(--accent-primary))"
        backgroundColor="hsl(var(--background))"
        duration={150}
        blurIntensity="1em"
        density={0.5}
        className="fixed inset-0 -z-10 opacity-50"
      />

      <div className="relative z-10 p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Linkedin className="h-6 w-6 text-[#0A66C2]" />
              <h1 className="text-display-sm text-foreground">LinkedIn Content Engine</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
          <p className="text-muted-foreground">
            Research, generate, publish, and analyze LinkedIn content
          </p>
          <div className="mt-2">
            <Link
              href="/dashboard/marketing"
              className="text-sm text-accent-primary hover:underline"
            >
              &larr; Back to Marketing Dashboard
            </Link>
          </div>
        </header>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            label="Topics This Week"
            value={thisWeekTopics.length}
            format="number"
            icon={Sparkles}
            description={`${approvedTopics} approved, ${pendingTopics} pending`}
          />
          <MetricCard
            label="Drafts to Review"
            value={pendingDrafts}
            format="number"
            icon={FileText}
            status={pendingDrafts > 0 ? 'warning' : 'healthy'}
            description={`${scheduledPosts} scheduled`}
          />
          <MetricCard
            label="Published"
            value={recentPosts.length}
            format="number"
            icon={CheckCircle2}
            description="Recent posts"
          />
          <MetricCard
            label="Avg Engagement"
            value={weeklyStats?.avg_engagement_rate?.toFixed(1) ?? '—'}
            format={weeklyStats?.avg_engagement_rate ? 'percent' : 'text'}
            icon={BarChart3}
            description={weeklyStats ? `Week of ${weeklyStats.week_of}` : 'No data yet'}
          />
          <MetricCard
            label="Engagement Network"
            value={engagementNetwork.total}
            format="number"
            icon={Users}
            description={`${engagementNetwork.tier1} Tier 1, ${engagementNetwork.tier2} Tier 2`}
          />
          <MetricCard
            label="Hook Library"
            value={hookLibraryCount}
            format="number"
            icon={Hash}
            description="Active hooks"
          />
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="this-week" className="space-y-6">
          <TabsList>
            <TabsTrigger value="this-week">This Week</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          {/* THIS WEEK TAB */}
          <TabsContent value="this-week">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-heading-md">Recommended Topics</CardTitle>
                  </CardHeader>
                  {thisWeekTopics.length > 0 && (
                    <div className="flex items-center justify-between px-6 pb-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>
                          {thisWeekTopics.filter((t) => getEffectiveStatus(t) === 'approved').length} of 3-4 approved for this week
                        </span>
                      </div>
                    </div>
                  )}
                  <CardContent>
                    {thisWeekTopics.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium mb-1">No topics scored yet</p>
                        <p className="text-sm">
                          The Topic Scoring Engine runs Monday at 5 AM CST.
                          Topics will appear here after research data is collected.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {thisWeekTopics.map((topic) => {
                          const effectiveStatus = getEffectiveStatus(topic);
                          const isApproved = effectiveStatus === 'approved';
                          const isRejected = effectiveStatus === 'rejected';
                          const isPending = effectiveStatus === 'pending';

                          const scoreDimensions = [
                            { label: 'ENG', score: topic.engagement_score, max: 25 },
                            { label: 'FRS', score: topic.freshness_score, max: 25 },
                            { label: 'GAP', score: topic.gap_score, max: 20 },
                            { label: 'POS', score: topic.positioning_score, max: 15 },
                            { label: 'FMT', score: topic.format_score, max: 15 },
                          ];

                          return (
                            <div
                              key={topic.id}
                              className={`p-4 rounded-lg bg-background-card-light border ${
                                isApproved
                                  ? 'border-green-500 border-l-4'
                                  : isRejected
                                    ? 'border-border opacity-60'
                                    : 'border-border'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0 mr-4">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-foreground">
                                      {topic.topic_title}
                                    </h3>
                                    <StatusBadge status={effectiveStatus} />
                                  </div>
                                  {topic.angle && (
                                    <p className="text-sm text-muted-foreground mb-1">
                                      {topic.angle}
                                    </p>
                                  )}
                                  {topic.hook_suggestion && (
                                    <p className="text-sm italic text-muted-foreground mb-2">
                                      &ldquo;{topic.hook_suggestion}&rdquo;
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    {topic.recommended_series && (
                                      <span>
                                        {SERIES_LABELS[topic.recommended_series] || topic.recommended_series}
                                      </span>
                                    )}
                                    {topic.recommended_format && (
                                      <span className="capitalize">{topic.recommended_format}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-2xl font-semibold text-foreground">
                                    {topic.total_score ?? '\u2014'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">score</div>
                                </div>
                              </div>

                              {/* Score breakdown bars */}
                              <div className="flex gap-3 mt-3 flex-wrap">
                                {scoreDimensions.map((d) => (
                                  <div key={d.label} className="text-center min-w-[48px] flex-1">
                                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                      {d.label}
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                                      <div
                                        className="bg-accent-primary rounded-full h-1.5 transition-all"
                                        style={{
                                          width: `${Math.min(((d.score ?? 0) / d.max) * 100, 100)}%`,
                                        }}
                                      />
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      {d.score ?? 0}/{d.max}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Approve/Reject/Undo buttons */}
                              <div className="flex items-center gap-2 mt-3">
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => handleStatusChange(topic.id, 'approved')}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                                    >
                                      <ThumbsUp className="h-3.5 w-3.5" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(topic.id, 'rejected')}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      Reject
                                    </button>
                                  </>
                                )}
                                {(isApproved || isRejected) && (
                                  <button
                                    onClick={() => handleStatusChange(topic.id, 'pending')}
                                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <Undo2 className="h-3.5 w-3.5" />
                                    Undo
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* DRAFTS TAB */}
          <TabsContent value="drafts">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-heading-md">Post Drafts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {drafts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium mb-1">No drafts yet</p>
                        <p className="text-sm">
                          Approve topics in the &quot;This Week&quot; tab to trigger content generation.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {drafts.map((post) => (
                          <div
                            key={post.id}
                            className="p-4 rounded-lg bg-background-card-light border border-border"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <StatusBadge status={post.status} />
                                {post.series && (
                                  <span className="text-xs text-muted-foreground">
                                    {SERIES_LABELS[post.series] || post.series}
                                  </span>
                                )}
                                {post.hook_category && (
                                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                    {post.hook_category} hook
                                  </span>
                                )}
                              </div>
                              {post.scheduled_for && (
                                <span className="text-xs text-muted-foreground">
                                  Scheduled: {new Date(post.scheduled_for).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {post.hook_text && (
                              <p className="font-medium text-foreground mb-2">
                                {post.hook_text}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {post.full_text}
                            </p>
                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {post.hashtags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs text-accent-primary"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* CONTENT CALENDAR TAB */}
          <TabsContent value="calendar">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-heading-md">Content Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingCalendar.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium mb-1">No upcoming slots</p>
                        <p className="text-sm">
                          Calendar slots will be created automatically for the next 4 weeks.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {upcomingCalendar.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background-card-light border border-border"
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-sm font-medium w-24">
                                {new Date(slot.post_date + 'T12:00:00').toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {slot.series
                                  ? SERIES_LABELS[slot.series] || slot.series
                                  : 'Unassigned'}
                              </div>
                              {slot.recommended_format && (
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded capitalize">
                                  {slot.recommended_format}
                                </span>
                              )}
                            </div>
                            <StatusBadge status={slot.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-heading-md">Post Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentPosts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium mb-1">No analytics data yet</p>
                        <p className="text-sm">
                          Analytics will populate after posts are published and the feedback loop runs.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {weeklyStats && (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 rounded-lg bg-muted/50">
                            <div>
                              <div className="text-xs text-muted-foreground">Posts</div>
                              <div className="text-lg font-semibold">{weeklyStats.total_posts ?? 0}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Impressions</div>
                              <div className="text-lg font-semibold">
                                {(weeklyStats.total_impressions ?? 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Reactions</div>
                              <div className="text-lg font-semibold">
                                {(weeklyStats.total_reactions ?? 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Comments</div>
                              <div className="text-lg font-semibold">
                                {(weeklyStats.total_comments ?? 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">New Followers</div>
                              <div className="text-lg font-semibold">{weeklyStats.new_followers ?? 0}</div>
                            </div>
                          </div>
                        )}
                        {recentPosts.map((post) => (
                          <div
                            key={post.id}
                            className="p-4 rounded-lg bg-background-card-light border border-border"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                {post.hook_text && (
                                  <p className="font-medium text-foreground mb-1 truncate">
                                    {post.hook_text}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {post.series && (
                                    <span>{SERIES_LABELS[post.series] || post.series}</span>
                                  )}
                                  {post.published_at && (
                                    <span>
                                      {new Date(post.published_at).toLocaleDateString()}
                                    </span>
                                  )}
                                  {post.format && (
                                    <span className="capitalize">{post.format}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ENGAGEMENT TAB */}
          <TabsContent value="engagement">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-heading-md flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Recent Comment Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentComments.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium mb-1">No engagement data yet</p>
                        <p className="text-sm">
                          The Engagement Engine will populate comment suggestions and track activity.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentComments.map((comment) => (
                          <div
                            key={comment.id}
                            className="p-3 rounded-lg bg-background-card-light border border-border"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">
                                {comment.target_author || 'Unknown'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {comment.commented_at
                                  ? new Date(comment.commented_at).toLocaleDateString()
                                  : ''}
                              </span>
                            </div>
                            {comment.comment_text && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {comment.comment_text}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{comment.likes_received} likes</span>
                              <span>{comment.replies_received} replies</span>
                              {comment.roi_score != null && (
                                <span>ROI: {comment.roi_score.toFixed(1)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-12 lg:col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-heading-md flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Engagement Network
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Contacts</span>
                        <span className="text-lg font-semibold">{engagementNetwork.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tier 1 (Key Influencers)</span>
                        <span className="text-lg font-semibold">{engagementNetwork.tier1}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tier 2 (Active Network)</span>
                        <span className="text-lg font-semibold">{engagementNetwork.tier2}</span>
                      </div>
                      {engagementNetwork.total === 0 && (
                        <p className="text-xs text-muted-foreground mt-4">
                          Add people to your engagement network to track commenting ROI.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
