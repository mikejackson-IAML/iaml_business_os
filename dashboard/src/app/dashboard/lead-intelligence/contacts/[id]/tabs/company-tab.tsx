'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, ExternalLink, Users, MapPin, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';
import { ContactAvatar } from '../../../components/contact-avatar';
import type { Contact } from '@/lib/api/lead-intelligence-contacts-types';

interface CompanyTabProps {
  contactId: string;
  contact: Contact;
}

interface Company {
  id: string;
  name: string;
  industry: string | null;
  employee_count: number | null;
  website: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export function CompanyTab({ contactId, contact }: CompanyTabProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [colleagues, setColleagues] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contact.company_id) {
      setLoading(false);
      return;
    }

    async function fetchCompanyData() {
      try {
        const [companyRes, contactsRes] = await Promise.all([
          fetch(`/api/lead-intelligence/companies/${contact.company_id}`),
          fetch(`/api/lead-intelligence/companies/${contact.company_id}/contacts?limit=50`),
        ]);

        if (companyRes.ok) {
          setCompany(await companyRes.json());
        }

        if (contactsRes.ok) {
          const result = await contactsRes.json();
          const others = (result.data ?? []).filter(
            (c: Contact) => c.id !== contactId
          );
          setColleagues(others);
        }
      } catch (err) {
        console.error('Failed to load company data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanyData();
  }, [contact.company_id, contactId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!contact.company_id) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No company associated</p>
          <button
            disabled
            className="mt-3 text-sm text-muted-foreground/60 cursor-not-allowed"
          >
            Link Company (coming soon)
          </button>
        </CardContent>
      </Card>
    );
  }

  const location = [company?.city, company?.state, company?.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {/* Company Card */}
      {company && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              <Link
                href={`/dashboard/lead-intelligence/companies/${company.id}`}
                className="hover:underline"
              >
                {company.name}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {company.industry && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{company.industry}</span>
                </div>
              )}
              {company.employee_count != null && (
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{company.employee_count.toLocaleString()} employees</span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{location}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400 truncate"
                  >
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Colleagues */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Other Contacts at {company?.name ?? 'Company'}{' '}
            <Badge variant="outline" className="ml-2 text-xs">
              {colleagues.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {colleagues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No other contacts at this company.
            </p>
          ) : (
            <ul className="space-y-3">
              {colleagues.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <ContactAvatar contact={c} size="sm" />
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/lead-intelligence/contacts/${c.id}`}
                      className="text-sm font-medium hover:underline truncate block"
                    >
                      {c.first_name} {c.last_name}
                    </Link>
                    {c.title && (
                      <p className="text-xs text-muted-foreground truncate">
                        {c.title}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Opportunities placeholder */}
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Opportunities coming in Phase 5
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
