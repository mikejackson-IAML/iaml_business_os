'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Calendar, Users, ArrowUpDown, ExternalLink } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserMenu } from '@/components/UserMenu';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { cn, formatDateShort } from '@/dashboard-kit/lib/utils';
import type { ProgramListItem } from '@/lib/api/programs-queries';
import { ProgramStatusBadge } from './components/program-status-badge';
import { LogisticsProgress } from './components/logistics-progress';
import { AlertCountBadge } from './components/alert-count-badge';
import { ProgramFilters } from './components/program-filters';
import { ArchiveToggle } from './components/archive-toggle';

interface ProgramsContentProps {
  programs: ProgramListItem[];
  cities: string[];
  currentFilters: {
    city: string | null;
    format: string | null;
    status: 'upcoming' | 'completed' | 'all';
    showArchived: boolean;
    dateFrom: string | null;
    dateTo: string | null;
  };
  currentSort: {
    column: string;
    order: 'asc' | 'desc';
  };
}

export function ProgramsContent({
  programs,
  cities,
  currentFilters,
  currentSort,
}: ProgramsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Calculate logistics readiness for each program
  const getLogisticsStats = (program: ProgramListItem) => {
    const isVirtual = program.format === 'virtual';
    const isOnDemand = program.format === 'on-demand';

    // On-demand programs don't track logistics
    if (isOnDemand) return { completed: 0, total: 0, warnings: 0, criticals: 0 };

    // Completed programs don't need warnings
    if (program.days_until_start !== null && program.days_until_start < 0) {
      return { completed: 0, total: 0, warnings: 0, criticals: 0 };
    }

    const total = isVirtual ? 6 : 10;
    const daysUntil = program.days_until_start ?? 999;

    // Count completed items
    let completed = 0;
    if (program.faculty_confirmed) completed++;
    if (program.venue_confirmed) completed++;
    if (program.materials_ordered) completed++;
    if (program.materials_received) completed++;
    // Use readiness_score as proxy for remaining items
    const scoreBasedCompleted = Math.round((program.readiness_score / 100) * total);
    completed = Math.max(completed, scoreBasedCompleted);

    // Calculate warnings based on thresholds
    let warnings = 0;
    let criticals = 0;

    // Instructor (warning <=45d, critical <=30d)
    if (!program.faculty_confirmed) {
      if (daysUntil <= 30) criticals++;
      else if (daysUntil <= 45) warnings++;
    }

    // Venue (in-person only, warning <=90d, critical <=60d)
    if (!isVirtual && !program.venue_confirmed) {
      if (daysUntil <= 60) criticals++;
      else if (daysUntil <= 90) warnings++;
    }

    // Materials ordered (warning <=45d, critical <=30d)
    if (!program.materials_ordered) {
      if (daysUntil <= 30) criticals++;
      else if (daysUntil <= 45) warnings++;
    }

    // Registration alerts (warning <=45d, critical <=30d if <6 registrations)
    if (program.current_enrolled < 6) {
      if (daysUntil <= 30) criticals++;
      else if (daysUntil <= 45) warnings++;
    }

    return { completed, total, warnings, criticals };
  };

  // Format location display
  const formatLocation = (program: ProgramListItem) => {
    if (program.format === 'virtual') return 'Virtual';
    if (program.format === 'on-demand') return 'On-Demand';
    return program.city || 'TBD';
  };

  // Format days until display
  const formatDaysUntil = (daysUntil: number | null) => {
    if (daysUntil === null) return null;
    if (daysUntil < 0) return <Badge variant="secondary">Completed</Badge>;
    if (daysUntil === 0) return <Badge variant="warning">Today</Badge>;
    if (daysUntil <= 7) return <span className="text-amber-600 dark:text-amber-400 font-medium">{daysUntil}d</span>;
    return <span className="text-muted-foreground">{daysUntil}d</span>;
  };

  // Check if program is a virtual certificate (has child blocks)
  const isVirtualCertificate = (program: ProgramListItem) => {
    return program.child_block_count > 0;
  };

  // Check if program is a virtual block (has parent)
  const isVirtualBlock = (program: ProgramListItem) => {
    return program.parent_program_id !== null;
  };

  // Handle row click - navigate to program detail
  const handleRowClick = (program: ProgramListItem) => {
    router.push(`/dashboard/programs/${program.id}`);
  };

  // Handle sort change
  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentColumn = params.get('sort') || 'start_date';
    const currentOrder = params.get('order') || 'asc';

    if (currentColumn === column) {
      // Toggle order
      params.set('order', currentOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', column);
      params.set('order', 'asc');
    }
    router.push(`/dashboard/programs?${params.toString()}`);
  };

  // Render sort indicator
  const SortIndicator = ({ column }: { column: string }) => {
    const isActive = currentSort.column === column;
    return (
      <ArrowUpDown className={cn(
        'h-3.5 w-3.5 ml-1',
        isActive ? 'text-foreground' : 'text-muted-foreground/50'
      )} />
    );
  };

  // Calculate totals
  const totalEnrolled = programs.reduce((sum, p) => sum + p.current_enrolled, 0);
  const upcomingCount = programs.filter(p => (p.days_until_start ?? 0) >= 0).length;

  return (
    <div className="relative min-h-screen w-full">
      <div className="relative z-10 p-6 lg:p-8 space-y-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-indigo-500" />
              <h1 className="text-display-sm text-foreground">Programs</h1>
            </div>
            <div className="flex items-center gap-4">
              <ArchiveToggle showArchived={currentFilters.showArchived} />
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
          </div>
          <p className="text-muted-foreground">
            {currentFilters.status === 'upcoming'
              ? 'Upcoming programs and their logistics readiness'
              : currentFilters.status === 'completed'
              ? 'Completed program archive'
              : 'All programs'}
          </p>
        </header>

        {/* Filters */}
        <ProgramFilters
          cities={cities}
          currentFilters={currentFilters}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />

        {/* Stats bar */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {programs.length} program{programs.length !== 1 ? 's' : ''}
            {currentFilters.status === 'all' && ` (${upcomingCount} upcoming)`}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {totalEnrolled} total registered
          </span>
        </div>

        {/* Programs Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th
                      className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('instance_name')}
                      style={{ width: '35%' }}
                    >
                      <span className="flex items-center">
                        Program
                        <SortIndicator column="instance_name" />
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '12%' }}>
                      Location
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('start_date')}
                      style={{ width: '15%' }}
                    >
                      <span className="flex items-center">
                        Dates
                        <SortIndicator column="start_date" />
                      </span>
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('current_enrolled')}
                      style={{ width: '12%' }}
                    >
                      <span className="flex items-center">
                        Status
                        <SortIndicator column="current_enrolled" />
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '20%' }}>
                      Logistics
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '6%' }}>
                      Days
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {programs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        No programs found for the selected filters.
                        {currentFilters.status === 'upcoming' && !currentFilters.showArchived && (
                          <span className="block mt-2 text-sm">
                            Try showing completed programs or adjusting your filters.
                          </span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    programs.map((program) => {
                      const logistics = getLogisticsStats(program);
                      const isCertificate = isVirtualCertificate(program);
                      const isBlock = isVirtualBlock(program);

                      return (
                        <tr
                          key={program.id}
                          className="border-b border-border/50 transition-colors cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(program)}
                        >
                          {/* Program name & info */}
                          <td className="px-4 py-4">
                            <div className="font-medium text-foreground">
                              {program.instance_name}
                            </div>

                            {/* Virtual block: show parent link */}
                            {isBlock && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <ExternalLink className="h-3 w-3" />
                                Part of: {program.parent_program_name || 'Certificate Program'}
                              </div>
                            )}

                            {/* Virtual certificate: show rollup count */}
                            {isCertificate && program.child_total_enrolled > 0 && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {program.child_block_count} blocks, {program.child_total_enrolled} total registrations
                              </div>
                            )}

                            {/* Format badges */}
                            <div className="flex gap-1 mt-1">
                              {program.format === 'virtual' && (
                                <Badge variant="info" className="text-xs">Virtual</Badge>
                              )}
                              {program.format === 'on-demand' && (
                                <Badge variant="secondary" className="text-xs">On-Demand</Badge>
                              )}
                              {isCertificate && (
                                <Badge variant="outline" className="text-xs">Certificate</Badge>
                              )}
                            </div>
                          </td>

                          {/* Location */}
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {formatLocation(program)}
                          </td>

                          {/* Dates */}
                          <td className="px-4 py-4 text-sm">
                            {program.start_date ? (
                              <div>
                                <span className="text-foreground">
                                  {formatDateShort(program.start_date)}
                                </span>
                                {program.end_date && program.end_date !== program.start_date && (
                                  <span className="text-muted-foreground">
                                    {' - '}{formatDateShort(program.end_date)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">TBD</span>
                            )}
                          </td>

                          {/* Status badge - for certificates, show combined count */}
                          <td className="px-4 py-4">
                            {program.format === 'on-demand' ? (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            ) : (program.days_until_start !== null && program.days_until_start < 0) ? (
                              <Badge variant="secondary">Completed</Badge>
                            ) : (
                              <ProgramStatusBadge
                                enrolledCount={isCertificate
                                  ? program.current_enrolled + program.child_total_enrolled
                                  : program.current_enrolled}
                                showCount={true}
                              />
                            )}
                          </td>

                          {/* Logistics */}
                          <td className="px-4 py-4">
                            {program.format === 'on-demand' ? (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            ) : (program.days_until_start !== null && program.days_until_start < 0) ? (
                              <span className="text-xs text-muted-foreground">Completed</span>
                            ) : (
                              <div className="flex items-center gap-3">
                                <LogisticsProgress
                                  completed={logistics.completed}
                                  total={logistics.total}
                                  warnings={logistics.warnings}
                                />
                                <AlertCountBadge
                                  warningCount={logistics.warnings}
                                  criticalCount={logistics.criticals}
                                />
                              </div>
                            )}
                          </td>

                          {/* Days until */}
                          <td className="px-4 py-4 text-sm">
                            {formatDaysUntil(program.days_until_start)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
