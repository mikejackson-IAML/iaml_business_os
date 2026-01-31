'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/dashboard-kit/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/dashboard-kit/lib/utils';
import type {
  RegistrationRosterItem,
  CompanyRegistrationHistoryItem,
} from '@/lib/api/programs-queries';
import { PersonHero } from './person-hero';
import { RegistrationSection } from './registration-section';
import { PaymentSection } from './payment-section';
import { CompanySection } from './company-section';
import { EngagementSection } from './engagement-section';
import { ColleagueOutreachButton } from './colleague-outreach-button';

interface ContactPanelProps {
  registration: RegistrationRosterItem;
  onClose: () => void;
}

export function ContactPanel({ registration, onClose }: ContactPanelProps) {
  const [companyHistory, setCompanyHistory] = useState<
    CompanyRegistrationHistoryItem[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentStatus, setEnrichmentStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Fetch company history when registration changes
  useEffect(() => {
    async function loadCompanyHistory() {
      if (!registration.company_name) {
        setCompanyHistory([]);
        setLoadingHistory(false);
        return;
      }

      setLoadingHistory(true);
      try {
        const response = await fetch(
          `/api/programs/company-history?company=${encodeURIComponent(
            registration.company_name
          )}`
        );
        const data = await response.json();
        setCompanyHistory(data.history || []);
      } catch (error) {
        console.error('Failed to load company history:', error);
        setCompanyHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadCompanyHistory();
  }, [registration.company_name]);

  // Handle manual Apollo enrichment (PROG-32)
  async function handleEnrich() {
    setEnriching(true);
    setEnrichmentStatus(null);

    try {
      const response = await fetch('/api/apollo/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registration.email }),
      });

      const data = await response.json();

      if (data.success && data.matched) {
        setEnrichmentStatus({
          success: true,
          message: `Enriched: ${data.person?.name || registration.email}`,
        });
        toast.success('Contact enriched!');
        // Note: Would need to refresh panel data to show updated info
      } else if (data.skipped) {
        setEnrichmentStatus({
          success: true,
          message: 'Already enriched recently',
        });
        toast.info('Already enriched');
      } else {
        setEnrichmentStatus({
          success: false,
          message: data.error || 'No match found',
        });
        toast.error('Enrichment failed');
      }
    } catch (error) {
      setEnrichmentStatus({
        success: false,
        message: 'Error during enrichment',
      });
      toast.error('Enrichment error');
    } finally {
      setEnriching(false);
    }
  }

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
        {/* Person Hero Section */}
        <PersonHero registration={registration} />

        {/* Divider */}
        <div className="border-t" />

        {/* Registration Section */}
        <RegistrationSection registration={registration} />

        {/* Payment Section */}
        <PaymentSection registration={registration} />

        {/* Company Section */}
        {loadingHistory ? (
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Company
            </h3>
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          </section>
        ) : (
          <CompanySection
            registration={registration}
            companyHistory={companyHistory}
          />
        )}

        {/* Engagement Section (PROG-27 through PROG-31) */}
        <EngagementSection email={registration.email} />

        {/* Actions Section (PROG-25, PROG-26, PROG-32) */}
        <div className="pt-4 border-t space-y-4">
          <h3 className="font-semibold">Actions</h3>

          {/* Colleague Outreach - PROG-25, PROG-26 */}
          <ColleagueOutreachButton registration={registration} />

          {/* Manual Enrich - PROG-32 */}
          <Button
            onClick={handleEnrich}
            disabled={enriching}
            variant="outline"
            className="w-full"
          >
            {enriching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enriching...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Enrich with Apollo
              </>
            )}
          </Button>

          {enrichmentStatus && (
            <p
              className={cn(
                'text-sm',
                enrichmentStatus.success ? 'text-green-600' : 'text-amber-600'
              )}
            >
              {enrichmentStatus.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
