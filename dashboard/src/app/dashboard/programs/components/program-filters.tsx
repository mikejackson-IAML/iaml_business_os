'use client';

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

interface ProgramFiltersProps {
  cities: string[];
  currentFilters: {
    city: string | null;
    format: string | null;
    status: 'upcoming' | 'completed' | 'all';
    showArchived: boolean;
  };
  isOpen: boolean;
  onToggle: () => void;
}

const FORMAT_OPTIONS = [
  { value: '_all', label: 'All Formats' },
  { value: 'in-person', label: 'In-Person' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'on-demand', label: 'On-Demand' },
];

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All Programs' },
];

export function ProgramFilters({
  cities,
  currentFilters,
  isOpen,
  onToggle,
}: ProgramFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== '_all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/programs?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    // Keep sort if set
    const sort = searchParams.get('sort');
    const order = searchParams.get('order');
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);
    router.push(`/dashboard/programs?${params.toString()}`);
  };

  const hasActiveFilters = currentFilters.city || currentFilters.format || currentFilters.status !== 'upcoming';

  return (
    <div className="space-y-4">
      {/* Filter toggle button */}
      <div className="flex items-center gap-2">
        <Button
          variant={isOpen ? 'default' : 'outline'}
          size="sm"
          onClick={onToggle}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
              {[currentFilters.city, currentFilters.format, currentFilters.status !== 'upcoming' ? currentFilters.status : null].filter(Boolean).length}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {isOpen && (
        <div className="rounded-lg border bg-card p-4 space-y-4 animate-in fade-in-0 slide-in-from-top-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* City filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">City</label>
              <Select
                value={currentFilters.city ?? '_all'}
                onValueChange={(v) => updateFilter('city', v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Format</label>
              <Select
                value={currentFilters.format ?? '_all'}
                onValueChange={(v) => updateFilter('format', v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Formats" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={currentFilters.status}
                onValueChange={(v) => updateFilter('status', v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Upcoming" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
