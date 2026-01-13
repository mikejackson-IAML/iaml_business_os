import { getServerClient } from './server';
import { createClient } from './client';
import type { Profile, ProfileUpdate } from './types';

/**
 * Get the current user's profile (server-side)
 */
export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  const supabase = getServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data as Profile;
}

/**
 * Get all profiles (admin only, server-side)
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = getServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  return (data as Profile[]) || [];
}

/**
 * Update a user's profile (client-side)
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update a user's role (admin only, client-side)
 */
export async function updateUserRole(
  userId: string,
  role: 'admin' | 'viewer'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Deactivate a user (admin only, client-side)
 */
export async function deactivateUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ is_active: false })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if the current user is an admin (client-side)
 */
export async function checkIsAdmin(): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role === 'admin';
}

/**
 * Invite a new user (admin only)
 * Uses Supabase Admin API to create user with invite
 */
export async function inviteUser(
  email: string,
  role: 'admin' | 'viewer' = 'viewer'
): Promise<{ success: boolean; error?: string }> {
  // This needs to be done via API route since it requires admin privileges
  const response = await fetch('/api/users/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error || 'Failed to invite user' };
  }

  return { success: true };
}
