'use client';

import {
  Calendar,
  Users,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  UserCheck,
  Package,
  Award,
  Tv,
  UtensilsCrossed,
  Hotel,
  Globe,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { HealthScore } from '@/dashboard-kit/components/dashboard/health-score';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { AlertList } from '@/dashboard-kit/components/dashboard/alert-list';
import { ActivityFeed } from '@/dashboard-kit/components/dashboard/activity-feed';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Progress } from '@/dashboard-kit/components/ui/progress';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { UserMenu } from '@/components/UserMenu';
import type { HealthStatus, AlertItem, ActivityItem } from '@/dashboard-kit/types';
import type {
  ProgramsDashboardData,
  ProgramSummary,
  AtRiskProgram,
  RoomBlockAlert,
  FacultyGap,
  ProgramActivity,
  ProgramsAlert,
  ReadinessBreakdown,
  RegistrationSummary,
} from '@/lib/api/programs-queries';
import { RegistrationsTable } from './components/registrations-table';

interface ProgramsContentProps {
  data: ProgramsDashboardData;
  recentRegistrations: RegistrationSummary[];
}

// Map alerts to AlertItem format
function mapAlertsToAlertItems(alerts: ProgramsAlert[]): AlertItem[] {
  return alerts.map((alert) => ({
    id: alert.id,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    category: alert.category,
    timestamp: alert.timestamp,
    dismissable: false,
  }));
}

// Map activity to ActivityItem format
function mapActivityToFeed(activities: ProgramActivity[]): ActivityItem[] {
  const typeLabels: Record<string, string> = {
    registration: 'New registration',
    cancellation: 'Cancellation',
    faculty_confirmed: 'Faculty confirmed',
    faculty_brief_sent: 'Faculty brief sent',
    materials_ordered: 'Materials ordered',
    materials_shipped: 'Materials shipped',
    materials_received: 'Materials received',
    shrm_approved: 'SHRM approved',
    venue_confirmed: 'Venue confirmed',
    room_block_created: 'Room block created',
    registration_page_live: 'Registration live',
    status_changed: 'Status changed',
  };

  return activities.map((activity) => ({
    id: activity.id,
    type: activity.activity_type,
    title: typeLabels[activity.activity_type] || activity.activity_type.replace(/_/g, ' '),
    description: activity.description || undefined,
    timestamp: new Date(activity.activity_at),
  }));
}

// Format date for display
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format date range
function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '-';
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (!endDate || startDate.toDateString() === endDate.toDateString()) {
    return startStr;
  }

  const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
}

// Readiness item config
const readinessItems = [
  { key: 'faculty_confirmed_count', label: 'Faculty Confirmed', icon: UserCheck },
  { key: 'faculty_brief_count', label: 'Faculty Brief Sent', icon: Users },
  { key: 'venue_confirmed_count', label: 'Venue Confirmed', icon: Building2 },
  { key: 'materials_ordered_count', label: 'Materials Ordered', icon: Package },
  { key: 'materials_received_count', label: 'Materials Received', icon: Package },
  { key: 'shrm_approved_count', label: 'SHRM Approved', icon: Award },
  { key: 'av_ordered_count', label: 'AV Ordered', icon: Tv },
  { key: 'catering_confirmed_count', label: 'Catering Confirmed', icon: UtensilsCrossed },
  { key: 'room_block_count', label: 'Room Block Active', icon: Hotel },
  { key: 'registration_live_count', label: 'Registration Live', icon: Globe },
] as const;

export function ProgramsContent({ data, recentRegistrations }: ProgramsContentProps) {
  const {
    programs,
    metrics,
    readiness,
    atRiskPrograms,
    roomBlockAlerts,
    facultyGaps,
    recentActivity,
    alerts,
    healthScore,
  } = data;

  const alertItems = mapAlertsToAlertItems(alerts);
  const activityItems = mapActivityToFeed(recentActivity);

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
              <h1 className="text-display-sm text-foreground">Programs & Operations</h1>
            </div>
            <UserMenu />
          </div>
          <p className="text-muted-foreground ml-12">
            Program readiness • Enrollment tracking • Faculty & logistics • Next 90 days
          </p>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Row 1: Health Score (4 cols) + Key Metrics (8 cols) */}
          <div className="col-span-12 lg:col-span-4">
            <HealthScore
              score={healthScore.score}
              status={healthScore.status}
              label="Programs Health"
              description="Based on readiness, enrollment, and operational status"
              breakdown={healthScore.breakdown.map((item) => ({
                label: item.label,
                score: item.score,
                status: item.status,
              }))}
              showBreakdown
            />
          </div>

          <div className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Total Programs"
                value={metrics.totalPrograms}
                icon={Calendar}
                description="Next 90 days"
                format="number"
              />
              <MetricCard
                label="Total Enrolled"
                value={metrics.totalEnrolled}
                icon={Users}
                description={`${metrics.enrollmentPercent}% of capacity`}
                format="number"
              />
              <MetricCard
                label="Faculty Confirmed"
                value={`${metrics.facultyConfirmedPercent}%`}
                icon={UserCheck}
                status={metrics.facultyConfirmedPercent >= 90 ? 'healthy' : metrics.facultyConfirmedPercent >= 70 ? 'warning' : 'critical'}
                format="text"
              />
              <MetricCard
                label="Programs Ready"
                value={`${metrics.programsReadyPercent}%`}
                icon={CheckCircle2}
                description={`${metrics.programsReady}/${metrics.totalPrograms} at ≥80%`}
                status={metrics.programsReadyPercent >= 80 ? 'healthy' : metrics.programsReadyPercent >= 60 ? 'warning' : 'critical'}
                format="text"
              />
            </div>
          </div>

          {/* Row 2: Upcoming Programs Table (8 cols) + At-Risk Programs (4 cols) */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md">Upcoming Programs</CardTitle>
              </CardHeader>
              <CardContent>
                {programs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No upcoming programs in the next 90 days.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-3 font-medium text-muted-foreground">Program</th>
                          <th className="pb-3 font-medium text-muted-foreground">Date</th>
                          <th className="pb-3 font-medium text-muted-foreground">Location</th>
                          <th className="pb-3 font-medium text-muted-foreground text-right">Enrolled</th>
                          <th className="pb-3 font-medium text-muted-foreground text-right">Ready</th>
                        </tr>
                      </thead>
                      <tbody>
                        {programs.slice(0, 8).map((program) => (
                          <ProgramRow key={program.id} program={program} />
                        ))}
                      </tbody>
                    </table>
                    {programs.length > 8 && (
                      <p className="text-sm text-muted-foreground text-center pt-4 border-t border-border mt-4">
                        + {programs.length - 8} more programs
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  At-Risk Programs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {atRiskPrograms.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No at-risk programs
                  </p>
                ) : (
                  <div className="space-y-3">
                    {atRiskPrograms.slice(0, 4).map((program) => (
                      <AtRiskProgramCard key={program.id} program={program} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Readiness Breakdown (6 cols) + Alerts/Deadlines (6 cols) */}
          <div className="col-span-12 lg:col-span-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md">Readiness Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {readinessItems.map((item) => {
                    const count = readiness[item.key] || 0;
                    const total = readiness.total_programs || 1;
                    const percent = Math.round((count / total) * 100);
                    const Icon = item.icon;

                    return (
                      <div key={item.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {count}/{total} ({percent}%)
                          </span>
                        </div>
                        <Progress
                          value={percent}
                          className="h-2"
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <AlertList
              alerts={alertItems}
              title="Alerts & Deadlines"
              maxItems={6}
            />
          </div>

          {/* Row 4: Room Blocks (4 cols) + Faculty Gaps (4 cols) + Activity (4 cols) */}
          <div className="col-span-12 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  Room Blocks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {roomBlockAlerts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No room block alerts
                  </p>
                ) : (
                  <div className="space-y-3">
                    {roomBlockAlerts.slice(0, 3).map((block) => (
                      <RoomBlockCard key={block.id} block={block} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Faculty Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                {facultyGaps.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    All faculty confirmed
                  </p>
                ) : (
                  <div className="space-y-3">
                    {facultyGaps.slice(0, 3).map((gap) => (
                      <FacultyGapCard key={`${gap.program_instance_id}-${gap.faculty_name}`} gap={gap} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <ActivityFeed
              activities={activityItems}
              title="Recent Activity"
              maxItems={6}
            />
          </div>

          {/* Row 5: Recent Registrations (full width) */}
          <div className="col-span-12">
            <RegistrationsTable
              registrations={recentRegistrations}
              title="Recent Registrations"
              maxItems={10}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function ProgramRow({ program }: { program: ProgramSummary }) {
  const enrollmentPercent = program.enrollment_percent || 0;
  const readinessScore = program.readiness_score || 0;

  const enrollmentStatus: HealthStatus =
    enrollmentPercent >= 80 ? 'healthy' : enrollmentPercent >= 50 ? 'warning' : 'critical';
  const readinessStatus: HealthStatus =
    readinessScore >= 80 ? 'healthy' : readinessScore >= 60 ? 'warning' : 'critical';

  return (
    <tr className="border-b border-border/50 hover:bg-background-card-light/50">
      <td className="py-3">
        <div>
          <p className="font-medium text-foreground">{program.program_name}</p>
          <p className="text-sm text-muted-foreground">{program.format}</p>
        </div>
      </td>
      <td className="py-3">
        <span className="text-sm">{formatDateRange(program.start_date, program.end_date)}</span>
        {program.days_until_start !== null && program.days_until_start <= 14 && (
          <span className="ml-2 text-xs text-warning">({program.days_until_start}d)</span>
        )}
      </td>
      <td className="py-3">
        <span className="text-sm">
          {program.city && program.state
            ? `${program.city}, ${program.state}`
            : program.format === 'virtual'
            ? 'Virtual'
            : '-'}
        </span>
      </td>
      <td className="py-3 text-right">
        <span
          className={`text-sm font-medium ${
            enrollmentStatus === 'healthy'
              ? 'text-success'
              : enrollmentStatus === 'warning'
              ? 'text-warning'
              : 'text-error'
          }`}
        >
          {program.current_enrolled}/{program.min_capacity}
        </span>
      </td>
      <td className="py-3 text-right">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            readinessStatus === 'healthy'
              ? 'bg-success/20 text-success'
              : readinessStatus === 'warning'
              ? 'bg-warning/20 text-warning'
              : 'bg-error/20 text-error'
          }`}
        >
          {readinessScore}%
        </span>
      </td>
    </tr>
  );
}

function AtRiskProgramCard({ program }: { program: AtRiskProgram }) {
  const severityColors = {
    critical: 'border-error/50 bg-error/5',
    warning: 'border-warning/50 bg-warning/5',
    info: 'border-info/50 bg-info/5',
  };

  return (
    <div className={`p-3 rounded-lg border ${severityColors[program.risk_level]}`}>
      <p className="font-medium text-sm">{program.program_name}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {formatDate(program.start_date)} • {program.days_until_start} days out
      </p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">{program.risk_reason}</span>
        <span
          className={`text-xs font-medium ${
            program.risk_level === 'critical'
              ? 'text-error'
              : program.risk_level === 'warning'
              ? 'text-warning'
              : 'text-info'
          }`}
        >
          {program.enrollment_percent || 0}% enrolled
        </span>
      </div>
    </div>
  );
}

function RoomBlockCard({ block }: { block: RoomBlockAlert }) {
  const urgencyColors = {
    critical: 'border-error/50',
    warning: 'border-warning/50',
    info: 'border-border',
  };

  return (
    <div className={`p-3 rounded-lg border ${urgencyColors[block.urgency]}`}>
      <p className="font-medium text-sm">{block.hotel_name}</p>
      <p className="text-xs text-muted-foreground">{block.program_name}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {block.rooms_booked}/{block.block_size} booked
        </span>
        <span
          className={`text-xs font-medium ${
            block.urgency === 'critical'
              ? 'text-error'
              : block.urgency === 'warning'
              ? 'text-warning'
              : 'text-muted-foreground'
          }`}
        >
          {block.days_to_cutoff}d to cutoff
        </span>
      </div>
      <Progress value={block.pickup_percent || 0} className="h-1.5 mt-2" />
    </div>
  );
}

function FacultyGapCard({ gap }: { gap: FacultyGap }) {
  const urgencyColors = {
    critical: 'text-error',
    warning: 'text-warning',
    info: 'text-muted-foreground',
  };

  return (
    <div className="p-3 rounded-lg border border-border">
      <p className="font-medium text-sm">{gap.program_name}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {gap.faculty_name}
        {gap.block_number && ` (Block ${gap.block_number})`}
      </p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {formatDate(gap.start_date)}
        </span>
        <span className={`text-xs font-medium ${urgencyColors[gap.urgency]}`}>
          {gap.days_until_start}d out
        </span>
      </div>
    </div>
  );
}
