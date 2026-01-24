'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/dashboard-kit/lib/utils';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SummaryCards } from './components/summary-cards';
import { RecruitmentPipelineTable } from './components/recruitment-pipeline-table';
import { NotRespondedList } from './components/not-responded-list';
import { InstructorList } from './components/instructor-list';
import { AlertSection } from './components/alert-section';
import { AssignInstructorModal } from './components/assign-instructor-modal';
import { OverrideClaimModal } from './components/override-claim-modal';
import type { FacultySchedulerDashboardData } from '@/lib/api/faculty-scheduler-queries';

interface AlertBadgeProps {
  count: number;
  hasCritical: boolean;
  onClick: () => void;
}

function AlertBadge({ count, hasCritical, onClick }: AlertBadgeProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold min-w-[1.5rem]',
        hasCritical
          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      )}
    >
      {count}
    </button>
  );
}

interface ContentProps {
  data: FacultySchedulerDashboardData;
}

export function FacultySchedulerContent({ data }: ContentProps) {
  const { programs, notResponded, summaryStats, alerts } = data;

  // Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignModalProgramId, setAssignModalProgramId] = useState<string | null>(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideModalClaimId, setOverrideModalClaimId] = useState<string | null>(null);

  // Handlers for opening modals
  const handleOpenAssignModal = (programId: string) => {
    setAssignModalProgramId(programId);
    setAssignModalOpen(true);
  };

  const handleOpenOverrideModal = (claimId: string) => {
    setOverrideModalClaimId(claimId);
    setOverrideModalOpen(true);
  };

  // Scroll to alerts section
  const scrollToAlerts = () => {
    document.getElementById('alerts-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if any alerts are critical
  const hasCriticalAlert = alerts.some((a) => a.severity === 'critical');

  return (
    <div className="relative min-h-screen">
      {/* Background pattern */}
      <FallingPattern
        color="hsl(var(--accent-primary))"
        backgroundColor="hsl(var(--background))"
        duration={150}
        blurIntensity="1em"
        density={0.5}
        className="fixed inset-0 -z-10 opacity-50"
      />

      <div className="relative z-10 p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 rounded-lg hover:bg-background-card-light transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Link>
              <span className="badge-live">LIVE</span>
              <h1 className="text-display-sm text-foreground">Faculty Scheduler</h1>
              <AlertBadge
                count={alerts.length}
                hasCritical={hasCriticalAlert}
                onClick={scrollToAlerts}
              />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
          <p className="text-muted-foreground ml-12">
            Instructor recruitment pipeline &bull; Tier management &bull; Assignment tracking
          </p>
        </header>

        {/* Summary Cards (B1 requirement) */}
        <SummaryCards stats={summaryStats} />

        {/* Alert Section */}
        {alerts.length > 0 && (
          <div className="mb-6">
            <AlertSection alerts={alerts} />
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6 mt-6">
          {/* Recruitment Pipeline Table - 8 cols */}
          <div className="col-span-12 lg:col-span-8">
            <RecruitmentPipelineTable
              programs={programs}
              onAssign={handleOpenAssignModal}
              onOverride={handleOpenOverrideModal}
            />
          </div>

          {/* Sidebar - 4 cols */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <NotRespondedList instructors={notResponded} />
            <InstructorList instructors={notResponded} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {assignModalOpen && assignModalProgramId && (
        <AssignInstructorModal
          programId={assignModalProgramId}
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setAssignModalProgramId(null);
          }}
        />
      )}

      {overrideModalOpen && overrideModalClaimId && (
        <OverrideClaimModal
          claimId={overrideModalClaimId}
          isOpen={overrideModalOpen}
          onClose={() => {
            setOverrideModalOpen(false);
            setOverrideModalClaimId(null);
          }}
        />
      )}
    </div>
  );
}
