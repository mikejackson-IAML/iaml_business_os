'use client';

import type { Contact } from '@/lib/api/lead-intelligence-contacts-types';

interface OverviewTabProps {
  contactId: string;
  contact: Contact;
}

export function OverviewTab({ contactId, contact }: OverviewTabProps) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
      Overview tab loading for {contact.first_name} (ID: {contactId})...
    </div>
  );
}
