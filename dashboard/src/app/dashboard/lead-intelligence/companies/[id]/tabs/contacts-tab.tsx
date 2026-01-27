'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContactAvatar } from '../../../components/contact-avatar';
import { StatusBadge } from '../../../components/status-badge';
import { Button } from '@/dashboard-kit/components/ui/button';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  status: string;
  email: string | null;
  profile_image_url: string | null;
  updated_at: string;
}

export function ContactsTab({ companyId }: { companyId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const res = await fetch(`/api/lead-intelligence/companies/${companyId}/contacts?limit=50`, {
          headers: { 'x-api-key': 'internal' },
        });
        if (res.ok) {
          const json = await res.json();
          setContacts(json.data ?? []);
          setTotal(json.meta?.total ?? 0);
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, [companyId]);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading contacts...</div>;
  }

  if (contacts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No contacts at this company</p>
        <Button className="mt-4" disabled>
          Add Contact (Coming soon)
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} contact{total !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Bulk actions coming in Phase 4
          </Button>
          <Button size="sm" disabled>
            Add Contact (Coming soon)
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/lead-intelligence/contacts/${contact.id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <ContactAvatar contact={contact} size="sm" />
                    <span className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{contact.title ?? '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={contact.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{contact.email ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(contact.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
