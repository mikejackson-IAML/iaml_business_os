'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Linkedin, Pencil, StickyNote, Clock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/dashboard-kit/components/ui/tabs';
import { Button } from '@/dashboard-kit/components/ui/button';
import { ContactAvatar } from '../../components/contact-avatar';
import { Breadcrumbs } from '../../components/breadcrumbs';
import { StatusBadge } from '../../components/status-badge';
import { OverviewTab } from './tabs/overview-tab';
import { AttendanceTab } from './tabs/attendance-tab';
import { EmailCampaignsTab } from './tabs/email-campaigns-tab';
import { CompanyTab } from './tabs/company-tab';
import { NotesTab } from './tabs/notes-tab';
import { EnrichmentTab } from './tabs/enrichment-tab';
import type { Contact } from '@/lib/api/lead-intelligence-contacts-types';

interface ContactProfileContentProps {
  contact: Contact;
}

const TAB_IDS = ['overview', 'attendance', 'email-campaigns', 'company', 'notes', 'enrichment'] as const;
type TabId = typeof TAB_IDS[number];

export function ContactProfileContent({ contact }: ContactProfileContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(new Set(['overview']));

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown';
  const location = [contact.city, contact.state].filter(Boolean).join(', ');

  function handleTabChange(value: string) {
    const tab = value as TabId;
    setActiveTab(tab);
    setMountedTabs((prev) => new Set(prev).add(tab));
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Lead Intelligence', href: '/dashboard/lead-intelligence' },
          { label: 'Contacts', href: '/dashboard/lead-intelligence/contacts' },
          { label: fullName },
        ]}
      />

      {/* Profile Header */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <ContactAvatar contact={contact} size="lg" />

          <div className="flex-1 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <h1 className="text-2xl font-bold">{fullName}</h1>
              <StatusBadge status={contact.status ?? 'unknown'} isVip={contact.is_vip ?? false} />
            </div>

            {(contact.title || contact.company) && (
              <p className="text-muted-foreground">
                {contact.title}
                {contact.title && contact.company && ' at '}
                {contact.company && (
                  <Link
                    href={`/dashboard/lead-intelligence/companies/${contact.company.id}`}
                    className="text-primary hover:underline"
                  >
                    {contact.company.name}
                  </Link>
                )}
              </p>
            )}

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {contact.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${contact.email}`} className="hover:text-foreground">
                    {contact.email}
                  </a>
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  {contact.phone}
                </span>
              )}
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-foreground"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
              {location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {location}
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" disabled>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTabChange('notes')}
              >
                <StickyNote className="mr-1.5 h-3.5 w-3.5" />
                Add Note
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Set Follow-up
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="email-campaigns">Email &amp; Campaigns</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="enrichment">Enrichment Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {mountedTabs.has('overview') && (
            <OverviewTab contactId={contact.id} contact={contact} />
          )}
        </TabsContent>

        <TabsContent value="attendance">
          {mountedTabs.has('attendance') && (
            <AttendanceTab contactId={contact.id} />
          )}
        </TabsContent>

        <TabsContent value="email-campaigns">
          {mountedTabs.has('email-campaigns') && (
            <EmailCampaignsTab contactId={contact.id} />
          )}
        </TabsContent>

        <TabsContent value="company">
          {mountedTabs.has('company') && (
            <CompanyTab contactId={contact.id} contact={contact} />
          )}
        </TabsContent>

        <TabsContent value="notes">
          {mountedTabs.has('notes') && (
            <NotesTab contactId={contact.id} />
          )}
        </TabsContent>

        <TabsContent value="enrichment">
          {mountedTabs.has('enrichment') && (
            <EnrichmentTab contactId={contact.id} contact={contact} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
