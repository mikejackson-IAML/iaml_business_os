import { Suspense } from 'react';
import ActionCenterSkeleton from './action-center-skeleton';
import ActionCenterDataLoader from './action-center-data-loader';

export const metadata = {
  title: 'Action Center | IAML Business OS',
  description: 'Manage tasks, workflows, and action items',
};

export default function ActionCenterPage() {
  return (
    <Suspense fallback={<ActionCenterSkeleton />}>
      <ActionCenterDataLoader />
    </Suspense>
  );
}
