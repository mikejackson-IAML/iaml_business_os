'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/dashboard-kit/components/ui/input';
import { Button } from '@/dashboard-kit/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContactFiltersProps {
  isOpen: boolean;
  currentFilters: Record<string, string>;
}

const STATUS_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'do_not_contact', label: 'Do Not Contact' },
];

const SENIORITY_OPTIONS = [
  { value: 'c_suite', label: 'C-Suite' },
  { value: 'vp', label: 'VP' },
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior', label: 'Senior' },
  { value: 'mid', label: 'Mid' },
  { value: 'junior', label: 'Junior' },
  { value: 'entry', label: 'Entry' },
];

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '500+', label: '500+' },
];

const EMAIL_STATUS_OPTIONS = [
  { value: 'valid', label: 'Valid' },
  { value: 'invalid', label: 'Invalid' },
  { value: 'catch_all', label: 'Catch All' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'missing', label: 'Missing' },
];

export function ContactFilters({ isOpen, currentFilters }: ContactFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!isOpen) return null;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== '_all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/dashboard/lead-intelligence?${params.toString()}`);
  };

  const clearAll = () => {
    router.push('/dashboard/lead-intelligence');
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select
            value={currentFilters.status ?? '_all'}
            onValueChange={(v) => updateFilter('status', v)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* State */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">State</label>
          <Input
            placeholder="e.g. CA"
            className="h-9 text-sm"
            value={currentFilters.state ?? ''}
            onChange={(e) => updateFilter('state', e.target.value)}
          />
        </div>

        {/* Company */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Company</label>
          <Input
            placeholder="Company name..."
            className="h-9 text-sm"
            value={currentFilters.title_company ?? ''}
            onChange={(e) => updateFilter('title_company', e.target.value)}
          />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <Input
            placeholder="Job title..."
            className="h-9 text-sm"
            value={currentFilters.title ?? ''}
            onChange={(e) => updateFilter('title', e.target.value)}
          />
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Department</label>
          <Input
            placeholder="Department..."
            className="h-9 text-sm"
            value={currentFilters.department ?? ''}
            onChange={(e) => updateFilter('department', e.target.value)}
          />
        </div>

        {/* Seniority */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Seniority</label>
          <Select
            value={currentFilters.seniority_level ?? '_all'}
            onValueChange={(v) => updateFilter('seniority_level', v)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All</SelectItem>
              {SENIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company Size */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Company Size</label>
          <Select
            value={currentFilters.company_size ?? '_all'}
            onValueChange={(v) => updateFilter('company_size', v)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All</SelectItem>
              {COMPANY_SIZE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Email Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Email Status</label>
          <Select
            value={currentFilters.email_status ?? '_all'}
            onValueChange={(v) => updateFilter('email_status', v)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All</SelectItem>
              {EMAIL_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range - Created After */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Created After</label>
          <Input
            type="date"
            className="h-9 text-sm"
            value={currentFilters.created_after ?? ''}
            onChange={(e) => updateFilter('created_after', e.target.value)}
          />
        </div>

        {/* Date Range - Created Before */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Created Before</label>
          <Input
            type="date"
            className="h-9 text-sm"
            value={currentFilters.created_before ?? ''}
            onChange={(e) => updateFilter('created_before', e.target.value)}
          />
        </div>

        {/* Engagement Score Min */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Min Engagement</label>
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="0"
            className="h-9 text-sm"
            value={currentFilters.engagement_score_min ?? ''}
            onChange={(e) => updateFilter('engagement_score_min', e.target.value)}
          />
        </div>

        {/* Engagement Score Max */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Max Engagement</label>
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="100"
            className="h-9 text-sm"
            value={currentFilters.engagement_score_max ?? ''}
            onChange={(e) => updateFilter('engagement_score_max', e.target.value)}
          />
        </div>
      </div>

      {/* Clear all */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Clear All Filters
        </Button>
      </div>
    </div>
  );
}
