'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2, UserCheck } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/dashboard-kit/components/ui/badge';

interface ColleagueResult {
  name: string;
  title: string | null;
  linkedin_url: string | null;
  email: string | null;
  existsInCrm: boolean;
  contactId?: string;
}

interface FindColleaguesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  onContactsAdded: () => void;
}

export function FindColleaguesModal({
  open,
  onOpenChange,
  companyId,
  companyName,
  onContactsAdded,
}: FindColleaguesModalProps) {
  const [results, setResults] = useState<ColleagueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setResults([]);
      setSelected(new Set());
      setError(null);
      return;
    }

    async function fetchColleagues() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/lead-intelligence/companies/${companyId}/find-colleagues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to find colleagues');
        }

        const data = await res.json();
        setResults(data.results ?? []);

        // Pre-select non-CRM contacts
        const initialSelected = new Set<number>();
        (data.results ?? []).forEach((r: ColleagueResult, i: number) => {
          if (!r.existsInCrm) initialSelected.add(i);
        });
        setSelected(initialSelected);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchColleagues();
  }, [open, companyId]);

  const toggleSelected = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleAddSelected = async () => {
    const toAdd = Array.from(selected).map((i) => results[i]);
    if (toAdd.length === 0) return;

    setAdding(true);
    try {
      let addedCount = 0;

      for (const person of toAdd) {
        // Split name into first/last
        const nameParts = person.name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        if (person.existsInCrm && person.contactId) {
          // Update existing: fill blanks only
          const updates: Record<string, string> = {};
          if (person.title) updates.title = person.title;
          if (person.linkedin_url) updates.linkedin_url = person.linkedin_url;
          if (person.email) updates.email = person.email;

          if (Object.keys(updates).length > 0) {
            await fetch(`/api/lead-intelligence/contacts/${person.contactId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
          }
          addedCount++;
        } else {
          // Create new contact
          const body: Record<string, string> = {
            first_name: firstName,
            last_name: lastName,
            company_id: companyId,
            status: 'new',
          };
          if (person.email) body.email = person.email;
          if (person.title) body.title = person.title;
          if (person.linkedin_url) body.linkedin_url = person.linkedin_url;

          const res = await fetch('/api/lead-intelligence/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (res.ok) addedCount++;
        }
      }

      toast.success(`Added ${addedCount} colleague${addedCount !== 1 ? 's' : ''}`);
      onContactsAdded();
      onOpenChange(false);
    } catch (err) {
      console.error('Error adding colleagues:', err);
      toast.error('Failed to add some colleagues');
    } finally {
      setAdding(false);
    }
  };

  const selectedCount = selected.size;
  const newCount = Array.from(selected).filter((i) => !results[i]?.existsInCrm).length;
  const updateCount = selectedCount - newCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Find Colleagues at {companyName}
          </DialogTitle>
          <DialogDescription>
            Discovering people at this company via LinkedIn and web search.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 py-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Searching for colleagues...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No colleagues found.</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="space-y-1">
              {results.map((person, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 p-2.5 rounded-md hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(i)}
                    onCheckedChange={() => toggleSelected(i)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{person.name}</span>
                      {person.existsInCrm && (
                        <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                          <UserCheck className="h-3 w-3" />
                          In CRM
                        </Badge>
                      )}
                    </div>
                    {person.title && (
                      <p className="text-xs text-muted-foreground truncate">{person.title}</p>
                    )}
                    {person.email && (
                      <p className="text-xs text-muted-foreground truncate">{person.email}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {!loading && results.length > 0 && (
          <DialogFooter className="gap-2 sm:gap-0">
            <div className="text-xs text-muted-foreground mr-auto">
              {selectedCount} selected
              {updateCount > 0 && ` (${updateCount} update${updateCount !== 1 ? 's' : ''})`}
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSelected} disabled={selectedCount === 0 || adding}>
              {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Selected ({selectedCount})
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
