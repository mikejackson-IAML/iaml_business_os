'use client';

interface EmailCampaignsTabProps {
  contactId: string;
}

export function EmailCampaignsTab({ contactId }: EmailCampaignsTabProps) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
      Email &amp; Campaigns tab loading for contact {contactId}...
    </div>
  );
}
