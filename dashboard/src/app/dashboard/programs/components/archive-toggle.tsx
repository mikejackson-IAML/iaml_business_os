'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Archive } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';

interface ArchiveToggleProps {
  showArchived: boolean;
}

export function ArchiveToggle({ showArchived }: ArchiveToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleArchived = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (showArchived) {
      params.delete('archived');
      // Reset to upcoming status when hiding archive
      params.set('status', 'upcoming');
    } else {
      params.set('archived', 'true');
      params.set('status', 'all');
    }
    router.push(`/dashboard/programs?${params.toString()}`);
  };

  return (
    <Button
      variant={showArchived ? 'secondary' : 'ghost'}
      size="sm"
      onClick={toggleArchived}
      className="gap-2"
    >
      <Archive className="h-4 w-4" />
      {showArchived ? 'Hide Archive' : 'Show Archive'}
    </Button>
  );
}
