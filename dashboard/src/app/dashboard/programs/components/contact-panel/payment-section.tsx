'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle } from 'lucide-react';
import type { RegistrationRosterItem } from '@/lib/api/programs-queries';
import { formatDate, formatCurrency } from '@/dashboard-kit/lib/utils';

interface PaymentSectionProps {
  registration: RegistrationRosterItem;
}

/**
 * Payment Section for Contact Panel
 * Displays payment status, due date, days calculation, and quick actions
 */
export function PaymentSection({ registration }: PaymentSectionProps) {
  // Payment status
  const isPaid = registration.payment_status?.toLowerCase() === 'paid';
  const paymentDueDate = (registration as Record<string, unknown>).payment_due_date as
    | string
    | null;

  // Calculate days until/past due
  const daysInfo = calculateDaysInfo(paymentDueDate, isPaid);

  // Status badge styling
  const statusVariant = isPaid
    ? 'default'
    : daysInfo.isPastDue
      ? 'destructive'
      : 'secondary';
  const statusLabel = isPaid ? 'Paid' : daysInfo.isPastDue ? 'Overdue' : 'Unpaid';

  // Quick action handlers (disabled for now, will be wired in later phase)
  const handleSendReminder = () => {
    // TODO: Wire to n8n workflow for payment reminder
    console.log('Send reminder clicked for:', registration.id);
  };

  const handleMarkPaid = () => {
    // TODO: Wire to Supabase update for payment status
    console.log('Mark paid clicked for:', registration.id);
  };

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Payment</h3>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        {/* Status and Due Date */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={statusVariant}>{statusLabel}</Badge>

          {!isPaid && paymentDueDate && (
            <span className={`text-sm ${daysInfo.isPastDue ? 'text-destructive' : 'text-muted-foreground'}`}>
              {daysInfo.displayText}
            </span>
          )}

          {registration.final_price > 0 && (
            <span className="text-sm text-muted-foreground">
              {formatCurrency(registration.final_price)}
            </span>
          )}
        </div>

        {/* Due Date Row */}
        {paymentDueDate && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Due:</span>
            <span className="font-medium">{formatDate(paymentDueDate)}</span>
          </div>
        )}

        {/* Quick Actions - only show if not paid */}
        {!isPaid && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReminder}
              disabled
              className="gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              Send Reminder
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkPaid}
              disabled
              className="gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Mark Paid
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Calculate days until/past due from due date
 */
function calculateDaysInfo(
  dueDate: string | null,
  isPaid: boolean
): { days: number; isPastDue: boolean; displayText: string } {
  if (!dueDate || isPaid) {
    return { days: 0, isPastDue: false, displayText: '' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      days: Math.abs(days),
      isPastDue: true,
      displayText: `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} past due`,
    };
  } else if (days === 0) {
    return {
      days: 0,
      isPastDue: false,
      displayText: 'Due today',
    };
  } else {
    return {
      days,
      isPastDue: false,
      displayText: `Due in ${days} day${days !== 1 ? 's' : ''}`,
    };
  }
}
