import { Suspense } from 'react';
import { ProgramsSkeleton } from './programs-skeleton';
import { ProgramsContent } from './programs-content';
import { getProgramsList, getDistinctCities } from '@/lib/api/programs-queries';

export const metadata = {
  title: 'Programs | IAML Business OS',
  description: 'Program management, registrations, logistics, and attendance tracking',
};

// Revalidate every 5 minutes
export const revalidate = 300;

// Force dynamic rendering because we use searchParams
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    city?: string;
    format?: string;
    status?: string;
    sort?: string;
    order?: string;
    archived?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

async function ProgramsDataLoader({ searchParams }: { searchParams: PageProps['searchParams'] }) {
  const params = await searchParams;

  // Parse filters from URL params
  const filters = {
    city: params.city,
    format: params.format,
    status: (params.status as 'upcoming' | 'completed' | 'all') || 'upcoming',
    sort: (params.sort as 'start_date' | 'instance_name' | 'current_enrolled') || 'start_date',
    order: (params.order as 'asc' | 'desc') || 'asc',
    includeArchived: params.archived === 'true',
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };

  // Fetch data in parallel
  const [programs, cities] = await Promise.all([
    getProgramsList(filters),
    getDistinctCities(),
  ]);

  return (
    <ProgramsContent
      programs={programs}
      cities={cities}
      currentFilters={{
        city: filters.city || null,
        format: filters.format || null,
        status: filters.status,
        showArchived: filters.includeArchived,
        dateFrom: filters.dateFrom || null,
        dateTo: filters.dateTo || null,
      }}
      currentSort={{
        column: filters.sort,
        order: filters.order,
      }}
    />
  );
}

export default async function ProgramsPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<ProgramsSkeleton />}>
      <ProgramsDataLoader searchParams={searchParams} />
    </Suspense>
  );
}
