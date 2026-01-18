'use client';

import { User, Building2, Calendar, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import type { RegistrationSummary } from '@/lib/api/programs-queries';

interface RegistrationsTableProps {
  registrations: RegistrationSummary[];
  title?: string;
  maxItems?: number;
}

const paymentStatusColors: Record<string, string> = {
  Paid: 'bg-success/20 text-success',
  Pending: 'bg-warning/20 text-warning',
  Refunded: 'bg-error/20 text-error',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatBlocks(attendanceType: string, selectedBlocks: string[] | null): string {
  if (attendanceType === 'Full' || !selectedBlocks || selectedBlocks.length === 0) {
    return 'Full Program';
  }
  // Abbreviate block names if too long
  return selectedBlocks.map(block => {
    if (block.length > 25) {
      return block.substring(0, 22) + '...';
    }
    return block;
  }).join(', ');
}

export function RegistrationsTable({
  registrations,
  title = 'Recent Registrations',
  maxItems = 10,
}: RegistrationsTableProps) {
  const displayedRegs = registrations.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md flex items-center gap-2">
          <User className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedRegs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No registrations found. Registrations will appear here after the Airtable sync runs.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Name</th>
                  <th className="pb-3 font-medium text-muted-foreground">Company</th>
                  <th className="pb-3 font-medium text-muted-foreground">Program</th>
                  <th className="pb-3 font-medium text-muted-foreground">Blocks</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Payment</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {displayedRegs.map((reg) => (
                  <tr
                    key={reg.id}
                    className="border-b border-border/50 hover:bg-background-card-light/50 transition-colors"
                  >
                    <td className="py-3">
                      <div>
                        <p className="font-medium text-foreground">{reg.full_name}</p>
                        <p className="text-sm text-muted-foreground">{reg.job_title || '-'}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{reg.company_name || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="text-sm font-medium">{reg.program_name || '-'}</p>
                        <p className="text-xs text-muted-foreground">
                          {reg.city ? `${reg.city}, ${reg.state}` : reg.format || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-sm">
                        {formatBlocks(reg.attendance_type, reg.selected_blocks)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            paymentStatusColors[reg.payment_status] ||
                            'bg-muted text-muted-foreground'
                          }`}
                        >
                          {reg.payment_status}
                        </span>
                        {reg.final_price > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ${reg.final_price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(reg.registration_date)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registrations.length > maxItems && (
              <p className="text-sm text-muted-foreground text-center pt-4 border-t border-border mt-4">
                + {registrations.length - maxItems} more registrations
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
