'use client';

import type { OpportunityContact } from '@/lib/api/lead-intelligence-opportunities-types';

interface OpportunityContactsSectionProps {
  opportunityId: string;
  contacts: OpportunityContact[];
  onRefresh: () => void;
}

export function OpportunityContactsSection({ contacts }: OpportunityContactsSectionProps) {
  return (
    <div className="text-sm text-muted-foreground">
      {contacts.length} contact{contacts.length !== 1 ? 's' : ''} linked
    </div>
  );
}
