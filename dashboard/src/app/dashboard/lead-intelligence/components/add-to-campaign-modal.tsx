'use client';

import { useState, useEffect } from 'react';
import { Send, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/dashboard-kit/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Campaign {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

interface DuplicateInfo {
  email: string;
  name: string;
}

interface AddToCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactIds: string[];
  onSuccess: () => void;
}

export function AddToCampaignModal({
  open,
  onOpenChange,
  contactIds,
  onSuccess,
}: AddToCampaignModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Duplicate confirmation state
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Fetch campaigns on open
  useEffect(() => {
    if (!open) {
      setSelectedCampaignId(null);
      setDuplicates([]);
      setShowDuplicateWarning(false);
      return;
    }

    setLoadingCampaigns(true);
    fetch('/api/lead-intelligence/campaigns')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch campaigns');
        return res.json();
      })
      .then((data: Campaign[]) => setCampaigns(data))
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoadingCampaigns(false));
  }, [open]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  async function handleAdd(confirmed = false) {
    if (!selectedCampaignId) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/lead-intelligence/bulk/add-to-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'dashboard-internal',
        },
        body: JSON.stringify({
          contactIds,
          campaignId: selectedCampaignId,
          confirmed,
        }),
      });

      const data = await res.json();

      if (data.action === 'confirm_needed') {
        setDuplicates(data.duplicates);
        setNewCount(data.newCount);
        setShowDuplicateWarning(true);
        setIsAdding(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add contacts');
      }

      const campaignName = selectedCampaign?.name || 'campaign';
      toast.success(`Added ${data.added} contact${data.added !== 1 ? 's' : ''} to ${campaignName}`);
      if (data.skipped > 0) {
        toast.info(`${data.skipped} contact${data.skipped !== 1 ? 's' : ''} skipped`);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add contacts to campaign');
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Add to Campaign
          </DialogTitle>
          <DialogDescription>
            {contactIds.length === 1
              ? 'Add this contact to a SmartLead campaign'
              : `Add ${contactIds.length} contacts to a SmartLead campaign`}
          </DialogDescription>
        </DialogHeader>

        {showDuplicateWarning ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  {duplicates.length} contact{duplicates.length !== 1 ? 's' : ''} already in this campaign
                </p>
                <ul className="mt-2 space-y-1 text-yellow-700 dark:text-yellow-300">
                  {duplicates.slice(0, 5).map((d) => (
                    <li key={d.email}>
                      {d.name ? `${d.name} (${d.email})` : d.email}
                    </li>
                  ))}
                  {duplicates.length > 5 && (
                    <li>...and {duplicates.length - 5} more</li>
                  )}
                </ul>
                {newCount > 0 && (
                  <p className="mt-2 font-medium">
                    {newCount} new contact{newCount !== 1 ? 's' : ''} will be added.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDuplicateWarning(false);
                  setDuplicates([]);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => handleAdd(true)} disabled={isAdding}>
                {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Anyway
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loadingCampaigns ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No active campaigns found
                </p>
              ) : (
                campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => setSelectedCampaignId(campaign.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedCampaignId === campaign.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="text-sm font-medium">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Created {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => handleAdd()}
                disabled={!selectedCampaignId || isAdding}
              >
                {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add to Campaign
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
