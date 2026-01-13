'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User, Settings, ChevronDown, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
    router.refresh();
  };

  if (!user) return null;

  const email = user.email || 'User';
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--background-card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--accent-primary))] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[hsl(var(--accent-primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] text-sm font-medium">
          {initials}
        </div>
        <span className="text-sm text-[hsl(var(--foreground-secondary))] hidden sm:inline max-w-32 truncate">
          {email}
        </span>
        <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-[hsl(var(--background-card))] border border-[hsl(var(--border))] shadow-lg py-1 z-50">
          <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">
              Signed in as
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] truncate">
              {email}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[hsl(var(--foreground-secondary))] hover:bg-[hsl(var(--background-card-light))] transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              CEO Dashboard
            </Link>

            <Link
              href="/dashboard/marketing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[hsl(var(--foreground-secondary))] hover:bg-[hsl(var(--background-card-light))] transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Marketing
            </Link>

            <div className="border-t border-[hsl(var(--border))] my-1" />

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[hsl(var(--foreground-secondary))] hover:bg-[hsl(var(--background-card-light))] transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>

            <Link
              href="/settings/users"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[hsl(var(--foreground-secondary))] hover:bg-[hsl(var(--background-card-light))] transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[hsl(var(--error))] hover:bg-[hsl(var(--error-muted))] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
