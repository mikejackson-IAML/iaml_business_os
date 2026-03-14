'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Input } from '@/dashboard-kit/components/ui/input';

export default function PortalLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        router.push('/portal');
      } else {
        setError('Invalid PIN. Please try again.');
        setPin('');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">IAML Portal</h1>
          <p className="text-sm text-muted-foreground">
            Enter your PIN to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="text-center text-lg tracking-[0.5em] h-14"
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-12"
            disabled={!pin || loading}
          >
            {loading ? 'Verifying...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
