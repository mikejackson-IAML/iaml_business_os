import { Suspense } from 'react';
import { getOldProjects } from './actions';
import { MigrateContent } from './migrate-content';

export const dynamic = 'force-dynamic';

function MigrateSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="animate-pulse space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function MigratePage() {
  const oldProjects = await getOldProjects();

  return (
    <Suspense fallback={<MigrateSkeleton />}>
      <MigrateContent oldProjects={oldProjects} />
    </Suspense>
  );
}
