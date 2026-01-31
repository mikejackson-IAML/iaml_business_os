import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ProgramDetailSkeleton } from './program-detail-skeleton';
import { ProgramDetailContent } from './program-detail-content';
import { getProgram, getRegistrationsForProgram } from '@/lib/api/programs-queries';

export const revalidate = 60; // 1 minute

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    paymentStatus?: string;
    block?: string;
    company?: string;
    source?: string;
  }>;
}

async function ProgramDataLoader({
  programId,
  filters,
}: {
  programId: string;
  filters: Record<string, string | undefined>;
}) {
  const [program, registrations] = await Promise.all([
    getProgram(programId),
    getRegistrationsForProgram(programId, filters),
  ]);

  if (!program) {
    notFound();
  }

  return (
    <ProgramDetailContent
      program={program}
      registrations={registrations}
      currentFilters={filters}
    />
  );
}

export default async function ProgramDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const filters = await searchParams;

  return (
    <Suspense fallback={<ProgramDetailSkeleton />}>
      <ProgramDataLoader programId={id} filters={filters} />
    </Suspense>
  );
}
