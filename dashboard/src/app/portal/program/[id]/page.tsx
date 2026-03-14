import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPortalRegistrations, getPortalProgramDetail } from '@/lib/api/portal-queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Button } from '@/dashboard-kit/components/ui/button';
import { PortalHeader } from '../../components/portal-header';
import { RealtimeRefresh } from '../../components/realtime-refresh';

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

const paymentVariants: Record<string, 'healthy' | 'warning' | 'critical' | 'info' | 'secondary'> = {
  Paid: 'healthy',
  'Paid in Full': 'healthy',
  Pending: 'warning',
  'Pending Payment': 'warning',
  'Past Due': 'critical',
  'Invoice Sent': 'info',
  'Invoice Pending': 'info',
  Refunded: 'secondary',
};

export default async function PortalProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [program, registrations] = await Promise.all([
    getPortalProgramDetail(id),
    getPortalRegistrations(id),
  ]);

  if (!program) {
    notFound();
  }

  const activeRegistrations = registrations.filter(
    (r) => r.registration_status !== 'Cancelled'
  );
  const cancelledRegistrations = registrations.filter(
    (r) => r.registration_status === 'Cancelled'
  );

  const isPaid = (r: { payment_status: string }) =>
    r.payment_status === 'Paid' || r.payment_status === 'Paid in Full';
  const isInvoice = (r: { payment_method: string | null }) =>
    r.payment_method === 'Invoice';

  const totalPaid = activeRegistrations.filter(isPaid).length;
  const totalPending = activeRegistrations.filter(
    (r) => !isPaid(r) && !isInvoice(r)
  ).length;
  const totalInvoice = activeRegistrations.filter(
    (r) => !isPaid(r) && isInvoice(r)
  ).length;
  const totalRevenue = activeRegistrations
    .filter(isPaid)
    .reduce((sum, r) => sum + r.final_price, 0);
  const totalOutstanding = activeRegistrations
    .filter((r) => !isPaid(r))
    .reduce((sum, r) => sum + r.final_price, 0);

  const fullProgram = activeRegistrations.filter((r) => r.attendance_type === 'Full').length;
  const blockOnly = activeRegistrations.filter((r) => r.attendance_type !== 'Full').length;

  return (
    <>
      <RealtimeRefresh table="registrations" filter={`program_instance_id=eq.${id}`} />
      <PortalHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Back Link */}
        <Link href="/portal">
          <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2">
            &larr; Back to Dashboard
          </Button>
        </Link>

        {/* Program Header */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold">
            {program.instance_name || program.program_name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(program.start_date)} &ndash; {formatDate(program.end_date)}
            {program.city && ` \u00B7 ${program.city}, ${program.state}`}
            {program.format && ` \u00B7 ${program.format}`}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard label="Registered" value={activeRegistrations.length.toString()} sublabel={`of ${program.max_capacity} max`} />
          <SummaryCard label="Paid" value={totalPaid.toString()} sublabel={formatCurrency(totalRevenue)} accent />
          <SummaryCard label="Pending / Invoice" value={`${totalPending} / ${totalInvoice}`} sublabel={formatCurrency(totalOutstanding)} warning={totalOutstanding > 0} />
          <SummaryCard label="Full / Block" value={`${fullProgram} / ${blockOnly}`} sublabel="Registration type" />
        </div>

        {/* Registration Roster */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Registrations ({activeRegistrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        No registrations yet.
                      </td>
                    </tr>
                  ) : (
                    activeRegistrations.map((reg) => {
                      const paid = isPaid(reg);
                      const invoice = isInvoice(reg);
                      const paymentLabel = invoice
                        ? paid
                          ? 'Invoice Paid'
                          : 'Invoice Pending'
                        : reg.payment_status;
                      const variant =
                        paymentLabel === 'Invoice Paid'
                          ? 'healthy'
                          : (paymentVariants[paymentLabel] || 'secondary');

                      return (
                        <tr key={reg.id} className="border-b border-border/50 hover:bg-muted/10">
                          <td className="px-4 py-3">
                            <div className="font-medium">{reg.first_name} {reg.last_name}</div>
                            {reg.job_title && (
                              <div className="text-xs text-muted-foreground">{reg.job_title}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {reg.company_name || '\u2014'}
                          </td>
                          <td className="px-4 py-3">
                            {reg.attendance_type === 'Full' ? (
                              <span className="text-foreground">Full Program</span>
                            ) : (
                              <span className="text-muted-foreground">
                                {reg.selected_blocks?.length || 0} Block{(reg.selected_blocks?.length || 0) !== 1 ? 's' : ''}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={variant}>{paymentLabel}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(reg.final_price)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(reg.registration_date)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Cancelled Registrations */}
        {cancelledRegistrations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-muted-foreground">
                Cancelled ({cancelledRegistrations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm opacity-60">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Refund</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancelledRegistrations.map((reg) => (
                      <tr key={reg.id} className="border-b border-border/50">
                        <td className="px-4 py-3 line-through">
                          {reg.first_name} {reg.last_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {reg.company_name || '\u2014'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{reg.payment_status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(reg.final_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}

function SummaryCard({
  label,
  value,
  sublabel,
  accent,
  warning,
}: {
  label: string;
  value: string;
  sublabel?: string;
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
        {sublabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
