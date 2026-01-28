'use client';

import { useState, useEffect, useRef } from 'react';
import { UserPlus, X, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Input } from '@/dashboard-kit/components/ui/input';
import { toast } from 'sonner';
import type { OpportunityContact } from '@/lib/api/lead-intelligence-opportunities-types';
import { CONTACT_ROLES, CONTACT_ROLE_LABELS } from '@/lib/api/lead-intelligence-opportunities-types';

interface OpportunityContactsSectionProps {
  opportunityId: string;
  contacts: OpportunityContact[];
  onUpdate: () => void;
}

interface ContactSearchResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  title: string | null;
}

export function OpportunityContactsSection({ opportunityId, contacts, onUpdate }: OpportunityContactsSectionProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContactSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(CONTACT_ROLES[0]);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = '/api/lead-intelligence/contacts?search=' + encodeURIComponent(searchQuery) + '&limit=10';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data ?? [];
          setSearchResults(list);
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  async function handleAdd() {
    if (!selectedContact || adding) return;
    setAdding(true);
    try {
      const res = await fetch('/api/lead-intelligence/opportunities/' + opportunityId + '/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: selectedContact.id, role: selectedRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add contact');
      }
      toast.success('Contact added');
      setShowAdd(false);
      setSelectedContact(null);
      setSearchQuery('');
      setSearchResults([]);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add contact');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(contactId: string) {
    setRemoving(contactId);
    try {
      const res = await fetch('/api/lead-intelligence/opportunities/' + opportunityId + '/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId }),
      });
      if (!res.ok) throw new Error('Failed to remove contact');
      toast.success('Contact removed');
      onUpdate();
    } catch {
      toast.error('Failed to remove contact');
    } finally {
      setRemoving(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Contacts ({contacts.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
            <UserPlus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAdd && (
          <div className="border rounded-md p-3 space-y-3 bg-muted/30">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedContact(null); }}
                placeholder="Search contacts..."
                className="pl-8 h-9 text-sm"
              />
            </div>
            {searching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Searching...
              </div>
            )}
            {searchResults.length > 0 && !selectedContact && (
              <div className="border rounded-md max-h-40 overflow-y-auto divide-y">
                {searchResults.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => { setSelectedContact(c); setSearchResults([]); }}
                  >
                    <div className="font-medium">{[c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown'}</div>
                    {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                  </button>
                ))}
              </div>
            )}
            {selectedContact && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{[selectedContact.first_name, selectedContact.last_name].filter(Boolean).join(' ')}</Badge>
                <button onClick={() => setSelectedContact(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                {CONTACT_ROLES.map((role) => (
                  <option key={role} value={role}>{CONTACT_ROLE_LABELS[role]}</option>
                ))}
              </select>
              <Button size="sm" onClick={handleAdd} disabled={!selectedContact || adding}>
                {adding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Add Contact
              </Button>
            </div>
          </div>
        )}

        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No contacts attached yet.</p>
        ) : (
          <div className="divide-y">
            {contacts.map((oc) => {
              const c = oc.contact;
              const name = c ? [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown' : 'Unknown';
              return (
                <div key={oc.contact_id} className="flex items-center justify-between py-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <a
                      href={'/dashboard/lead-intelligence/contacts/' + oc.contact_id}
                      className="text-sm font-medium hover:underline"
                    >
                      {name}
                    </a>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {c?.email && <span>{c.email}</span>}
                      {c?.title && <span>{c.title}</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {CONTACT_ROLE_LABELS[oc.role] ?? oc.role}
                  </Badge>
                  <button
                    onClick={() => handleRemove(oc.contact_id)}
                    disabled={removing === oc.contact_id}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    {removing === oc.contact_id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
