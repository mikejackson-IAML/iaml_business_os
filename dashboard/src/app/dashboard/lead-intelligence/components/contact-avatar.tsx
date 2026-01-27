'use client';

import { useState } from 'react';
import { cn } from '@/dashboard-kit/lib/utils';

interface ContactAvatarProps {
  contact: {
    first_name?: string;
    last_name?: string;
    profile_image_url?: string | null;
    status?: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
} as const;

function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0) ?? '';
  const last = lastName?.charAt(0) ?? '';
  return (first + last).toUpperCase() || '?';
}

export function ContactAvatar({ contact, size = 'md' }: ContactAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const { first_name, last_name, profile_image_url } = contact;
  const initials = getInitials(first_name, last_name);
  const nameStr = `${first_name ?? ''}${last_name ?? ''}`;

  if (profile_image_url && !imgError) {
    return (
      <img
        src={profile_image_url}
        alt={`${first_name ?? ''} ${last_name ?? ''}`.trim() || 'Contact'}
        className={cn('rounded-full object-cover', sizeClasses[size])}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium text-white shrink-0',
        sizeClasses[size]
      )}
      style={{ backgroundColor: hashStringToColor(nameStr || 'unknown') }}
      aria-label={`${first_name ?? ''} ${last_name ?? ''}`.trim() || 'Contact'}
    >
      {initials}
    </div>
  );
}
