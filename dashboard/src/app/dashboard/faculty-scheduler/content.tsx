'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { UserMenu } from '@/components/UserMenu';
import { SummaryCards } from './components/summary-cards';
import { RecruitmentPipelineTable } from './components/recruitment-pipeline-table';
import { NotRespondedList } from './components/not-responded-list';
import { AssignInstructorModal } from './components/assign-instructor-modal';
import { OverrideClaimModal } from './components/override-claim-modal';
import type { FacultySchedulerDashboardData } from '@/lib/api/faculty-scheduler-queries';

interface ContentProps {
  data: FacultySchedulerDashboardData;
}

export function FacultySchedulerContent({ data }: ContentProps) {
  const { programs, notResponded, summaryStats } = data;

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
            </div>
            <UserMenu />
          </div>
          <p className="text-muted-foreground ml-12">
            Instructor recruitment pipeline &bull; Tier management &bull; Assignment tracking
          </p>
        </header>

        {/* Summary Cards (B1 requirement) */}
        <SummaryCards stats={summaryStats} />

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

          {/* Not Responded List - 4 cols (B7 requirement) */}
          <div className="col-span-12 lg:col-span-4">
            <NotRespondedList instructors={notResponded} />
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
