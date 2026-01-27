'use client';

import type { OpportunityAttachment } from '@/lib/api/lead-intelligence-opportunities-types';

interface AttachmentUploadProps {
  opportunityId: string;
  attachments: (OpportunityAttachment & { signed_url?: string | null })[];
  onRefresh: () => void;
}

export function AttachmentUpload({ attachments }: AttachmentUploadProps) {
  return (
    <div className="text-sm text-muted-foreground">
      {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
    </div>
  );
}
