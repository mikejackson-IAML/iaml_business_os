'use client';

import { useState, useEffect } from 'react';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  RegistrationRosterItem,
  CompanyRegistrationHistoryItem,
} from '@/lib/api/programs-queries';
import { PersonHero } from './person-hero';
import { RegistrationSection } from './registration-section';
import { PaymentSection } from './payment-section';
import { CompanySection } from './company-section';
import { EngagementSection } from './engagement-section';

interface ContactPanelProps {
  registration: RegistrationRosterItem;
  onClose: () => void;
}

export function ContactPanel({ registration, onClose }: ContactPanelProps) {
  const [companyHistory, setCompanyHistory] = useState<
    CompanyRegistrationHistoryItem[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

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
      </div>
    </div>
  );
}
