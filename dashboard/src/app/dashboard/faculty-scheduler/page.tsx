import { Suspense } from 'react';
import { FacultySchedulerSkeleton } from './faculty-scheduler-skeleton';
import { FacultySchedulerContent } from './content';
import { getFacultySchedulerDashboardData } from '@/lib/api/faculty-scheduler-queries';

export const metadata = {
  title: 'Faculty Scheduler | IAML Business OS',
  description: 'Instructor recruitment pipeline - tier management, assignment, and notifications',
};

// Revalidate every 5 minutes
export const revalidate = 300;

async function FacultySchedulerDataLoader() {
  const data = await getFacultySchedulerDashboardData();
  return <FacultySchedulerContent data={data} />;
}

export default function FacultySchedulerPage() {
  return (
    <Suspense fallback={<FacultySchedulerSkeleton />}>
      <FacultySchedulerDataLoader />
    </Suspense>
  );
}
