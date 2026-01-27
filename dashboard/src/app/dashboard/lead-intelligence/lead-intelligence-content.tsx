'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/dashboard-kit/components/ui/input';
import { Button } from '@/dashboard-kit/components/ui/button';
import { MetricsBar } from './components/metrics-bar';
import { DataHealthSection } from './components/data-health-section';
import { ContactTable } from './components/contact-table';
import { ContactFilters } from './components/contact-filters';
import { AISearchBar } from './components/ai-search-bar';
import { FilterPills } from './components/filter-pills';
import type { Contact, ContactListParams, ContactListResponse } from '@/lib/api/lead-intelligence-contacts-types';

interface LeadIntelligenceContentProps {
  initialContacts: ContactListResponse;
  initialMetrics: {
    total_contacts: number;
    total_customers: number;
    total_companies: number;
    data_quality_score: number;
  };
  initialDataHealth: {
    email_valid_pct: number;
    email_invalid_count: number;
    stale_count: number;
    missing_email_count: number;
    missing_phone_count: number;
    missing_title_count: number;
    last_calculated: string;
  } | null;
}

export function LeadIntelligenceContent({
  initialContacts,
  initialMetrics,
  initialDataHealth,
}: LeadIntelligenceContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>(initialContacts.data);
  const [meta, setMeta] = useState(initialContacts.meta);
  const [isLoading, setIsLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '');
  const [aiFilters, setAiFilters] = useState<Partial<ContactListParams>>({});

  // Count active filters (excluding page, limit, sort, order, search)
  const activeFilterCount = useMemo(() => {
    const nonFilterKeys = new Set(['page', 'limit', 'sort', 'order', 'search']);
    let count = 0;
    searchParams.forEach((_, key) => {
      if (!nonFilterKeys.has(key)) count++;
    });
    return count;
  }, [searchParams]);

  // Build current filters record from URL
  const currentFilters = useMemo(() => {
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      filters[key] = value;
    });
    return filters;
  }, [searchParams]);

  const handleAiFiltersApplied = useCallback((filters: Partial<ContactListParams>) => {
    setAiFilters(filters);
  }, []);

  const handleAiFilterRemove = useCallback((key: string) => {
    setAiFilters((prev) => {
      const next = { ...prev };
      delete next[key as keyof ContactListParams];
      return next;
    });
  }, []);

  const handleAiFilterClearAll = useCallback(() => {
    setAiFilters({});
  }, []);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      // Merge AI filters into params
      for (const [key, value] of Object.entries(aiFilters)) {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      }
      if (!params.has('page')) params.set('page', '1');
      if (!params.has('limit')) params.set('limit', '25');

      const res = await fetch(`/api/lead-intelligence/contacts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      const data: ContactListResponse = await res.json();
      if (!data.data || !data.meta) throw new Error('Invalid response shape');
      setContacts(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, aiFilters]);

  // Refetch on URL param changes or AI filter changes
  useEffect(() => {
    if (searchParams.toString() || Object.keys(aiFilters).length > 0) {
      fetchContacts();
    }
  }, [searchParams, aiFilters, fetchContacts]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set('search', searchValue);
      } else {
        params.delete('search');
      }
      params.set('page', '1');
      router.push(`/dashboard/lead-intelligence?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const handleSort = (field: string, order: 'asc' | 'desc') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', field);
    params.set('order', order);
    params.set('page', '1');
    router.push(`/dashboard/lead-intelligence?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`/dashboard/lead-intelligence?${params.toString()}`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead Intelligence</h1>
        <p className="text-muted-foreground">
          {meta.total.toLocaleString()} contacts
        </p>
      </div>

      {/* Metrics */}
      <MetricsBar metrics={initialMetrics} />

      {/* Data Health */}
      {initialDataHealth && (
        <DataHealthSection dataHealth={initialDataHealth} />
      )}

      {/* AI Search */}
      <AISearchBar onFiltersApplied={handleAiFiltersApplied} />

      {/* AI Filter Pills */}
      <FilterPills
        filters={aiFilters}
        onRemove={handleAiFilterRemove}
        onClearAll={handleAiFilterClearAll}
      />

      {/* Search + Filter toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={filtersOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <span className="ml-1.5 rounded-full bg-primary-foreground text-primary h-5 w-5 text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filters panel */}
      <ContactFilters isOpen={filtersOpen} currentFilters={currentFilters} />

      {/* Table */}
      <ContactTable
        contacts={contacts}
        isLoading={isLoading}
        onSort={handleSort}
        currentSort={searchParams.get('sort') ?? 'created_at'}
        currentOrder={(searchParams.get('order') as 'asc' | 'desc') ?? 'desc'}
        pagination={{
          currentPage: meta.page,
          totalPages: meta.total_pages,
          itemsPerPage: meta.limit,
          totalItems: meta.total,
          onPageChange: handlePageChange,
        }}
      />
    </div>
  );
}
