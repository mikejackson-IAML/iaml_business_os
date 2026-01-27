'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Input } from '@/dashboard-kit/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CreateOpportunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'in_house' | 'individual';
  defaultCompanyId?: string;
  defaultCompanyName?: string;
  onCreated: () => void;
}

interface SearchResult {
  id: string;
  name: string;
}

export function CreateOpportunityModal({
  open,
  onOpenChange,
  defaultType = 'in_house',
  defaultCompanyId,
  defaultCompanyName,
  onCreated,
}: CreateOpportunityModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'in_house' | 'individual'>(defaultType);
  const [value, setValue] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [companyResults, setCompanyResults] = useState<SearchResult[]>([]);
  const [contactResults, setContactResults] = useState<SearchResult[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Reset on open
  useEffect(() => {
    if (open) {
      setTitle('');
      setType(defaultType);
      setValue('');
      setCompanySearch(defaultCompanyName || '');
      setContactSearch('');
      setCompanyResults([]);
      setContactResults([]);
      setSelectedCompanyId(defaultCompanyId || null);
      setSelectedContactId(null);
    }
  }, [open, defaultType, defaultCompanyId, defaultCompanyName]);

  // Company search
  useEffect(() => {
    if (type !== 'in_house' || companySearch.length < 2) {
      setCompanyResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/lead-intelligence/companies?search=${encodeURIComponent(companySearch)}&limit=5`);
        if (res.ok) {
          const json = await res.json();
          setCompanyResults(
            (json.data || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))
          );
        }
      } catch { /* ignore */ }
    }, 300);
  }, [companySearch, type]);

  // Contact search
  useEffect(() => {
    if (type !== 'individual' || contactSearch.length < 2) {
      setContactResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/lead-intelligence/contacts?search=${encodeURIComponent(contactSearch)}&limit=5`);
        if (res.ok) {
          const json = await res.json();
          setContactResults(
            (json.data || []).map((c: { id: string; first_name: string; last_name: string }) => ({
              id: c.id,
              name: `${c.first_name} ${c.last_name}`,
            }))
          );
        }
      } catch { /* ignore */ }
    }, 300);
  }, [contactSearch, type]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        type,
        stage: 'inquiry',
      };
      if (value) body.value = parseFloat(value);
      if (selectedCompanyId) body.company_id = selectedCompanyId;
      if (selectedContactId) body.contact_id = selectedContactId;

      const res = await fetch('/api/lead-intelligence/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create opportunity');
      toast.success('Opportunity created');
      onOpenChange(false);
      onCreated();
    } catch {
      toast.error('Failed to create opportunity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Opportunity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="opp-title">Title *</Label>
            <Input
              id="opp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Spring 2026 CLE Series"
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'in_house' | 'individual')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_house">In-House</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'in_house' && (
            <div className="relative">
              <Label>Company</Label>
              <Input
                value={selectedCompanyId ? companySearch : companySearch}
                onChange={(e) => {
                  setCompanySearch(e.target.value);
                  setSelectedCompanyId(null);
                }}
                placeholder="Search companies..."
              />
              {companyResults.length > 0 && !selectedCompanyId && (
                <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                  {companyResults.map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => {
                        setSelectedCompanyId(c.id);
                        setCompanySearch(c.name);
                        setCompanyResults([]);
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {type === 'individual' && (
            <div className="relative">
              <Label>Contact</Label>
              <Input
                value={contactSearch}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  setSelectedContactId(null);
                }}
                placeholder="Search contacts..."
              />
              {contactResults.length > 0 && !selectedContactId && (
                <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                  {contactResults.map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => {
                        setSelectedContactId(c.id);
                        setContactSearch(c.name);
                        setContactResults([]);
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="opp-value">Value ($)</Label>
            <Input
              id="opp-value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
