'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Button } from '@/dashboard-kit/components/ui/button';
import { cn } from '@/dashboard-kit/lib/utils';
import { CreateOpportunityModal } from '../../../opportunities/components/create-opportunity-modal';
import type { Opportunity } from '@/lib/api/lead-intelligence-opportunities-types';

interface OpportunitiesTabProps {
  companyId: string;
  companyName: string;
}

const STAGE_COLORS: Record<string, string> = {
  inquiry: 'bg-sky-100 text-sky-800',
  strategy_session: 'bg-indigo-100 text-indigo-800',
  consultation: 'bg-violet-100 text-violet-800',
  proposal: 'bg-amber-100 text-amber-800',
  negotiation: 'bg-orange-100 text-orange-800',
  agreement: 'bg-emerald-100 text-emerald-800',
  onboarding: 'bg-green-100 text-green-800',
  won: 'bg-green-200 text-green-900',
  lost: 'bg-red-100 text-red-800',
};

const TYPE_LABELS: Record<string, string> = {
  in_house: 'In-House',
  individual: 'Individual',
};

function formatStage(stage: string): string {
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function OpportunitiesTab({ companyId, companyName }: OpportunitiesTabProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch(`/api/lead-intelligence/opportunities?company_id=${companyId}&limit=50`);
      if (res.ok) {
        const json = await res.json();
        setOpportunities(json.data || []);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading opportunities...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {opportunities.length} {opportunities.length === 1 ? 'opportunity' : 'opportunities'}
        </h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Create Opportunity
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground">No opportunities yet</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create Opportunity
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Stage</th>
                <th className="px-4 py-3 text-right font-medium">Value</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/lead-intelligence/opportunities/${opp.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {opp.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{TYPE_LABELS[opp.type] || opp.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-xs', STAGE_COLORS[opp.stage] || 'bg-gray-100 text-gray-800')}>
                      {formatStage(opp.stage)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {opp.value != null ? formatCurrency(opp.value) : '--'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(opp.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateOpportunityModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultType="in_house"
        defaultCompanyId={companyId}
        defaultCompanyName={companyName}
        onCreated={() => {
          setCreateOpen(false);
          fetchOpportunities();
        }}
      />
    </div>
  );
}
