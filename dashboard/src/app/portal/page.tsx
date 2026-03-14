import Link from 'next/link';
import { getPortalPrograms, computeOverviewMetrics } from '@/lib/api/portal-queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Progress } from '@/dashboard-kit/components/ui/progress';
import { PortalHeader } from './components/portal-header';
import { RealtimeRefresh } from './components/realtime-refresh';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysLabel(days: number | null): string {
  if (days === null) return '';
  if (days < 0) return 'In progress';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days away`;
}

export default async function PortalDashboardPage() {
  const programs = await getPortalPrograms();
  const metrics = computeOverviewMetrics(programs);

  return (
    <>
      <RealtimeRefresh table="registrations" />
      <PortalHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            label="Upcoming Programs"
            value={metrics.total_upcoming_programs.toString()}
          />
          <MetricCard
            label="Total Registrations"
            value={metrics.total_registrations.toString()}
          />
          <MetricCard
            label="Revenue Collected"
            value={formatCurrency(metrics.total_revenue)}
            accent
          />
          <MetricCard
            label="Outstanding"
            value={formatCurrency(metrics.total_outstanding)}
            warning={metrics.total_outstanding > 0}
          />
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-3 gap-4">
          <MiniStat label="Paid" value={metrics.total_paid} variant="healthy" />
          <MiniStat label="Pending" value={metrics.total_pending} variant="warning" />
          <MiniStat label="Invoice Sent" value={metrics.total_invoice_requested} variant="info" />
        </div>

        {/* Program Cards */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Programs</h2>
          {programs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No upcoming programs found.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {programs.map((program) => (
                <Link
                  key={program.id}
                  href={`/portal/program/${program.id}`}
                  className="block"
                >
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {program.instance_name || program.program_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(program.start_date)}
                            {program.city && ` \u00B7 ${program.city}, ${program.state}`}
                            {program.format && ` \u00B7 ${program.format}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {program.days_until_start !== null && program.days_until_start <= 14 && (
                            <Badge variant={program.days_until_start <= 7 ? 'critical' : 'warning'}>
                              {getDaysLabel(program.days_until_start)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Enrollment Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Enrollment</span>
                          <span className="font-medium">
                            {program.total_registered} / {program.max_capacity}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(
                            (program.total_registered / Math.max(program.max_capacity, 1)) * 100,
                            100
                          )}
                        />
                      </div>

                      {/* Payment Breakdown */}
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-muted-foreground">Paid</span>
                          <span className="font-medium">{program.total_paid}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          <span className="text-muted-foreground">Pending</span>
                          <span className="font-medium">{program.total_pending}</span>
                        </div>
                        {program.total_invoice_requested > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="text-muted-foreground">Invoice</span>
                            <span className="font-medium">{program.total_invoice_requested}</span>
                          </div>
                        )}
                        <div className="ml-auto font-medium text-foreground">
                          {formatCurrency(program.total_revenue + program.total_outstanding)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function MetricCard({
  label,
  value,
  accent,
  warning,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p
          className={`text-2xl font-bold mt-1 ${
            warning ? 'text-amber-400' : accent ? 'text-emerald-400' : 'text-foreground'
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: 'healthy' | 'warning' | 'info';
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
      style={{ background: 'hsl(218 30% 15% / 0.5)' }}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant={variant} className="text-sm">{value}</Badge>
    </div>
  );
}
