import Link from 'next/link';
import { FallingPattern } from '@/components/ui/falling-pattern';

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Background pattern */}
      <FallingPattern
        color="hsl(var(--accent-primary))"
        backgroundColor="hsl(var(--background))"
        duration={150}
        blurIntensity="1em"
        density={1}
        className="fixed inset-0 -z-10"
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-8">
        <main className="dashboard-card p-8 max-w-lg text-center animate-card-entrance">
          {/* Live badge */}
          <div className="flex justify-center mb-6">
            <span className="badge-live">LIVE</span>
          </div>

          {/* Title */}
          <h1 className="text-display-sm text-foreground mb-2">
            Nexus OS
          </h1>
          <p className="text-overline mb-6">BUSINESS OPERATIONS DASHBOARD</p>

          {/* Status indicators */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="dashboard-card-spotlight p-4">
              <p className="text-caption mb-1">Systems</p>
              <div className="flex items-center gap-2">
                <span className="status-dot status-dot-healthy"></span>
                <span className="text-heading-sm text-foreground">Online</span>
              </div>
            </div>
            <div className="dashboard-card-spotlight p-4">
              <p className="text-caption mb-1">Health</p>
              <div className="flex items-center gap-2">
                <span className="status-dot status-dot-healthy"></span>
                <span className="text-heading-sm text-foreground">98%</span>
              </div>
            </div>
            <div className="dashboard-card-spotlight p-4">
              <p className="text-caption mb-1">Uptime</p>
              <div className="flex items-center gap-2">
                <span className="status-dot status-dot-info"></span>
                <span className="text-heading-sm text-foreground font-mono">14d</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-8">
            Connected to Supabase. Campaign data ready. Real-time metrics enabled.
          </p>

          {/* Action button */}
          <Link
            href="/dashboard"
            className="block w-full h-12 rounded-lg font-semibold transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center"
            style={{
              background: 'hsl(var(--accent-primary))',
              color: 'hsl(var(--background))'
            }}
          >
            Enter Dashboard
          </Link>
        </main>

        {/* Footer */}
        <footer className="mt-8 text-caption">
          <span className="font-mono">v1.0.0</span> · Nexus OS Dashboard
        </footer>
      </div>
    </div>
  );
}
