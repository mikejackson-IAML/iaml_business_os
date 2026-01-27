'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { cn } from '@/dashboard-kit/lib/utils';
import type { Opportunity } from '@/lib/api/lead-intelligence-opportunities-types';
import { STAGE_COLORS } from './stage-column';

interface OpportunityTableProps {
  opportunities: Opportunity[];
  stageLabels: Record<string, string>;
  stages: readonly string[];
}

type SortField = 'title' | 'value' | 'created_at';

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

export function OpportunityTable({ opportunities, stageLabels, stages }: OpportunityTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sorted = [...opportunities].sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    if (sortField === 'title') return dir * a.title.localeCompare(b.title);
    if (sortField === 'value') return dir * ((a.value || 0) - (b.value || 0));
    return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  });

  // Stage progress bar
  const stageCounts: Record<string, number> = {};
  for (const s of stages) stageCounts[s] = 0;
  for (const opp of opportunities) {
    if (stageCounts[opp.stage] !== undefined) stageCounts[opp.stage]++;
  }
  const total = opportunities.length || 1;

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortOrder === 'asc' ? ' \u2191' : ' \u2193';
  };

  return (
    <div>
      {/* Stage progress bar */}
      <div className="flex rounded-lg overflow-hidden h-6 mb-4">
        {stages.map((stage) => {
          const count = stageCounts[stage] || 0;
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          const colorClass = STAGE_COLORS[stage] || 'bg-gray-400';
          return (
            <div
              key={stage}
              className={cn('flex items-center justify-center text-xs text-white font-medium', colorClass)}
              style={{ width: `${pct}%`, minWidth: count > 0 ? '24px' : 0 }}
              title={`${stageLabels[stage] || stage}: ${count}`}
            >
              {count > 0 && count}
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th
                className="text-left px-4 py-2 font-medium cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('title')}
              >
                Title{sortIndicator('title')}
              </th>
              <th className="text-left px-4 py-2 font-medium">Company / Contact</th>
              <th className="text-left px-4 py-2 font-medium">Stage</th>
              <th
                className="text-right px-4 py-2 font-medium cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('value')}
              >
                Value{sortIndicator('value')}
              </th>
              <th
                className="text-right px-4 py-2 font-medium cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('created_at')}
              >
                Created{sortIndicator('created_at')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((opp) => {
              const displayName =
                opp.type === 'in_house' && opp.company
                  ? opp.company.name
                  : opp.contact
                    ? `${opp.contact.first_name} ${opp.contact.last_name}`
                    : '\u2014';
              const stageColor = STAGE_COLORS[opp.stage] || 'bg-gray-400';
              return (
                <tr
                  key={opp.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/dashboard/lead-intelligence/opportunities/${opp.id}`)}
                >
                  <td className="px-4 py-3 font-medium">{opp.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{displayName}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', stageColor)} />
                      {stageLabels[opp.stage] || opp.stage}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {opp.value != null ? formatCurrency(opp.value) : '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(opp.created_at)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No opportunities found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
