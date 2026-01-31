'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProgramBlock } from '@/lib/api/programs-queries';

interface RosterFiltersProps {
  programId: string;
  blocks: ProgramBlock[];
  companies: string[]; // Unique company names from registrations
  sources: string[]; // Unique sources from registrations
  currentFilters: {
    paymentStatus?: string;
    block?: string;
    company?: string;
    source?: string;
  };
}

const PAYMENT_OPTIONS = [
  { value: '_all', label: 'All Payments' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Unpaid' },
  { value: 'Past Due', label: 'Past Due' },
];

const SOURCE_OPTIONS = [
  'Website',
  'Phone',
  'Email',
  'Colleague Outreach',
  'Repeat Customer',
  'Referral',
];

export function RosterFilters({
  programId,
  blocks,
  companies,
  sources,
  currentFilters,
}: RosterFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Count active filters
  const activeFilterCount = [
    currentFilters.paymentStatus,
    currentFilters.block,
    currentFilters.company,
    currentFilters.source,
  ].filter(Boolean).length;

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== '_all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/programs/${programId}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(`/dashboard/programs/${programId}`);
  }

  return (
    <div className="space-y-3">
      {/* Toggle button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg border bg-card">
          {/* Payment Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">
              Payment
            </label>
            <Select
              value={currentFilters.paymentStatus || '_all'}
              onValueChange={(v) => updateFilter('paymentStatus', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Payments" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Block filter - only show if program has blocks */}
          {blocks.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Block
              </label>
              <Select
                value={currentFilters.block || '_all'}
                onValueChange={(v) => updateFilter('block', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Blocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Blocks</SelectItem>
                  {blocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.shortName} - {block.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Company filter */}
          {companies.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Company
              </label>
              <Select
                value={currentFilters.company || '_all'}
                onValueChange={(v) => updateFilter('company', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Source filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">
              Source
            </label>
            <Select
              value={currentFilters.source || '_all'}
              onValueChange={(v) => updateFilter('source', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Sources</SelectItem>
                {(sources.length > 0 ? sources : SOURCE_OPTIONS).map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
