'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/supabase/profiles';
import { createClient } from '@/lib/supabase/client';
import { Toggle } from '@/components/ui/toggle';
import { toast } from 'sonner';
import type { Profile } from '@/lib/supabase/types';

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Notification preferences state
  const [dailyDigest, setDailyDigest] = useState(true);
  const [digestTime, setDigestTime] = useState('08:00');
  const [criticalAlerts, setCriticalAlerts] = useState(true);

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
        // Load notification preferences
        setDailyDigest(data.notification_daily_digest ?? true);
        setDigestTime(data.notification_digest_time || '08:00');
        setCriticalAlerts(data.notification_critical_alerts ?? true);
      }
      setIsLoading(false);
    }

    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);

    const { success, error } = await updateProfile(user.id, {
      full_name: fullName,
      notification_daily_digest: dailyDigest,
      notification_digest_time: digestTime,
      notification_critical_alerts: criticalAlerts,
    });

    if (success) {
      toast.success('Settings saved successfully');
    } else {
      toast.error(error || 'Failed to save settings');
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
      <form onSubmit={handleSave} className="space-y-8 max-w-md">
        {/* Profile Section */}
        <section>
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-6">
            Profile Settings
          </h2>

          <div className="space-y-6">
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
          </div>
        </section>

        {/* Notifications Section */}
        <section>
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-6">
            Notifications
          </h2>

          <div className="space-y-6">
            {/* Daily Digest Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="daily-digest"
                  className="block text-sm font-medium text-[hsl(var(--foreground))]"
                >
                  Daily Digest
                </label>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Receive a summary of your tasks each morning
                </p>
              </div>
              <Toggle
                id="daily-digest"
                checked={dailyDigest}
                onChange={setDailyDigest}
                aria-label="Enable daily digest"
              />
            </div>

            {/* Digest Time - only show when daily digest is enabled */}
            {dailyDigest && (
              <div>
                <label
                  htmlFor="digest-time"
                  className="block text-sm font-medium text-[hsl(var(--foreground-secondary))] mb-2"
                >
                  Digest Time
                </label>
                <input
                  id="digest-time"
                  type="time"
                  value={digestTime}
                  onChange={(e) => setDigestTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[hsl(var(--background-card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-primary))] focus:border-transparent transition-colors"
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Time to receive your daily task summary
                </p>
              </div>
            )}

            {/* Critical Alerts Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="critical-alerts"
                  className="block text-sm font-medium text-[hsl(var(--foreground))]"
                >
                  Critical Alerts
                </label>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Get notified immediately for critical priority tasks
                </p>
              </div>
              <Toggle
                id="critical-alerts"
                checked={criticalAlerts}
                onChange={setCriticalAlerts}
                aria-label="Enable critical alerts"
              />
            </div>
          </div>
        </section>

        {/* Save Button */}
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
