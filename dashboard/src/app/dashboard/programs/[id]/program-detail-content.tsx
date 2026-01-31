'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/dashboard-kit/components/ui/tabs';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { formatDateShort } from '@/dashboard-kit/lib/utils';
import { ProgramStatusBadge } from '../components/program-status-badge';
import type { ProgramDetail, RegistrationRosterItem } from '@/lib/api/programs-queries';

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

        <TabsContent value="registrations" className="mt-4">
          {mountedTabs.has('registrations') && (
            <div className="rounded-lg border bg-card p-6">
              <p className="text-muted-foreground">
                Registrations roster will be implemented in Plan 02-03.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {registrations.length} registrations loaded for program {program.id}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logistics" className="mt-4">
          {mountedTabs.has('logistics') && (
            <div className="rounded-lg border bg-card p-6">
              <p className="text-muted-foreground">
                Logistics checklist will be implemented in Phase 4.
              </p>
            </div>
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
    </div>
  );
}
