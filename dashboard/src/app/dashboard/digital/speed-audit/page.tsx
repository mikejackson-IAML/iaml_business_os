import { Suspense } from 'react';
import { SpeedAuditContent } from './speed-audit-content';
import { getSpeedAuditDashboardData } from '@/lib/api/speed-audit-queries';

export const metadata = {
  title: 'Speed Audit | IAML Business OS',
  description: 'Weekly speed optimization audit tracking and approval',
};

// Revalidate every 5 minutes
export const revalidate = 300;

function SpeedAuditSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-10 w-32 bg-gray-200 rounded" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function SpeedAuditDataLoader() {
  const data = await getSpeedAuditDashboardData();
  return <SpeedAuditContent data={data} />;
}

export default function SpeedAuditPage() {
  return (
    <div className="p-6">
      <Suspense fallback={<SpeedAuditSkeleton />}>
        <SpeedAuditDataLoader />
      </Suspense>
    </div>
  );
}
