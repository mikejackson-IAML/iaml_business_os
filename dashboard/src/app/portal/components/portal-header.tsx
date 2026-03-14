'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/dashboard-kit/components/ui/button';

export function PortalHeader() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/portal/auth', { method: 'DELETE' });
    router.push('/portal/login');
  }

  return (
    <header className="border-b border-border sticky top-0 z-50"
      style={{ background: 'hsl(220 35% 7% / 0.95)', backdropFilter: 'blur(8px)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          IAML Executive Portal
        </h1>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs text-muted-foreground">
          Sign Out
        </Button>
      </div>
    </header>
  );
}
