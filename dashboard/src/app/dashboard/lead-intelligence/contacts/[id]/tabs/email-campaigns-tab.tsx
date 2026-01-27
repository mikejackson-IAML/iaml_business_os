'use client';

import { useEffect, useState, useMemo } from 'react';
import { Send, Eye, MousePointerClick, Reply, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';

interface EmailCampaignsTabProps {
  contactId: string;
}

interface EmailActivity {
  id: string;
  campaign_name: string | null;
  activity_type: string;
  activity_date: string;
  subject: string | null;
}

const ACTIVITY_ICONS: Record<string, typeof Send> = {
  sent: Send,
  opened: Eye,
  clicked: MousePointerClick,
  replied: Reply,
  bounced: AlertTriangle,
};

const ACTIVITY_COLORS: Record<string, string> = {
  sent: 'text-blue-500',
  opened: 'text-green-500',
  clicked: 'text-purple-500',
  replied: 'text-amber-500',
  bounced: 'text-red-500',
};

export function EmailCampaignsTab({ contactId }: EmailCampaignsTabProps) {
  const [activities, setActivities] = useState<EmailActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/lead-intelligence/contacts/${contactId}/email-activities`);
        if (res.ok) {
          const json = await res.json();
          setActivities(json.data ?? []);
        }
      } catch {
        // Empty state will show
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [contactId]);

  const metrics = useMemo(() => {
    const total = activities.filter((a) => a.activity_type === 'sent').length;
    const opens = activities.filter((a) => a.activity_type === 'opened').length;
    const clicks = activities.filter((a) => a.activity_type === 'clicked').length;
    const replies = activities.filter((a) => a.activity_type === 'replied').length;
    const bounces = activities.filter((a) => a.activity_type === 'bounced').length;
    return {
      total,
      openRate: total > 0 ? ((opens / total) * 100).toFixed(1) : '0.0',
      clickRate: total > 0 ? ((clicks / total) * 100).toFixed(1) : '0.0',
      replyRate: total > 0 ? ((replies / total) * 100).toFixed(1) : '0.0',
      bounces,
    };
  }, [activities]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-48 rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Engagement Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Emails</p>
            <p className="text-xl font-bold mt-1">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Open Rate</p>
            <p className="text-xl font-bold mt-1">{metrics.openRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Click Rate</p>
            <p className="text-xl font-bold mt-1">{metrics.clickRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Reply Rate</p>
            <p className="text-xl font-bold mt-1">{metrics.replyRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Bounces</p>
            <p className="text-xl font-bold mt-1">{metrics.bounces}</p>
          </CardContent>
        </Card>
      </div>

      {/* Email Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No email activity recorded</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.activity_type] ?? Send;
                const color = ACTIVITY_COLORS[activity.activity_type] ?? 'text-muted-foreground';
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-muted p-1.5">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{activity.activity_type}</span>
                        {activity.campaign_name && (
                          <span className="text-xs text-muted-foreground">
                            {activity.campaign_name}
                          </span>
                        )}
                      </div>
                      {activity.subject && (
                        <p className="text-xs text-muted-foreground truncate">{activity.subject}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.activity_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
