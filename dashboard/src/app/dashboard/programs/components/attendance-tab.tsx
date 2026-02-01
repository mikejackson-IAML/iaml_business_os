'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type {
  ProgramDetail,
  ProgramBlock,
  RegistrationWithAttendance,
} from '@/lib/api/programs-queries';
import { getBlocksForProgram } from '@/lib/api/programs-queries';
import { AttendanceRoster } from './attendance/attendance-roster';
import { EvaluationsSection } from './evaluations/evaluations-section';

interface AttendanceTabProps {
  program: ProgramDetail;
}

/**
 * Combined Attendance and Evaluations tab
 * Per AUTONOMOUS-BUILD-GUIDE: Tab order is Registrations -> Logistics -> Attendance/Evaluations
 * Per CONTEXT.md: Shows roster with attendance checkboxes + evaluations below
 */
export function AttendanceTab({ program }: AttendanceTabProps) {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<RegistrationWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Get blocks configuration for this program
  const blocks: ProgramBlock[] = getBlocksForProgram(program.program_name);

  // Check if this is a virtual certificate (has child blocks)
  const isVirtualCertificate = program.child_block_count > 0;

  // Check if virtual (no physical venue)
  const isVirtual = program.format === 'virtual';

  // Fetch registrations with attendance data
  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      // Use the existing registration_dashboard_summary view which should include attendance fields
      const res = await fetch(`/api/programs/${program.id}/registrations?includeAttendance=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setRegistrations(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  }, [program.id]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Handle refresh after bulk attendance update
  const handleRefresh = useCallback(() => {
    fetchRegistrations();
    router.refresh();
  }, [fetchRegistrations, router]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Attendance skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
        {/* Evaluations skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty program state
  if (registrations.length === 0 && blocks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No registrations or blocks configured for this program.</p>
        <p className="text-sm mt-2">
          Attendance tracking will be available once registrations are added.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Attendance Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Attendance Tracking</h2>
        {blocks.length > 0 ? (
          <AttendanceRoster
            programId={program.id}
            registrations={registrations}
            blocks={blocks}
            isVirtualCertificate={isVirtualCertificate}
            onRefresh={handleRefresh}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            <p>This program does not have block-based attendance tracking.</p>
            <p className="text-sm mt-1">
              Block configuration is available for certificate programs.
            </p>
          </div>
        )}

        {/* Virtual certificate cross-block note */}
        {isVirtualCertificate && (
          <p className="text-sm text-muted-foreground mt-4">
            This virtual certificate tracks attendance across {program.child_block_count} linked block events.
          </p>
        )}
      </section>

      {/* Separator - using simple hr since no Separator component in dashboard-kit */}
      <hr className="border-border" />

      {/* Evaluations Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Evaluations</h2>
        <EvaluationsSection
          programId={program.id}
          isVirtual={isVirtual}
        />
      </section>
    </div>
  );
}
