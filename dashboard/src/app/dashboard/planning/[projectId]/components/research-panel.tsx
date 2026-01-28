'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResearchResultsModal } from './research-results-modal';
import { fetchProjectResearch } from '@/lib/api/planning-queries';
import type { PlanningResearch, ResearchType, ResearchStatus } from '@/dashboard-kit/types/departments/planning';

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

const RESEARCH_TYPE_LABELS: Record<ResearchType, string> = {
  icp_deep_dive: 'ICP Deep Dive',
  competitive_analysis: 'Competitive Analysis',
  market_research: 'Market Research',
  user_workflows: 'User Workflows',
  technical_feasibility: 'Technical Feasibility',
  custom: 'Custom',
};

const STATUS_STYLES: Record<ResearchStatus, { className: string; label: string }> = {
  pending: { className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 animate-pulse', label: 'Pending' },
  running: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 animate-pulse', label: 'Running' },
  complete: { className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', label: 'Complete' },
  failed: { className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', label: 'Failed' },
};

interface ResearchPanelProps {
  research: PlanningResearch[];
  projectId: string;
  onResearchChanged?: () => void;
}

export function ResearchPanel({ research: initialResearch, projectId, onResearchChanged }: ResearchPanelProps) {
  const [research, setResearch] = useState<PlanningResearch[]>(initialResearch);
  const [selectedResearch, setSelectedResearch] = useState<PlanningResearch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newQuery, setNewQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with parent prop updates
  useEffect(() => {
    setResearch(initialResearch);
  }, [initialResearch]);

  // Auto-refresh when pending/running items exist
  const hasPendingOrRunning = research.some(
    (r) => r.status === 'pending' || r.status === 'running'
  );

  const refreshResearch = useCallback(async () => {
    const data = await fetchProjectResearch(projectId);
    setResearch(data);
  }, [projectId]);

  useEffect(() => {
    if (hasPendingOrRunning) {
      intervalRef.current = setInterval(refreshResearch, 5000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasPendingOrRunning, refreshResearch]);

  const handleItemClick = (item: PlanningResearch) => {
    setSelectedResearch(item);
    setIsModalOpen(true);
  };

  const handleNewResearch = async () => {
    if (!newQuery.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/planning/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          conversationId: 'manual', // Manual research not tied to a conversation
          phaseId: 'manual',
          query: newQuery.trim(),
          researchType: 'custom',
        }),
      });

      if (res.ok) {
        setNewQuery('');
        setShowNewForm(false);
        await refreshResearch();
        onResearchChanged?.();
      }
    } catch (err) {
      console.error('Failed to submit research:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Research
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowNewForm(!showNewForm)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showNewForm && (
            <div className="mb-3 space-y-2">
              <textarea
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                placeholder="What would you like to research?"
                className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleNewResearch();
                  }
                }}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleNewResearch}
                  disabled={!newQuery.trim() || isSubmitting}
                  className="h-7 text-xs"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Send className="h-3 w-3 mr-1" />
                  )}
                  Research
                </Button>
              </div>
            </div>
          )}

          {research.length === 0 ? (
            <div className="py-8 text-center">
              <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">No research yet</p>
              <p className="text-xs text-muted-foreground">Trigger research from chat or use the button above.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {research.map((item) => {
                const statusStyle = STATUS_STYLES[item.status];
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <p className="text-sm truncate">
                      {item.query.length > 80
                        ? `${item.query.slice(0, 80)}...`
                        : item.query}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${statusStyle.className}`}
                      >
                        {statusStyle.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {RESEARCH_TYPE_LABELS[item.research_type] || item.research_type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(item.created_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ResearchResultsModal
        research={selectedResearch}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
