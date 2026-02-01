'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/dashboard-kit/components/ui/tabs';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { formatDateShort } from '@/dashboard-kit/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ProgramStatusBadge } from '../components/program-status-badge';
import { RegistrationsRoster } from '../components/registrations-roster';
import { RosterFilters } from '../components/roster-filters';
import { CertificateProgress } from '../components/certificate-progress';
import { ContactPanel } from '../components/contact-panel/contact-panel';
import { LogisticsTab } from '../components/logistics/logistics-tab';
import type { ProgramDetail, RegistrationRosterItem } from '@/lib/api/programs-queries';
import { getBlocksForProgram } from '@/lib/api/programs-queries';

interface ProgramDetailContentProps {
  program: ProgramDetail;
  registrations: RegistrationRosterItem[];
  currentFilters: Record<string, string | undefined>;
}

const TAB_IDS = ['registrations', 'logistics', 'attendance'] as const;
type TabId = typeof TAB_IDS[number];

export function ProgramDetailContent({
  program,
  registrations,
  currentFilters,
}: ProgramDetailContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>('registrations'); // Default to first tab per PROG-10
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(new Set(['registrations']));
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationRosterItem | null>(null);

  // Get blocks for this program
  const blocks = getBlocksForProgram(program.program_name);

  // Get unique companies and sources for filters
  const companies = Array.from(new Set(
    registrations.map(r => r.company_name).filter(Boolean)
  )) as string[];

  const sources = Array.from(new Set(
    registrations.map(r => r.registration_source).filter(Boolean)
  )) as string[];

  // Check if this is a virtual block (has parent)
  const isVirtualBlock = program.parent_program_id !== null;

  // Compute completed blocks for certificate progress (if virtual block)
  // For now, show all blocks from parent as incomplete - will be enhanced later
  const completedBlockIds: string[] = [];

  function handleRowClick(registration: RegistrationRosterItem) {
    setSelectedRegistration(registration);
  }

  async function triggerEnrichment(email: string) {
    toast.loading('Enriching contact...', { id: 'enrich' });

    try {
      const response = await fetch('/api/apollo/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success && data.matched) {
        toast.success('Contact enriched!', {
          id: 'enrich',
          description: `${data.person?.name || email} - ${data.person?.title || 'Unknown title'}`,
        });
      } else if (data.skipped) {
        toast.info('Already enriched', {
          id: 'enrich',
          description: 'Contact was enriched recently',
        });
      } else {
        toast.error('Enrichment failed', {
          id: 'enrich',
          description: data.error || 'No match found',
        });
      }
    } catch (error) {
      toast.error('Enrichment error', { id: 'enrich' });
    }
  }

  function handleTabChange(value: string) {
    const tab = value as TabId;
    setActiveTab(tab);
    setMountedTabs((prev) => new Set(prev).add(tab));
  }

  // Format location
  const location = program.format === 'virtual'
    ? 'Virtual'
    : program.format === 'on-demand'
    ? 'On-Demand'
    : program.city || 'TBD';

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/programs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Programs
      </Link>

      {/* Program Header */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{program.instance_name}</h1>
              <ProgramStatusBadge enrolledCount={program.current_enrolled} showCount />
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {location}
              </span>
              {program.start_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDateShort(program.start_date)}
                  {program.end_date && program.end_date !== program.start_date && (
                    <> - {formatDateShort(program.end_date)}</>
                  )}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {registrations.length} registrations
              </span>
            </div>

            {/* Format badges */}
            <div className="flex gap-2">
              {program.format === 'virtual' && (
                <Badge variant="info">Virtual</Badge>
              )}
              {program.format === 'on-demand' && (
                <Badge variant="secondary">On-Demand</Badge>
              )}
              {program.child_block_count > 0 && (
                <Badge variant="outline">Certificate ({program.child_block_count} blocks)</Badge>
              )}
              {program.parent_program_id && (
                <Badge variant="outline">Virtual Block</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Registrations is default per AUTONOMOUS-BUILD-GUIDE */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="registrations">
            Registrations ({registrations.length})
          </TabsTrigger>
          <TabsTrigger value="logistics">Logistics</TabsTrigger>
          <TabsTrigger value="attendance">Attendance/Evaluations</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="mt-4 space-y-4">
          {mountedTabs.has('registrations') && (
            <>
              {/* Certificate Progress for virtual blocks (PROG-19) */}
              {isVirtualBlock && (
                <CertificateProgress
                  certificateName={program.parent_program_name || 'Certificate Program'}
                  blocks={blocks}
                  completedBlockIds={completedBlockIds}
                />
              )}

              {/* Filters (PROG-16) */}
              <RosterFilters
                programId={program.id}
                blocks={blocks}
                companies={companies}
                sources={sources}
                currentFilters={currentFilters}
              />

              {/* Roster Table */}
              <div className="rounded-lg border bg-card">
                <RegistrationsRoster
                  registrations={registrations}
                  blocks={blocks}
                  onRowClick={handleRowClick}
                  isVirtualCertificate={program.child_block_count > 0}
                />
              </div>

              {/* Registration count */}
              <p className="text-sm text-muted-foreground text-center">
                Showing {registrations.length} registration{registrations.length !== 1 ? 's' : ''}
              </p>
            </>
          )}
        </TabsContent>

        <TabsContent value="logistics" className="mt-4">
          {mountedTabs.has('logistics') && (
            <LogisticsTab program={program} />
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          {mountedTabs.has('attendance') && (
            <div className="rounded-lg border bg-card p-6">
              <p className="text-muted-foreground">
                Attendance and evaluations will be implemented in Phase 5.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Contact Panel Slide-out (PROG-17) */}
      <Sheet
        open={selectedRegistration !== null}
        onOpenChange={(open) => !open && setSelectedRegistration(null)}
      >
        <SheetContent side="right" className="w-full sm:w-[600px] overflow-y-auto">
          {selectedRegistration && (
            <ContactPanel
              registration={selectedRegistration}
              onClose={() => setSelectedRegistration(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
