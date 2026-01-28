import { Suspense } from 'react';
import { OpportunitiesContent } from './opportunities-content';
import { OpportunitiesSkeleton } from './opportunities-skeleton';

export const metadata = {
  title: 'Opportunities | Lead Intelligence',
};

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<OpportunitiesSkeleton />}>
      <OpportunitiesContent />
    </Suspense>
  );
}
