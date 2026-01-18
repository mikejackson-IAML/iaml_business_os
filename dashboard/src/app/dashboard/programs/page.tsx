import { Suspense } from 'react';
import { ProgramsSkeleton } from './programs-skeleton';
import { ProgramsContent } from './programs-content';
import { getProgramsDashboardData, getRecentRegistrations } from '@/lib/api/programs-queries';

export const metadata = {
  title: 'Programs & Operations | IAML Business OS',
  description: 'Program readiness, enrollment tracking, faculty management, and logistics',
};

// Revalidate every 5 minutes
export const revalidate = 300;

async function ProgramsDataLoader() {
  const [data, recentRegistrations] = await Promise.all([
    getProgramsDashboardData(),
    getRecentRegistrations(15),
  ]);

  return <ProgramsContent data={data} recentRegistrations={recentRegistrations} />;
}

export default function ProgramsDashboardPage() {
  return (
    <Suspense fallback={<ProgramsSkeleton />}>
      <ProgramsDataLoader />
    </Suspense>
  );
}
