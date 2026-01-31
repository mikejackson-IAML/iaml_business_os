'use client';

import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { RegistrationRosterItem } from '@/lib/api/programs-queries';

interface ContactPanelProps {
  registration: RegistrationRosterItem;
  onClose: () => void;
}

export function ContactPanel({ registration, onClose }: ContactPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <SheetHeader className="pb-4 border-b">
        <SheetTitle>{registration.full_name}</SheetTitle>
        <SheetDescription>
          {registration.company_name || 'No company'}
          {registration.job_title && ` - ${registration.job_title}`}
        </SheetDescription>
      </SheetHeader>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {/* Person Hero Section - Plan 02 */}
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Person</h3>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Person Hero section coming in Plan 02
            </p>
          </div>
        </section>

        {/* Registration Section - Plan 02 */}
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Registration</h3>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Registration section coming in Plan 02
            </p>
          </div>
        </section>

        {/* Payment Section - Plan 02 */}
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Payment</h3>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Payment section coming in Plan 02
            </p>
          </div>
        </section>

        {/* Company Section - Plan 02 */}
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Company section coming in Plan 02
            </p>
          </div>
        </section>

        {/* Engagement Section - Plan 03 */}
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Engagement</h3>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Engagement section coming in Plan 03
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
