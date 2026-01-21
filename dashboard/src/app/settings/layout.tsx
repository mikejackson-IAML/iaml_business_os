import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-6 lg:p-8">
        {/* Back to Dashboard */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[hsl(var(--foreground-secondary))] hover:text-[hsl(var(--foreground))] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Settings Header */}
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-8">
          Settings
        </h1>

        {/* Settings Navigation */}
        <div className="flex gap-4 mb-8 border-b border-[hsl(var(--border))]">
          <Link
            href="/settings"
            className="px-4 py-2 text-[hsl(var(--foreground-secondary))] hover:text-[hsl(var(--foreground))] border-b-2 border-transparent hover:border-[hsl(var(--accent-primary))] transition-colors -mb-px"
          >
            Profile
          </Link>
          <Link
            href="/settings/users"
            className="px-4 py-2 text-[hsl(var(--foreground-secondary))] hover:text-[hsl(var(--foreground))] border-b-2 border-transparent hover:border-[hsl(var(--accent-primary))] transition-colors -mb-px"
          >
            Users
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
