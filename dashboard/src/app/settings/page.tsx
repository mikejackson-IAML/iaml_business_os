'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/supabase/profiles';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
      }
      setIsLoading(false);
    }

    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage(null);

    const { success, error } = await updateProfile(user.id, { full_name: fullName });

    if (success) {
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } else {
      setMessage({ type: 'error', text: error || 'Failed to update profile' });
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[hsl(var(--background-card))] rounded" />
        <div className="h-12 bg-[hsl(var(--background-card))] rounded" />
        <div className="h-12 bg-[hsl(var(--background-card))] rounded" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-6">
        Profile Settings
      </h2>

      <form onSubmit={handleSave} className="space-y-6 max-w-md">
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-[hsl(var(--success-muted))] border border-[hsl(var(--success))] text-[hsl(var(--success))]'
                : 'bg-[hsl(var(--error-muted))] border border-[hsl(var(--error))] text-[hsl(var(--error))]'
            }`}
          >
            {message.text}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground-secondary))] mb-2">
            Email
          </label>
          <input
            type="email"
            value={profile?.email || ''}
            disabled
            className="w-full px-4 py-3 rounded-lg bg-[hsl(var(--background-card))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Email cannot be changed
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground-secondary))] mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[hsl(var(--background-card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-primary))] focus:border-transparent transition-colors"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground-secondary))] mb-2">
            Role
          </label>
          <div className="px-4 py-3 rounded-lg bg-[hsl(var(--background-card))] border border-[hsl(var(--border))]">
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                profile?.role === 'admin'
                  ? 'bg-[hsl(var(--accent-primary-muted))] text-[hsl(var(--accent-primary))]'
                  : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground-secondary))]'
              }`}
            >
              {profile?.role === 'admin' ? 'Admin' : 'Viewer'}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 rounded-lg bg-[hsl(var(--accent-primary))] text-[hsl(var(--primary-foreground))] font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-primary))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
