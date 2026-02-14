import { Suspense } from 'react';
import { LinkedInContentSkeleton } from './linkedin-skeleton';
import { LinkedInContentDashboard } from './linkedin-content';
import { getLinkedInContentDashboardData } from '@/lib/api/linkedin-content-queries';

export const metadata = {
  title: 'LinkedIn Content Engine | IAML Business OS',
  description: 'Research, generate, publish, and analyze LinkedIn content',
};

// Revalidate every 5 minutes
export const revalidate = 300;

async function LinkedInContentDataLoader() {
  const data = await getLinkedInContentDashboardData();

  return <LinkedInContentDashboard data={data} />;
}

export default function LinkedInContentPage() {
  return (
    <Suspense fallback={<LinkedInContentSkeleton />}>
      <LinkedInContentDataLoader />
    </Suspense>
  );
}
