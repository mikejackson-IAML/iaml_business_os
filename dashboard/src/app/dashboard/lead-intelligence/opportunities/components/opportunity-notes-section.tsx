'use client';

import { useState } from 'react';
import { Save, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import { toast } from 'sonner';

interface OpportunityNotesSectionProps {
  opportunityId: string;
  notes: string | null;
  onUpdate: () => void;
}

export function OpportunityNotesSection({ opportunityId, notes, onUpdate }: OpportunityNotesSectionProps) {
  const [value, setValue] = useState(notes ?? '');
  const [saving, setSaving] = useState(false);
  const isDirty = value !== (notes ?? '');

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/lead-intelligence/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: value || null }),
      });
      if (!res.ok) throw new Error('Failed to save notes');
      toast.success('Notes saved');
      onUpdate();
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notes
          </CardTitle>
          {isDirty && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
              Save
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add notes about this opportunity..."
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
        />
      </CardContent>
    </Card>
  );
}
