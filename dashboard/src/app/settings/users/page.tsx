'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { updateUserRole, deactivateUser, inviteUser } from '@/lib/supabase/profiles';
import { UserPlus, Shield, ShieldOff, UserX } from 'lucide-react';
import type { Profile } from '@/lib/supabase/types';

export default function UsersSettingsPage() {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'viewer'>('viewer');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    const supabase = createClient();

    // Get current user's profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setCurrentProfile(profile as Profile);

    // If admin, get all users
    if (profile?.role === 'admin') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allUsers } = await (supabase as any)
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      setUsers((allUsers as Profile[]) || []);
    }

    setIsLoading(false);
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setMessage(null);

    const { success, error } = await inviteUser(inviteEmail, inviteRole);

    if (success) {
      setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}` });
      setInviteEmail('');
      setInviteRole('viewer');
      setShowInviteModal(false);
      loadData(); // Refresh user list
    } else {
      setMessage({ type: 'error', text: error || 'Failed to send invitation' });
    }

    setIsInviting(false);
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'viewer') => {
    const { success, error } = await updateUserRole(userId, newRole);

    if (success) {
      setMessage({ type: 'success', text: 'Role updated successfully' });
      loadData();
    } else {
      setMessage({ type: 'error', text: error || 'Failed to update role' });
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    const { success, error } = await deactivateUser(userId);

    if (success) {
      setMessage({ type: 'success', text: 'User deactivated' });
      loadData();
    } else {
      setMessage({ type: 'error', text: error || 'Failed to deactivate user' });
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[hsl(var(--background-card))] rounded" />
        <div className="h-24 bg-[hsl(var(--background-card))] rounded" />
        <div className="h-24 bg-[hsl(var(--background-card))] rounded" />
      </div>
    );
  }

  if (currentProfile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
          Admin Access Required
        </h2>
        <p className="text-[hsl(var(--foreground-secondary))]">
          Only administrators can manage users.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
          User Management
        </h2>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--accent-primary))] text-[hsl(var(--primary-foreground))] font-medium hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.type === 'success'
              ? 'bg-[hsl(var(--success-muted))] border border-[hsl(var(--success))] text-[hsl(var(--success))]'
              : 'bg-[hsl(var(--error-muted))] border border-[hsl(var(--error))] text-[hsl(var(--error))]'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {users.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--background-card))] border border-[hsl(var(--border))]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent-primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] font-medium">
                {profile.email.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-[hsl(var(--foreground))]">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Role Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  profile.role === 'admin'
                    ? 'bg-[hsl(var(--accent-primary-muted))] text-[hsl(var(--accent-primary))]'
                    : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground-secondary))]'
                }`}
              >
                {profile.role === 'admin' ? 'Admin' : 'Viewer'}
              </span>

              {/* Status */}
              {!profile.is_active && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[hsl(var(--error-muted))] text-[hsl(var(--error))]">
                  Inactive
                </span>
              )}

              {/* Actions (not for self) */}
              {profile.id !== user?.id && profile.is_active && (
                <div className="flex items-center gap-2">
                  {profile.role === 'viewer' ? (
                    <button
                      onClick={() => handleRoleChange(profile.id, 'admin')}
                      className="p-2 rounded-lg hover:bg-[hsl(var(--background-card-light))] text-[hsl(var(--foreground-secondary))] hover:text-[hsl(var(--accent-primary))] transition-colors"
                      title="Make Admin"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(profile.id, 'viewer')}
                      className="p-2 rounded-lg hover:bg-[hsl(var(--background-card-light))] text-[hsl(var(--foreground-secondary))] hover:text-[hsl(var(--warning))] transition-colors"
                      title="Remove Admin"
                    >
                      <ShieldOff className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeactivate(profile.id)}
                    className="p-2 rounded-lg hover:bg-[hsl(var(--error-muted))] text-[hsl(var(--foreground-secondary))] hover:text-[hsl(var(--error))] transition-colors"
                    title="Deactivate User"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              )}

              {profile.id === user?.id && (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  (You)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[hsl(var(--background-card))] rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">
              Invite New User
            </h3>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground-secondary))] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-primary))] focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground-secondary))] mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'viewer')}
                  className="w-full px-4 py-3 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-primary))] focus:border-transparent"
                >
                  <option value="viewer">Viewer (Read-only access)</option>
                  <option value="admin">Admin (Full access)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground-secondary))] hover:bg-[hsl(var(--background-card-light))] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex-1 px-4 py-2 rounded-lg bg-[hsl(var(--accent-primary))] text-[hsl(var(--primary-foreground))] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
