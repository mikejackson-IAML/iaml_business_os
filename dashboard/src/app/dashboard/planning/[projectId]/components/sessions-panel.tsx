'use client';

import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Button } from '@/dashboard-kit/components/ui/button';
import type { PlanningConversation } from '@/dashboard-kit/types/departments/planning';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

interface SessionsPanelProps {
  conversations: PlanningConversation[];
}

export function SessionsPanel({ conversations }: SessionsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Sessions
          </CardTitle>
          <Button variant="ghost" size="sm" disabled className="text-xs">
            New Session
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No sessions yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Start a conversation to begin planning
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium truncate">
                    {conversation.title || 'Untitled Session'}
                  </p>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {conversation.message_count} msgs
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeTime(conversation.started_at)}
                </p>
                {conversation.summary && (
                  <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                    {conversation.summary.length > 60
                      ? `${conversation.summary.slice(0, 60)}...`
                      : conversation.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
