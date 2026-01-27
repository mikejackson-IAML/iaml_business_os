'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { Building2, ExternalLink, MapPin, Users, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { Breadcrumbs } from '../../components/breadcrumbs';
import type { Company } from '@/lib/api/lead-intelligence-companies-types';

const ContactsTab = lazy(() => import('./tabs/contacts-tab').then(m => ({ default: m.ContactsTab })));
const NotesTab = lazy(() => import('./tabs/notes-tab').then(m => ({ default: m.NotesTab })));
const EnrichmentTab = lazy(() => import('./tabs/enrichment-tab').then(m => ({ default: m.EnrichmentTab })));

interface CompanyProfileContentProps {
  company: Company;
}

interface MetricsSummary {
  totalContacts: number;
  customers: number;
  totalAttendance: number;
}

const TABS = ['Contacts', 'Notes', 'Enrichment Data'] as const;
type TabName = (typeof TABS)[number];

export function CompanyProfileContent({ company }: CompanyProfileContentProps) {
  const [activeTab, setActiveTab] = useState<TabName>('Contacts');
  const [metrics, setMetrics] = useState<MetricsSummary>({ totalContacts: 0, customers: 0, totalAttendance: 0 });

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(`/api/lead-intelligence/companies/${company.id}/contacts?limit=100`, {
          headers: { 'x-api-key': 'internal' },
        });
        if (res.ok) {
          const json = await res.json();
          const contacts = json.data ?? [];
          const total = json.meta?.total ?? contacts.length;
          const customerCount = contacts.filter((c: { status?: string }) => c.status === 'customer').length;
          setMetrics({ totalContacts: total, customers: customerCount, totalAttendance: 0 });
        }
      } catch {
        // Metrics are non-critical; fail silently
      }
    }
    fetchMetrics();
  }, [company.id]);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Lead Intelligence', href: '/dashboard/lead-intelligence' },
          { label: 'Companies', href: '/dashboard/lead-intelligence' },
          { label: company.name },
        ]}
      />

      {/* Company Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {company.industry && <span>{company.industry}</span>}
            {company.website && (
              <a
                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                {company.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {(company.city || company.state) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[company.city, company.state].filter(Boolean).join(', ')}
              </span>
            )}
            {company.employee_count && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {company.employee_count.toLocaleString()} employees
              </span>
            )}
            {company.revenue_range && <span>{company.revenue_range}</span>}
          </div>
        </div>
      </div>

      {/* Key Metrics Bar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Contacts in DB" value={metrics.totalContacts} />
        <MetricCard label="Customers" value={metrics.customers} />
        <MetricCard label="Total Attendance" value={metrics.totalAttendance} />
        <MetricCard label="Active Opportunities" value="0" description="Coming Phase 5" />
      </div>

      {/* Tab Bar */}
      <div className="border-b">
        <nav className="flex gap-4" aria-label="Company profile tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading...</div>}>
        {activeTab === 'Contacts' && <ContactsTab companyId={company.id} />}
        {activeTab === 'Notes' && <NotesTab companyId={company.id} />}
        {activeTab === 'Enrichment Data' && <EnrichmentTab companyId={company.id} company={company} />}
      </Suspense>
    </div>
  );
}

function MetricCard({ label, value, description }: { label: string; value: number | string; description?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
