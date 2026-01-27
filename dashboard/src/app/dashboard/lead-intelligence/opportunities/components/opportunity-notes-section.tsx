'use client';

interface OpportunityNotesSectionProps {
  opportunityId: string;
  notes: string | null;
  onRefresh: () => void;
}

export function OpportunityNotesSection({ notes }: OpportunityNotesSectionProps) {
  return (
    <div className="text-sm text-muted-foreground">
      {notes || 'No notes yet'}
    </div>
  );
}
