'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Loader2, DollarSign, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Input } from '@/dashboard-kit/components/ui/input';
import { toast } from 'sonner';
import type {
  Opportunity,
  OpportunityContact,
  OpportunityAttachment,
} from '@/lib/api/lead-intelligence-opportunities-types';
import {
  IN_HOUSE_STAGE_LABELS,
  INDIVIDUAL_STAGE_LABELS,
} from '@/lib/api/lead-intelligence-opportunities-types';
import { StageVisualization } from './stage-visualization';
import { OpportunityContactsSection } from './opportunity-contacts-section';
import { OpportunityNotesSection } from './opportunity-notes-section';
import { AttachmentUpload } from './attachment-upload';

interface OpportunityWithRelations extends Opportunity {
  contacts: OpportunityContact[];
  attachments: (OpportunityAttachment & { signed_url?: string | null })[];
}

interface OpportunityDetailProps {
  opportunityId: string;
}

export function OpportunityDetail({ opportunityId }: OpportunityDetailProps) {
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<OpportunityWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageLoading, setStageLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [lostReasonPrompt, setLostReasonPrompt] = useState(false);
  const [lostReason, setLostReason] = useState('');

  const fetchOpportunity = useCallback(async () => {
    try {
      const res = await fetch(`/api/lead-intelligence/opportunities/${opportunityId}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/dashboard/lead-intelligence/opportunities');
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setOpportunity(data);
    } catch (err) {
      console.error('Failed to fetch opportunity:', err);
      toast.error('Failed to load opportunity');
    } finally {
      setLoading(false);
    }
  }, [opportunityId, router]);

  useEffect(() => {
    fetchOpportunity();
  }, [fetchOpportunity]);

  async function handleStageChange(newStage: string) {
    if (!opportunity || stageLoading) return;

    // Lost requires reason
    if (newStage === 'lost') {
      setLostReasonPrompt(true);
      return;
    }

    await advanceToStage(newStage);
  }

  async function advanceToStage(newStage: string, notes?: string) {
    if (!opportunity) return;
    setStageLoading(true);
    try {
      const res = await fetch(`/api/lead-intelligence/opportunities/${opportunityId}/advance-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to advance stage');
      }
      const updated = await res.json();
      setOpportunity((prev) => prev ? { ...prev, ...updated } : prev);

      // If moving to lost with notes, also save notes
      if (notes && notes.trim()) {
        await fetch(`/api/lead-intelligence/opportunities/${opportunityId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: (opportunity.notes ? opportunity.notes + '\n\n' : '') + `Lost reason: ${notes}` }),
        });
        setOpportunity((prev) => prev ? {
          ...prev,
          notes: (prev.notes ? prev.notes + '\n\n' : '') + `Lost reason: ${notes}`,
        } : prev);
      }

      const labels = opportunity.type === 'in_house' ? IN_HOUSE_STAGE_LABELS : INDIVIDUAL_STAGE_LABELS;
      toast.success(`Stage updated to ${labels[newStage] ?? newStage}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to advance stage');
    } finally {
      setStageLoading(false);
    }
  }

  async function handleLostConfirm() {
    setLostReasonPrompt(false);
    await advanceToStage('lost', lostReason);
    setLostReason('');
  }

  async function handleDelete() {
    if (!opportunity || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/lead-intelligence/opportunities/${opportunityId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Opportunity deleted');
      router.push('/dashboard/lead-intelligence/opportunities');
    } catch {
      toast.error('Failed to delete opportunity');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  function startEdit() {
    if (!opportunity) return;
    setEditTitle(opportunity.title);
    setEditValue(opportunity.value != null ? String(opportunity.value) : '');
    setEditing(true);
  }

  async function saveEdit() {
    if (!opportunity || saving) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { title: editTitle.trim() };
      const val = parseFloat(editValue);
      if (!isNaN(val) && val >= 0) body.value = val;
      else if (editValue.trim() === '') body.value = null;

      const res = await fetch(`/api/lead-intelligence/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setOpportunity((prev) => prev ? { ...prev, ...updated } : prev);
      setEditing(false);
      toast.success('Opportunity updated');
    } catch {
      toast.error('Failed to update opportunity');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        Opportunity not found.
      </div>
    );
  }

  const stageLabels = opportunity.type === 'in_house' ? IN_HOUSE_STAGE_LABELS : INDIVIDUAL_STAGE_LABELS;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb & Header */}
      <div>
        <button
          onClick={() => router.push('/dashboard/lead-intelligence/opportunities')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Opportunities
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl font-semibold"
                  placeholder="Opportunity title"
                />
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Value (optional)"
                    className="w-40"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} disabled={saving || !editTitle.trim()}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-semibold truncate">{opportunity.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {opportunity.type === 'in_house' ? 'In-House' : 'Individual'}
                  </Badge>
                  <Badge variant="outline">
                    {stageLabels[opportunity.stage] ?? opportunity.stage}
                  </Badge>
                  {opportunity.value != null && (
                    <span className="text-sm text-muted-foreground flex items-center gap-0.5">
                      <DollarSign className="h-3 w-3" />
                      {opportunity.value.toLocaleString()}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          {!editing && (
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={startEdit}>
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
              {showDeleteConfirm ? (
                <div className="flex gap-1">
                  <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
                    {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stage Visualization */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pipeline Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <StageVisualization
            type={opportunity.type}
            currentStage={opportunity.stage}
            onStageChange={handleStageChange}
            disabled={stageLoading}
          />
          {stageLoading && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Updating stage...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lost Reason Dialog */}
      {lostReasonPrompt && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-medium">Why was this opportunity lost?</p>
            <textarea
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Enter reason (required)..."
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleLostConfirm} disabled={!lostReason.trim()}>
                Mark as Lost
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setLostReasonPrompt(false); setLostReason(''); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts Section */}
      <OpportunityContactsSection
        opportunityId={opportunityId}
        contacts={opportunity.contacts ?? []}
        onUpdate={fetchOpportunity}
      />

      {/* Notes Section */}
      <OpportunityNotesSection
        opportunityId={opportunityId}
        notes={opportunity.notes}
        onUpdate={fetchOpportunity}
      />

      {/* Attachments Section */}
      <AttachmentUpload
        opportunityId={opportunityId}
        attachments={opportunity.attachments ?? []}
        onUpdate={fetchOpportunity}
      />
    </div>
  );
}
