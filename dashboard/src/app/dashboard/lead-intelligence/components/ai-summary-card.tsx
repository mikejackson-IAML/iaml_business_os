'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import type { AISummary, AISummaryResponse } from '@/lib/api/lead-intelligence-ai-types';
import { cn } from '@/lib/utils';

interface AISummaryCardProps {
  contactId: string;
}

function ageLabel(generatedAt: string): { text: string; color: string } {
  const days = Math.floor((Date.now() - new Date(generatedAt).getTime()) / 86400000);
  if (days < 1) return { text: 'Generated today', color: 'text-green-600' };
  if (days < 7) return { text: `Generated ${days}d ago`, color: 'text-green-600' };
  if (days <= 30) return { text: `Generated ${days}d ago`, color: 'text-yellow-600' };
  return { text: `Stale — consider refreshing (${days}d ago)`, color: 'text-orange-600' };
}

function ShimmerCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">
            Generating intelligence summary...
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 animate-pulse">
          <div className="h-5 w-3/4 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AISummaryCard({ contactId }: AISummaryCardProps) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const fetchSummary = useCallback(async (force: boolean) => {
    try {
      setError(false);
      const res = await fetch('/api/lead-intelligence/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, force }),
      });
      if (!res.ok) throw new Error('Failed');
      const data: AISummaryResponse = await res.json();
      setSummary(data.summary);
      setGeneratedAt(data.generated_at);
      setCached(data.cached);
      // On fresh load, expand first section; on regenerate, expand all
      if (force) {
        setExpandedSections(new Set(data.summary.sections.map((_, i) => i)));
      }
    } catch {
      setError(true);
    }
  }, [contactId]);

  useEffect(() => {
    setLoading(true);
    fetchSummary(false).finally(() => setLoading(false));
  }, [fetchSummary]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    await fetchSummary(true);
    setRegenerating(false);
  };

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (loading) return <ShimmerCard />;

  if (error && !summary) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Couldn&apos;t generate summary</p>
            <Button variant="outline" size="sm" onClick={handleRegenerate}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const age = generatedAt ? ageLabel(generatedAt) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-base">AI Intelligence Summary</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {age && (
              <span className={cn('text-xs', age.color)}>{age.text}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="h-7 px-2"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', regenerating && 'animate-spin')} />
              <span className="ml-1 text-xs">Regenerate</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Headline */}
        <p className="text-sm leading-relaxed font-medium">
          {summary.headline}
        </p>

        {/* Expandable Sections */}
        <div className="space-y-1">
          {summary.sections.map((section, i) => {
            const isOpen = expandedSections.has(i);
            return (
              <div key={i} className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleSection(i)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  {section.title}
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 text-sm text-muted-foreground leading-relaxed">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-orange-600">
            Regeneration failed — showing previous summary.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
