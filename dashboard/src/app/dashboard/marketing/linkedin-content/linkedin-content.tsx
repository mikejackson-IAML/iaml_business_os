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
  X,
  Undo2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Pencil,
  Save,
  Info,
  Loader2,
  Copy,
  Plus,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  UserMinus,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/dashboard-kit/components/ui/tabs';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { LinkedInContentSummary, TopicRecommendationDb, PostDb, EngagementDigestDb, EngagementNetworkDb } from '@/lib/api/linkedin-content-queries';

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

const PILLAR_LABELS: Record<string, string> = {
  legacy_future: 'Legacy & Future',
  building_in_public: 'Building in Public',
  partnered_authority: 'Partnered Authority',
};

const HOOK_CATEGORY_LABELS: Record<string, string> = {
  A: 'Data / Statistic',
  B: 'Contrarian',
  C: 'Observation',
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

type DraftFilter = 'all' | 'draft' | 'approved' | 'failed';

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

function GenerationStatusBadge({ status }: { status: PostDb['generation_status'] }) {
  if (!status || status === 'completed') return null;

  const configs: Record<string, { label: string; className: string; pulse: boolean }> = {
    pending: { label: 'Pending...', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', pulse: false },
    generating: { label: 'Generating...', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', pulse: true },
    regenerating: { label: 'Regenerating...', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', pulse: true },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', pulse: false },
  };

  const config = configs[status];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.pulse && <Loader2 className="h-3 w-3 animate-spin" />}
      {config.label}
    </span>
  );
}

function CharacterCount({ text }: { text: string }) {
  const count = text.length;
  let colorClass = 'text-red-500';
  if (count >= 1800 && count <= 2000) {
    colorClass = 'text-green-500';
  } else if ((count >= 1600 && count < 1800) || (count > 2000 && count <= 2200)) {
    colorClass = 'text-yellow-500';
  }

  return (
    <span className={`text-xs font-mono ${colorClass}`}>
      {count.toLocaleString()} chars
    </span>
  );
}

export function LinkedInContentDashboard({ data }: LinkedInContentDashboardProps) {
  const {
    thisWeekTopics,
    drafts: initialDrafts,
    upcomingCalendar,
    recentPosts,
    weeklyStats,
    engagementNetwork,
    recentComments,
    hookLibraryCount,
    todayDigest: initialDigest,
    engagementNetworkFull: initialNetworkFull,
    engagementROI,
  } = data;

  const router = useRouter();
  const [topicStatuses, setTopicStatuses] = useState<Record<string, string>>({});

  // Drafts tab state
  const [localDrafts, setLocalDrafts] = useState<PostDb[]>(initialDrafts);
  const [draftFilter, setDraftFilter] = useState<DraftFilter>('all');
  const [draftIndex, setDraftIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editFullText, setEditFullText] = useState('');
  const [editFirstComment, setEditFirstComment] = useState('');
  const [editHookText, setEditHookText] = useState('');
  const [regenDialogOpen, setRegenDialogOpen] = useState(false);
  const [regenScope, setRegenScope] = useState<'hooks' | 'body' | 'full'>('full');
  const [regenInstructions, setRegenInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Engagement tab state
  const [localDigest, setLocalDigest] = useState<EngagementDigestDb[]>(initialDigest);
  const [localNetwork, setLocalNetwork] = useState<EngagementNetworkDb[]>(initialNetworkFull);
  const [networkFilter, setNetworkFilter] = useState<'all' | 'tier_1' | 'tier_2' | 'inactive'>('all');
  const [expandedDigestId, setExpandedDigestId] = useState<string | null>(null);
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactData, setEditContactData] = useState<{ tier: string; category: string; notes: string }>({ tier: '', category: '', notes: '' });
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    linkedin_name: '',
    linkedin_url: '',
    linkedin_headline: '',
    follower_count: '',
    tier: 'tier_2' as 'tier_1' | 'tier_2',
    category: 'hr_leader',
    notes: '',
  });
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivateTargetId, setDeactivateTargetId] = useState<string | null>(null);
  const [copiedSuggestionId, setCopiedSuggestionId] = useState<string | null>(null);

  // Topic status helpers
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

    setTopicStatuses((prev) => ({ ...prev, [topicId]: newStatus }));

    try {
      const res = await fetch(`/api/linkedin-content/topics/${topicId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      if (newStatus === 'approved') {
        toast.success('Topic approved - content generation triggered');
      }
      router.refresh();
    } catch {
      setTopicStatuses((prev) => ({ ...prev, [topicId]: previousStatus }));
      toast.error('Failed to update topic status');
    }
  }

  // Drafts tab helpers
  const filteredDrafts = localDrafts.filter((d) => {
    if (draftFilter === 'all') return true;
    if (draftFilter === 'draft') return d.status === 'draft';
    if (draftFilter === 'approved') return d.status === 'approved' || d.status === 'scheduled';
    if (draftFilter === 'failed') return d.generation_status === 'failed' || d.status === 'failed';
    return true;
  });

  const currentDraft = filteredDrafts[draftIndex] || null;

  function goToDraft(index: number) {
    if (editMode) {
      setEditMode(false);
    }
    setDraftIndex(Math.max(0, Math.min(index, filteredDrafts.length - 1)));
  }

  function enterEditMode(draft: PostDb) {
    setEditFullText(draft.full_text || '');
    setEditFirstComment(draft.first_comment_text || '');
    setEditHookText(draft.hook_text || '');
    setEditMode(true);
  }

  async function handleDraftStatusChange(draftId: string, newStatus: 'approved' | 'rejected' | 'draft') {
    const previousDrafts = [...localDrafts];

    setLocalDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, status: newStatus } as PostDb : d))
    );

    try {
      const res = await fetch(`/api/linkedin-content/drafts/${draftId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(`Draft ${newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'reset to draft'}`);
      router.refresh();
    } catch {
      setLocalDrafts(previousDrafts);
      toast.error('Failed to update draft status');
    }
  }

  async function handleHookSelect(draftId: string, variation: 'A' | 'B' | 'C') {
    const draft = localDrafts.find((d) => d.id === draftId);
    if (!draft?.hook_variations) return;

    const selected = draft.hook_variations.find((h) => h.variation === variation);
    if (!selected) return;

    const previousDrafts = [...localDrafts];

    setLocalDrafts((prev) =>
      prev.map((d) =>
        d.id === draftId
          ? { ...d, hook_text: selected.text, hook_category: selected.category, hook_variation: variation }
          : d
      )
    );

    try {
      const res = await fetch(`/api/linkedin-content/drafts/${draftId}/hook`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variation, hook_variations: draft.hook_variations }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(`Hook ${variation} selected`);
    } catch {
      setLocalDrafts(previousDrafts);
      toast.error('Failed to select hook variation');
    }
  }

  async function handleSaveEdit(draftId: string) {
    setIsSaving(true);
    const previousDrafts = [...localDrafts];

    const updates: Record<string, string> = {};
    const currentDraftData = localDrafts.find((d) => d.id === draftId);
    if (!currentDraftData) return;

    if (editFullText !== (currentDraftData.full_text || '')) updates.full_text = editFullText;
    if (editFirstComment !== (currentDraftData.first_comment_text || '')) updates.first_comment_text = editFirstComment;
    if (editHookText !== (currentDraftData.hook_text || '')) updates.hook_text = editHookText;

    if (Object.keys(updates).length === 0) {
      setEditMode(false);
      setIsSaving(false);
      return;
    }

    setLocalDrafts((prev) =>
      prev.map((d) =>
        d.id === draftId
          ? {
              ...d,
              ...(updates.full_text !== undefined ? { full_text: updates.full_text } : {}),
              ...(updates.first_comment_text !== undefined ? { first_comment_text: updates.first_comment_text } : {}),
              ...(updates.hook_text !== undefined ? { hook_text: updates.hook_text } : {}),
            }
          : d
      )
    );

    try {
      const res = await fetch(`/api/linkedin-content/drafts/${draftId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Draft updated');
      setEditMode(false);
    } catch {
      setLocalDrafts(previousDrafts);
      toast.error('Failed to save edits');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRegenerate(draftId: string) {
    if (!regenInstructions.trim()) {
      toast.error('Please provide instructions for regeneration');
      return;
    }

    const previousDrafts = [...localDrafts];

    setLocalDrafts((prev) =>
      prev.map((d) =>
        d.id === draftId ? { ...d, generation_status: 'regenerating' } : d
      )
    );

    setRegenDialogOpen(false);

    try {
      const res = await fetch(`/api/linkedin-content/drafts/${draftId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: regenInstructions.trim(), scope: regenScope }),
      });
      if (!res.ok) throw new Error('Failed to trigger');
      toast.success('Regeneration triggered - content will update shortly');
      setRegenInstructions('');
      setRegenScope('full');
    } catch {
      setLocalDrafts(previousDrafts);
      toast.error('Failed to trigger regeneration');
    }
  }

  // Engagement tab helpers
  const dailyDigestItems = localDigest.filter((d) => d.digest_type === 'daily');
  const warmingDigestItems = localDigest.filter((d) => d.digest_type === 'warming');
  const todayDayOfWeek = new Date().getDay(); // 0=Sun, 2=Tue, 5=Fri
  const isPublishDay = todayDayOfWeek >= 2 && todayDayOfWeek <= 5;

  const filteredNetwork = localNetwork.filter((c) => {
    if (networkFilter === 'all') return c.active;
    if (networkFilter === 'tier_1') return c.active && c.tier === 'tier_1';
    if (networkFilter === 'tier_2') return c.active && c.tier === 'tier_2';
    if (networkFilter === 'inactive') return !c.active;
    return true;
  });

  const networkSummary = {
    total: localNetwork.filter((c) => c.active).length,
    tier1: localNetwork.filter((c) => c.active && c.tier === 'tier_1').length,
    tier2: localNetwork.filter((c) => c.active && c.tier === 'tier_2').length,
  };

  async function handleDigestStatusChange(digestId: string, status: 'completed' | 'skipped') {
    const previousDigest = [...localDigest];

    setLocalDigest((prev) =>
      prev.map((d) => (d.id === digestId ? { ...d, status, completed_at: status === 'completed' ? new Date().toISOString() : d.completed_at } : d))
    );

    try {
      const res = await fetch(`/api/linkedin-content/engagement/${digestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(status === 'completed' ? 'Marked as completed' : 'Skipped');
    } catch {
      setLocalDigest(previousDigest);
      toast.error('Failed to update digest item');
    }
  }

  async function handleCopyComment(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuggestionId(id);
      toast.success('Comment copied to clipboard');
      setTimeout(() => setCopiedSuggestionId(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }

  async function handleAddContact() {
    if (!newContact.linkedin_name.trim() || !newContact.linkedin_url.trim()) {
      toast.error('Name and LinkedIn URL are required');
      return;
    }

    try {
      const res = await fetch('/api/linkedin-content/network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedin_name: newContact.linkedin_name.trim(),
          linkedin_url: newContact.linkedin_url.trim(),
          linkedin_headline: newContact.linkedin_headline.trim() || undefined,
          follower_count: newContact.follower_count ? Number(newContact.follower_count) : undefined,
          tier: newContact.tier,
          category: newContact.category,
          notes: newContact.notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create');
      }

      const created = await res.json();
      setLocalNetwork((prev) => [...prev, created as EngagementNetworkDb]);
      setAddContactOpen(false);
      setNewContact({
        linkedin_name: '',
        linkedin_url: '',
        linkedin_headline: '',
        follower_count: '',
        tier: 'tier_2',
        category: 'hr_leader',
        notes: '',
      });
      toast.success('Contact added to engagement network');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add contact');
    }
  }

  function startEditContact(contact: EngagementNetworkDb) {
    setEditingContactId(contact.id);
    setEditContactData({
      tier: contact.tier || 'tier_2',
      category: contact.category || 'other',
      notes: contact.notes || '',
    });
  }

  async function handleSaveContact(contactId: string) {
    const previousNetwork = [...localNetwork];

    setLocalNetwork((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? { ...c, tier: editContactData.tier, category: editContactData.category, notes: editContactData.notes }
          : c
      )
    );
    setEditingContactId(null);

    try {
      const res = await fetch(`/api/linkedin-content/network/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editContactData),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Contact updated');
    } catch {
      setLocalNetwork(previousNetwork);
      setEditingContactId(contactId);
      toast.error('Failed to update contact');
    }
  }

  async function handleDeactivateContact() {
    if (!deactivateTargetId) return;
    const previousNetwork = [...localNetwork];

    setLocalNetwork((prev) =>
      prev.map((c) => (c.id === deactivateTargetId ? { ...c, active: false } : c))
    );
    setDeactivateDialogOpen(false);
    setDeactivateTargetId(null);

    try {
      const res = await fetch(`/api/linkedin-content/network/${deactivateTargetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to deactivate');
      toast.success('Contact deactivated');
    } catch {
      setLocalNetwork(previousNetwork);
      toast.error('Failed to deactivate contact');
    }
  }

  const CATEGORY_LABELS: Record<string, string> = {
    hr_leader: 'HR Leader',
    employment_attorney: 'Employment Attorney',
    ai_policy: 'AI Policy',
    hr_tech: 'HR Tech',
    journalist: 'Journalist',
    other: 'Other',
  };

  const TIER_COLORS: Record<string, string> = {
    tier_1: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    tier_2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const approvedTopics = thisWeekTopics.filter((t) => getEffectiveStatus(t) === 'approved').length;
  const pendingTopics = thisWeekTopics.filter((t) => getEffectiveStatus(t) === 'pending').length;
  const pendingDrafts = localDrafts.filter((d) => d.status === 'draft').length;
  const scheduledPosts = localDrafts.filter((d) => d.status === 'scheduled').length;

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
            value={weeklyStats?.avg_engagement_rate?.toFixed(1) ?? '\u2014'}
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
            <TabsTrigger value="drafts">
              Drafts
              {pendingDrafts > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-yellow-500 text-white text-[10px] font-bold">
                  {pendingDrafts}
                </span>
              )}
            </TabsTrigger>
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
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-heading-md">Post Drafts</CardTitle>
                      {filteredDrafts.length > 0 && (
                        <div className="flex items-center gap-3">
                          {/* Filter */}
                          <select
                            value={draftFilter}
                            onChange={(e) => {
                              setDraftFilter(e.target.value as DraftFilter);
                              setDraftIndex(0);
                            }}
                            className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground"
                          >
                            <option value="all">All ({localDrafts.length})</option>
                            <option value="draft">Needs Review ({localDrafts.filter((d) => d.status === 'draft').length})</option>
                            <option value="approved">Approved ({localDrafts.filter((d) => d.status === 'approved' || d.status === 'scheduled').length})</option>
                            <option value="failed">Failed ({localDrafts.filter((d) => d.generation_status === 'failed' || d.status === 'failed').length})</option>
                          </select>
                          {/* Navigation */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => goToDraft(draftIndex - 1)}
                              disabled={draftIndex === 0}
                              className="p-1 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-sm text-muted-foreground">
                              {filteredDrafts.length > 0 ? `${draftIndex + 1} of ${filteredDrafts.length}` : '0 of 0'}
                            </span>
                            <button
                              onClick={() => goToDraft(draftIndex + 1)}
                              disabled={draftIndex >= filteredDrafts.length - 1}
                              className="p-1 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {localDrafts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium mb-1">No drafts yet</p>
                        <p className="text-sm">
                          Approve topics in the &quot;This Week&quot; tab to trigger content generation.
                        </p>
                      </div>
                    ) : filteredDrafts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium mb-1">
                          {draftFilter === 'approved'
                            ? 'All drafts approved! Head to the Content Calendar tab.'
                            : draftFilter === 'draft'
                              ? 'No drafts need review right now.'
                              : 'No failed drafts.'}
                        </p>
                      </div>
                    ) : currentDraft ? (
                      <div
                        className={`rounded-lg border p-6 ${
                          currentDraft.status === 'approved'
                            ? 'border-green-500 border-l-4 bg-green-50/5'
                            : currentDraft.status === 'rejected'
                              ? 'border-border opacity-60'
                              : currentDraft.generation_status === 'failed'
                                ? 'border-red-500 border-l-4 bg-red-50/5'
                                : 'border-border bg-background-card-light'
                        }`}
                      >
                        {/* Draft Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <StatusBadge status={currentDraft.status} />
                              <GenerationStatusBadge status={currentDraft.generation_status} />
                              {currentDraft.series && (
                                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                                  {SERIES_LABELS[currentDraft.series] || currentDraft.series}
                                </span>
                              )}
                              {currentDraft.pillar && (
                                <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                                  {PILLAR_LABELS[currentDraft.pillar] || currentDraft.pillar}
                                </span>
                              )}
                            </div>
                            {currentDraft.format && (
                              <span className="text-xs text-muted-foreground capitalize">
                                Format: {currentDraft.format}
                              </span>
                            )}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            {currentDraft.scheduled_for && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <CalendarDays className="h-3.5 w-3.5" />
                                <span>
                                  {new Date(currentDraft.scheduled_for).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hook Selector (A/B/C) */}
                        {currentDraft.hook_variations && currentDraft.hook_variations.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              Hook Variations
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {(['A', 'B', 'C'] as const).map((variation) => {
                                const hook = currentDraft.hook_variations?.find(
                                  (h) => h.variation === variation
                                );
                                if (!hook) return null;

                                const isSelected = currentDraft.hook_variation === variation;

                                return (
                                  <button
                                    key={variation}
                                    onClick={() => handleHookSelect(currentDraft.id, variation)}
                                    className={`text-left p-3 rounded-lg border-2 transition-all ${
                                      isSelected
                                        ? 'border-accent-primary bg-accent-primary/5 ring-1 ring-accent-primary/20'
                                        : 'border-border hover:border-muted-foreground/30'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs font-bold ${isSelected ? 'text-accent-primary' : 'text-muted-foreground'}`}>
                                        {variation}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground uppercase">
                                        {HOOK_CATEGORY_LABELS[variation] || hook.category}
                                      </span>
                                      {isSelected && (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-accent-primary ml-auto" />
                                      )}
                                    </div>
                                    <p className="text-sm text-foreground leading-snug">
                                      {hook.text}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Full Post Preview / Edit Mode */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Post Content
                            </div>
                            {currentDraft.full_text && (
                              <CharacterCount text={editMode ? editFullText : currentDraft.full_text} />
                            )}
                          </div>

                          {editMode ? (
                            <div className="space-y-3">
                              {/* Hook text edit */}
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Hook</label>
                                <textarea
                                  value={editHookText}
                                  onChange={(e) => setEditHookText(e.target.value)}
                                  className="w-full p-3 rounded-lg border border-border bg-background text-foreground font-sans text-sm resize-none"
                                  rows={2}
                                />
                              </div>
                              {/* Full text edit */}
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Post Body</label>
                                <textarea
                                  value={editFullText}
                                  onChange={(e) => setEditFullText(e.target.value)}
                                  className="w-full p-3 rounded-lg border border-border bg-background text-foreground font-sans text-sm resize-none"
                                  rows={12}
                                />
                              </div>
                              {/* First comment edit */}
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">First Comment</label>
                                <textarea
                                  value={editFirstComment}
                                  onChange={(e) => setEditFirstComment(e.target.value)}
                                  className="w-full p-3 rounded-lg border border-border bg-background text-foreground font-sans text-sm resize-none"
                                  rows={3}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-lg bg-muted/30 border border-border">
                              {currentDraft.hook_text && (
                                <p className="font-semibold text-foreground mb-2">
                                  {currentDraft.hook_text}
                                </p>
                              )}
                              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                                {currentDraft.full_text}
                              </p>
                              {/* Hashtags */}
                              {currentDraft.hashtags && currentDraft.hashtags.length > 0 && (
                                <div className="flex gap-1.5 mt-3 flex-wrap">
                                  {currentDraft.hashtags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded-full"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* First Comment Preview */}
                        {!editMode && currentDraft.first_comment_text && (
                          <div className="mb-4">
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                First Comment
                              </span>
                              <span className="group relative">
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-foreground text-background rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  Posted as the first reply to boost engagement
                                </span>
                              </span>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {currentDraft.first_comment_text}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          {editMode ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(currentDraft.id)}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                                Save
                              </button>
                              <button
                                onClick={() => setEditMode(false)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {currentDraft.status === 'draft' && (
                                <>
                                  <button
                                    onClick={() => handleDraftStatusChange(currentDraft.id, 'approved')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleDraftStatusChange(currentDraft.id, 'rejected')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    Reject
                                  </button>
                                </>
                              )}
                              {(currentDraft.status === 'approved' || currentDraft.status === 'rejected') && (
                                <button
                                  onClick={() => handleDraftStatusChange(currentDraft.id, 'draft')}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
                                >
                                  <Undo2 className="h-3.5 w-3.5" />
                                  Reset to Draft
                                </button>
                              )}
                              <button
                                onClick={() => enterEditMode(currentDraft)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setRegenInstructions('');
                                  setRegenScope('full');
                                  setRegenDialogOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md border border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30 transition-colors"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Regenerate
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Regeneration Dialog */}
            <Dialog open={regenDialogOpen} onOpenChange={setRegenDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Regenerate Content</DialogTitle>
                  <DialogDescription>
                    Provide instructions for the AI to regenerate this draft. Choose what to regenerate.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {/* Scope selector */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Regeneration scope
                    </label>
                    <div className="flex gap-2">
                      {([
                        { value: 'hooks', label: 'Hooks only' },
                        { value: 'body', label: 'Body only' },
                        { value: 'full', label: 'Full post' },
                      ] as const).map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setRegenScope(option.value)}
                          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            regenScope === option.value
                              ? 'border-accent-primary bg-accent-primary/10 text-accent-primary font-medium'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Instructions */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Instructions
                    </label>
                    <textarea
                      value={regenInstructions}
                      onChange={(e) => setRegenInstructions(e.target.value)}
                      placeholder="e.g., Make it more data-driven, focus on the compliance angle..."
                      className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <button
                    onClick={() => setRegenDialogOpen(false)}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => currentDraft && handleRegenerate(currentDraft.id)}
                    disabled={!regenInstructions.trim()}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Regenerate
                    </span>
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
            {/* Warming Alert Banner */}
            {isPublishDay && warmingDigestItems.length > 0 && (
              <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium text-amber-800 dark:text-amber-300">
                    Publishing today -- warm up your network first
                  </span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                  Comment on these posts before your content goes live to boost early engagement.
                </p>
                <div className="space-y-3">
                  {warmingDigestItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-white/80 dark:bg-background border border-amber-100 dark:border-amber-900"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {item.target_author || 'Unknown Author'}
                        </span>
                        {item.target_author_followers && (
                          <span className="text-xs text-muted-foreground">
                            {item.target_author_followers.toLocaleString()} followers
                          </span>
                        )}
                      </div>
                      {item.target_post_content && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {item.target_post_content}
                        </p>
                      )}
                      {item.warming_context && (
                        <p className="text-xs italic text-amber-600 dark:text-amber-400 mb-2">
                          Context: {item.warming_context}
                        </p>
                      )}
                      {item.comment_suggestions && item.comment_suggestions.length > 0 && (
                        <div className="space-y-1.5">
                          {item.comment_suggestions.map((suggestion, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-2 rounded bg-amber-50/50 dark:bg-amber-950/30"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] uppercase font-medium text-amber-600 dark:text-amber-400">
                                  {suggestion.style}
                                </span>
                                <p className="text-sm text-foreground">{suggestion.text}</p>
                              </div>
                              <button
                                onClick={() => handleCopyComment(suggestion.text, `warming-${item.id}-${idx}`)}
                                className="shrink-0 p-1.5 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                                title="Copy to clipboard"
                              >
                                {copiedSuggestionId === `warming-${item.id}-${idx}` ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.target_post_url && (
                        <a
                          href={item.target_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-accent-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open post
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-12 gap-6">
              {/* Today's Digest (left/main column) */}
              <div className="col-span-12 lg:col-span-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-heading-md flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      {"Today's Engagement Digest"}
                    </CardTitle>
                    {dailyDigestItems.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        {' -- '}
                        {dailyDigestItems.length} post{dailyDigestItems.length !== 1 ? 's' : ''} to engage with
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {dailyDigestItems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium mb-1">No digest yet today</p>
                        <p className="text-sm">
                          The Engagement Engine runs at 7 AM CST. Digest items will appear here after it completes.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dailyDigestItems.map((item) => {
                          const isExpanded = expandedDigestId === item.id;
                          const engagement = item.post_engagement as { likes: number; comments: number; shares: number } | null;

                          return (
                            <div
                              key={item.id}
                              className={`rounded-lg border transition-colors ${
                                item.status === 'completed'
                                  ? 'border-green-500/30 bg-green-50/5'
                                  : item.status === 'skipped'
                                    ? 'border-border opacity-60'
                                    : 'border-border bg-background-card-light'
                              }`}
                            >
                              {/* Digest Item Header */}
                              <button
                                onClick={() => setExpandedDigestId(isExpanded ? null : item.id)}
                                className="w-full text-left p-4"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0 mr-3">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className="font-medium text-foreground">
                                        {item.target_author || 'Unknown Author'}
                                      </span>
                                      {item.target_author_followers && (
                                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                          {item.target_author_followers.toLocaleString()} followers
                                        </span>
                                      )}
                                      {item.status !== 'pending' && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                          item.status === 'completed'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-muted text-muted-foreground'
                                        }`}>
                                          {item.status}
                                        </span>
                                      )}
                                    </div>
                                    {item.target_post_content && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {item.target_post_content.substring(0, 200)}
                                        {item.target_post_content.length > 200 ? '...' : ''}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    {engagement && (
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted">
                                          <ThumbsUp className="h-3 w-3" />{engagement.likes}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted">
                                          <MessageCircle className="h-3 w-3" />{engagement.comments}
                                        </span>
                                      </div>
                                    )}
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* Expanded Content */}
                              {isExpanded && (
                                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                                  {/* Full post content */}
                                  {item.target_post_content && item.target_post_content.length > 200 && (
                                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                                      <p className="text-sm text-foreground whitespace-pre-wrap">
                                        {item.target_post_content}
                                      </p>
                                    </div>
                                  )}

                                  {/* Comment Suggestions */}
                                  {item.comment_suggestions && item.comment_suggestions.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Comment Suggestions
                                      </div>
                                      {item.comment_suggestions.map((suggestion, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-start gap-2 p-3 rounded-lg bg-accent-primary/5 border border-accent-primary/10"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <span className="text-[10px] uppercase font-bold text-accent-primary tracking-wide">
                                              {suggestion.style}
                                            </span>
                                            <p className="text-sm text-foreground mt-0.5 leading-relaxed">
                                              {suggestion.text}
                                            </p>
                                          </div>
                                          <button
                                            onClick={() => handleCopyComment(suggestion.text, `digest-${item.id}-${idx}`)}
                                            className="shrink-0 p-2 rounded-md hover:bg-accent-primary/10 transition-colors"
                                            title="Copy to clipboard"
                                          >
                                            {copiedSuggestionId === `digest-${item.id}-${idx}` ? (
                                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                              <Copy className="h-4 w-4 text-muted-foreground" />
                                            )}
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Actions row */}
                                  <div className="flex items-center gap-2 pt-1">
                                    {item.target_post_url && (
                                      <a
                                        href={item.target_post_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Open Post
                                      </a>
                                    )}
                                    {item.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleDigestStatusChange(item.id, 'completed')}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                                        >
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                          Completed
                                        </button>
                                        <button
                                          onClick={() => handleDigestStatusChange(item.id, 'skipped')}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                          Skip
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Engagement Network (right sidebar) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                {/* Network Summary */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-heading-md flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Network
                      </CardTitle>
                      <button
                        onClick={() => setAddContactOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-md bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Contact
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Summary stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <div className="text-lg font-semibold">{networkSummary.total}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Total</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                        <div className="text-lg font-semibold text-amber-800 dark:text-amber-400">{networkSummary.tier1}</div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-500 uppercase">Tier 1</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <div className="text-lg font-semibold text-blue-800 dark:text-blue-400">{networkSummary.tier2}</div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-500 uppercase">Tier 2</div>
                      </div>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex gap-1 mb-3">
                      {([
                        { value: 'all', label: 'All' },
                        { value: 'tier_1', label: 'Tier 1' },
                        { value: 'tier_2', label: 'Tier 2' },
                        { value: 'inactive', label: 'Inactive' },
                      ] as const).map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setNetworkFilter(filter.value)}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                            networkFilter === filter.value
                              ? 'border-accent-primary bg-accent-primary/10 text-accent-primary font-medium'
                              : 'border-border hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    {/* Contact list */}
                    <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                      {filteredNetwork.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {networkFilter === 'inactive' ? 'No inactive contacts' : 'No contacts in this filter'}
                        </p>
                      ) : (
                        filteredNetwork.map((contact) => {
                          const isContactExpanded = expandedContactId === contact.id;
                          const isEditing = editingContactId === contact.id;

                          return (
                            <div
                              key={contact.id}
                              className="rounded-lg border border-border bg-background-card-light"
                            >
                              <button
                                onClick={() => setExpandedContactId(isContactExpanded ? null : contact.id)}
                                className="w-full text-left p-2.5"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm font-medium text-foreground truncate">
                                      {contact.linkedin_name}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TIER_COLORS[contact.tier || 'tier_2']}`}>
                                      {contact.tier === 'tier_1' ? 'T1' : 'T2'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-muted-foreground">
                                      {CATEGORY_LABELS[contact.category || 'other'] || contact.category}
                                    </span>
                                    {isContactExpanded ? (
                                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              </button>

                              {isContactExpanded && (
                                <div className="px-2.5 pb-2.5 space-y-2 border-t border-border pt-2">
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-[10px] text-muted-foreground">Tier</label>
                                          <select
                                            value={editContactData.tier}
                                            onChange={(e) => setEditContactData((prev) => ({ ...prev, tier: e.target.value }))}
                                            className="w-full text-sm border border-border rounded px-2 py-1 bg-background"
                                          >
                                            <option value="tier_1">Tier 1</option>
                                            <option value="tier_2">Tier 2</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-muted-foreground">Category</label>
                                          <select
                                            value={editContactData.category}
                                            onChange={(e) => setEditContactData((prev) => ({ ...prev, category: e.target.value }))}
                                            className="w-full text-sm border border-border rounded px-2 py-1 bg-background"
                                          >
                                            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                                              <option key={val} value={val}>{label}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-muted-foreground">Notes</label>
                                        <textarea
                                          value={editContactData.notes}
                                          onChange={(e) => setEditContactData((prev) => ({ ...prev, notes: e.target.value }))}
                                          className="w-full text-sm border border-border rounded px-2 py-1 bg-background resize-none"
                                          rows={2}
                                        />
                                      </div>
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => handleSaveContact(contact.id)}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-accent-primary text-white hover:bg-accent-primary/90"
                                        >
                                          <Save className="h-3 w-3" />
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingContactId(null)}
                                          className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {contact.linkedin_headline && (
                                        <p className="text-xs text-muted-foreground">{contact.linkedin_headline}</p>
                                      )}
                                      {contact.follower_count && (
                                        <p className="text-xs text-muted-foreground">
                                          {contact.follower_count.toLocaleString()} followers
                                        </p>
                                      )}
                                      {contact.notes && (
                                        <p className="text-xs text-muted-foreground italic">{contact.notes}</p>
                                      )}
                                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                        {contact.last_monitored && (
                                          <span>Monitored: {new Date(contact.last_monitored).toLocaleDateString()}</span>
                                        )}
                                        {contact.last_engaged && (
                                          <span>Engaged: {new Date(contact.last_engaged).toLocaleDateString()}</span>
                                        )}
                                      </div>
                                      <div className="flex gap-1.5 pt-1">
                                        {contact.linkedin_url && (
                                          <a
                                            href={contact.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            Profile
                                          </a>
                                        )}
                                        <button
                                          onClick={() => startEditContact(contact)}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
                                        >
                                          <Pencil className="h-3 w-3" />
                                          Edit
                                        </button>
                                        {contact.active && (
                                          <button
                                            onClick={() => {
                                              setDeactivateTargetId(contact.id);
                                              setDeactivateDialogOpen(true);
                                            }}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                                          >
                                            <UserMinus className="h-3 w-3" />
                                            Deactivate
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ROI Metrics + Recent Activity (full width below) */}
            <div className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <MetricCard
                  label="Comments This Week"
                  value={engagementROI.totalCommentsThisWeek}
                  format="number"
                  icon={MessageCircle}
                  description="Engagement comments posted"
                />
                <MetricCard
                  label="Avg ROI Score"
                  value={engagementROI.avgRoiScore || '\u2014'}
                  format={engagementROI.avgRoiScore ? 'number' : 'text'}
                  icon={BarChart3}
                  description="Comment impact score"
                />
                <MetricCard
                  label="Likes Received"
                  value={engagementROI.totalLikesReceived}
                  format="number"
                  icon={ThumbsUp}
                  description="On your comments"
                />
                <MetricCard
                  label="Replies Received"
                  value={engagementROI.totalRepliesReceived}
                  format="number"
                  icon={MessageCircle}
                  description="Conversations started"
                />
              </div>

              {/* Recent Comment Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-heading-md flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Recent Comment Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentComments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">
                        Comment activity will appear here after you start engaging.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-3 rounded-lg bg-background-card-light border border-border"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {comment.target_author || 'Unknown'}
                              </span>
                              {comment.target_author_followers && (
                                <span className="text-xs text-muted-foreground">
                                  {comment.target_author_followers.toLocaleString()} followers
                                </span>
                              )}
                            </div>
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
                            <span className="inline-flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {comment.likes_received} likes
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {comment.replies_received} replies
                            </span>
                            {comment.roi_score != null && (
                              <span className="inline-flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                ROI: {comment.roi_score.toFixed(1)}
                              </span>
                            )}
                            {comment.target_post_url && (
                              <a
                                href={comment.target_post_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-accent-primary hover:underline ml-auto"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Post
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Add Contact Dialog */}
            <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Contact to Network</DialogTitle>
                  <DialogDescription>
                    Add a LinkedIn contact to your engagement network for daily monitoring.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">LinkedIn Name *</label>
                    <input
                      type="text"
                      value={newContact.linkedin_name}
                      onChange={(e) => setNewContact((prev) => ({ ...prev, linkedin_name: e.target.value }))}
                      placeholder="Jane Smith"
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">LinkedIn URL *</label>
                    <input
                      type="text"
                      value={newContact.linkedin_url}
                      onChange={(e) => setNewContact((prev) => ({ ...prev, linkedin_url: e.target.value }))}
                      placeholder="https://www.linkedin.com/in/janesmith"
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Headline</label>
                    <input
                      type="text"
                      value={newContact.linkedin_headline}
                      onChange={(e) => setNewContact((prev) => ({ ...prev, linkedin_headline: e.target.value }))}
                      placeholder="VP of People at Acme Corp"
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Follower Count</label>
                      <input
                        type="number"
                        value={newContact.follower_count}
                        onChange={(e) => setNewContact((prev) => ({ ...prev, follower_count: e.target.value }))}
                        placeholder="5000"
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Tier *</label>
                      <select
                        value={newContact.tier}
                        onChange={(e) => setNewContact((prev) => ({ ...prev, tier: e.target.value as 'tier_1' | 'tier_2' }))}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
                      >
                        <option value="tier_1">Tier 1 (Key Influencer)</option>
                        <option value="tier_2">Tier 2 (Active Network)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Category *</label>
                    <select
                      value={newContact.category}
                      onChange={(e) => setNewContact((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Notes</label>
                    <textarea
                      value={newContact.notes}
                      onChange={(e) => setNewContact((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="How you know them, why they matter for engagement..."
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground resize-none"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <button
                    onClick={() => setAddContactOpen(false)}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddContact}
                    disabled={!newContact.linkedin_name.trim() || !newContact.linkedin_url.trim()}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Add Contact
                    </span>
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Deactivate Confirmation Dialog */}
            <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deactivate Contact</DialogTitle>
                  <DialogDescription>
                    This will remove the contact from daily monitoring. You can reactivate them later.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <button
                    onClick={() => {
                      setDeactivateDialogOpen(false);
                      setDeactivateTargetId(null);
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeactivateContact}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <UserMinus className="h-3.5 w-3.5" />
                      Deactivate
                    </span>
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
