'use client';

import { useEffect, useState } from 'react';
import { Calendar, Star, TrendingUp, Users, CheckCircle, Clock, Mail, Phone, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import type { Contact } from '@/lib/api/lead-intelligence-contacts-types';
import { AISummaryCard } from '../../../components/ai-summary-card';

interface OverviewTabProps {
  contactId: string;
  contact: Contact;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface FollowUp {
  id: string;
  due_date: string;
  description: string;
  status: string;
}

const ACTIVITY_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  call: Phone,
  note: FileText,
  meeting: Users,
  follow_up: Clock,
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function OverviewTab({ contactId, contact }: OverviewTabProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [actRes, fuRes] = await Promise.all([
          fetch(`/api/lead-intelligence/contacts/${contactId}/activity`),
          fetch(`/api/lead-intelligence/contacts/${contactId}/follow-ups`),
        ]);
        if (actRes.ok) {
          const actJson = await actRes.json();
          setActivities((actJson.data ?? []).slice(0, 10));
        }
        if (fuRes.ok) {
          const fuJson = await fuRes.json();
          setFollowUps((fuJson.data ?? []).filter((f: FollowUp) => f.status !== 'completed'));
        }
      } catch {
        // Silently handle - empty states will show
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [contactId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-48 rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Intelligence Summary */}
      <AISummaryCard contactId={contactId} />

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Programs Attended
            </div>
            <p className="mt-1 text-2xl font-bold">
              {contact.enrichment_data && typeof contact.enrichment_data === 'object'
                ? ((contact.enrichment_data as Record<string, unknown>).programs_attended as number) ?? 0
                : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Star className="h-4 w-4" />
              Avg Rating
            </div>
            <p className="mt-1 text-2xl font-bold">
              {contact.enrichment_data && typeof contact.enrichment_data === 'object'
                ? ((contact.enrichment_data as Record<string, unknown>).avg_rating as number)?.toFixed(1) ?? '--'
                : '--'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              Last Attended
            </div>
            <p className="mt-1 text-lg font-bold">
              {contact.last_activity_at
                ? new Date(contact.last_activity_at).toLocaleDateString()
                : '--'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              Engagement Score
            </div>
            <p className="mt-1 text-2xl font-bold">
              {contact.engagement_score ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.activity_type] ?? FileText;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-muted p-1.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{relativeTime(activity.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Follow-ups</CardTitle>
        </CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">No upcoming follow-ups</p>
              <Button variant="outline" size="sm" disabled>
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Create Follow-up
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {followUps.map((fu) => (
                <div key={fu.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{fu.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(fu.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" disabled>
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                    Complete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
