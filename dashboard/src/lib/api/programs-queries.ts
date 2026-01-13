// Programs & Operations Dashboard API
// Queries Supabase for program data, readiness, and alerts

import { getServerClient } from '@/lib/supabase/server';

// ============================================
// Types
// ============================================

export interface ProgramSummary {
  id: string;
  airtable_id: string | null;
  instance_name: string;
  program_name: string;
  format: string | null;
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  state: string | null;
  venue_name: string | null;
  current_enrolled: number;
  min_capacity: number;
  max_capacity: number;
  status: string;
  enrollment_percent: number | null;
  days_until_start: number | null;
  readiness_score: number;
  faculty_confirmed: boolean;
  faculty_brief_sent: boolean;
  venue_confirmed: boolean;
  materials_ordered: boolean;
  materials_received: boolean;
  shrm_approved: boolean;
  av_ordered: boolean;
  catering_confirmed: boolean;
  room_block_active: boolean;
  registration_live: boolean;
  room_block_hotel: string | null;
  rooms_booked: number | null;
  block_size: number | null;
  room_block_percent: number | null;
  room_block_cutoff: string | null;
}

export interface ReadinessBreakdown {
  total_programs: number;
  faculty_confirmed_count: number;
  faculty_brief_count: number;
  venue_confirmed_count: number;
  materials_ordered_count: number;
  materials_received_count: number;
  shrm_approved_count: number;
  av_ordered_count: number;
  catering_confirmed_count: number;
  room_block_count: number;
  registration_live_count: number;
  programs_ready_count: number;
}

export interface AtRiskProgram {
  id: string;
  instance_name: string;
  program_name: string;
  start_date: string;
  current_enrolled: number;
  min_capacity: number;
  enrollment_percent: number | null;
  days_until_start: number;
  readiness_score: number;
  risk_level: 'critical' | 'warning' | 'info';
  risk_reason: string;
}

export interface RoomBlockAlert {
  id: string;
  instance_name: string;
  program_name: string;
  start_date: string;
  hotel_name: string;
  rooms_booked: number;
  block_size: number;
  pickup_percent: number | null;
  cutoff_date: string;
  days_to_cutoff: number;
  urgency: 'critical' | 'warning' | 'info';
  recommendation: string;
}

export interface FacultyGap {
  program_instance_id: string;
  instance_name: string;
  program_name: string;
  start_date: string;
  days_until_start: number;
  faculty_name: string;
  block_number: number | null;
  confirmed: boolean;
  urgency: 'critical' | 'warning' | 'info';
}

export interface ProgramActivity {
  id: string;
  program_instance_id: string;
  activity_type: string;
  description: string | null;
  metadata: Record<string, unknown>;
  activity_at: string;
}

export interface ProgramsAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  timestamp: Date;
}

export interface ProgramsMetrics {
  totalPrograms: number;
  totalEnrolled: number;
  totalCapacity: number;
  enrollmentPercent: number;
  programsReady: number;
  programsReadyPercent: number;
  facultyConfirmed: number;
  facultyConfirmedPercent: number;
  certificationsApproved: number;
  certificationsPercent: number;
}

// ============================================
// Query Functions
// ============================================

export async function getProgramsSummary(daysAhead: number = 90): Promise<ProgramSummary[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('program_dashboard_summary')
    .select('*')
    .gte('days_until_start', 0)
    .lte('days_until_start', daysAhead)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching programs summary:', error);
    return [];
  }

  return (data || []) as ProgramSummary[];
}

export async function getReadinessBreakdown(): Promise<ReadinessBreakdown> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('readiness_breakdown')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching readiness breakdown:', error);
    return {
      total_programs: 0,
      faculty_confirmed_count: 0,
      faculty_brief_count: 0,
      venue_confirmed_count: 0,
      materials_ordered_count: 0,
      materials_received_count: 0,
      shrm_approved_count: 0,
      av_ordered_count: 0,
      catering_confirmed_count: 0,
      room_block_count: 0,
      registration_live_count: 0,
      programs_ready_count: 0,
    };
  }

  return data as ReadinessBreakdown;
}

export async function getAtRiskPrograms(): Promise<AtRiskProgram[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('at_risk_programs')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error fetching at-risk programs:', error);
    return [];
  }

  return (data || []) as AtRiskProgram[];
}

export async function getRoomBlockAlerts(): Promise<RoomBlockAlert[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('room_block_alerts')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching room block alerts:', error);
    return [];
  }

  return (data || []) as RoomBlockAlert[];
}

export async function getFacultyGaps(): Promise<FacultyGap[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('faculty_gaps')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error fetching faculty gaps:', error);
    return [];
  }

  return (data || []) as FacultyGap[];
}

export async function getRecentProgramActivity(limit: number = 10): Promise<ProgramActivity[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('program_activity')
    .select('*')
    .order('activity_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching program activity:', error);
    return [];
  }

  return (data || []) as ProgramActivity[];
}

// ============================================
// Aggregated Metrics
// ============================================

export async function getProgramsMetrics(): Promise<ProgramsMetrics> {
  const [programs, readiness] = await Promise.all([
    getProgramsSummary(90),
    getReadinessBreakdown(),
  ]);

  const totalPrograms = programs.length;
  const totalEnrolled = programs.reduce((sum, p) => sum + (p.current_enrolled || 0), 0);
  const totalCapacity = programs.reduce((sum, p) => sum + (p.min_capacity || 0), 0);
  const enrollmentPercent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  const programsReady = readiness.programs_ready_count || 0;
  const programsReadyPercent = totalPrograms > 0 ? Math.round((programsReady / totalPrograms) * 100) : 0;

  const facultyConfirmed = readiness.faculty_confirmed_count || 0;
  const facultyConfirmedPercent = totalPrograms > 0 ? Math.round((facultyConfirmed / totalPrograms) * 100) : 0;

  const certificationsApproved = readiness.shrm_approved_count || 0;
  const certificationsPercent = totalPrograms > 0 ? Math.round((certificationsApproved / totalPrograms) * 100) : 0;

  return {
    totalPrograms,
    totalEnrolled,
    totalCapacity,
    enrollmentPercent,
    programsReady,
    programsReadyPercent,
    facultyConfirmed,
    facultyConfirmedPercent,
    certificationsApproved,
    certificationsPercent,
  };
}

// ============================================
// Alert Generation
// ============================================

export function generateProgramsAlerts(
  atRisk: AtRiskProgram[],
  roomBlocks: RoomBlockAlert[],
  facultyGaps: FacultyGap[],
  readiness: ReadinessBreakdown
): ProgramsAlert[] {
  const alerts: ProgramsAlert[] = [];

  // At-risk program alerts
  atRisk.forEach((program) => {
    if (program.risk_level === 'critical') {
      alerts.push({
        id: `atrisk-${program.id}`,
        title: `${program.program_name} at risk`,
        description: `${program.risk_reason}: ${program.enrollment_percent || 0}% enrolled, ${program.days_until_start} days out`,
        severity: 'critical',
        category: 'enrollment',
        timestamp: new Date(),
      });
    }
  });

  // Room block alerts
  roomBlocks.forEach((block) => {
    if (block.urgency === 'critical' || block.urgency === 'warning') {
      alerts.push({
        id: `roomblock-${block.id}`,
        title: `Room block cutoff: ${block.hotel_name}`,
        description: `${block.pickup_percent || 0}% pickup, ${block.days_to_cutoff} days to cutoff. ${block.recommendation}`,
        severity: block.urgency,
        category: 'logistics',
        timestamp: new Date(),
      });
    }
  });

  // Faculty gap alerts
  const criticalFacultyGaps = facultyGaps.filter((g) => g.urgency === 'critical');
  if (criticalFacultyGaps.length > 0) {
    alerts.push({
      id: 'faculty-gaps',
      title: `${criticalFacultyGaps.length} unconfirmed faculty`,
      description: `Programs within 14 days need faculty confirmation`,
      severity: 'critical',
      category: 'faculty',
      timestamp: new Date(),
    });
  }

  // Low readiness alert
  if (readiness.total_programs > 0) {
    const readyPercent = Math.round((readiness.programs_ready_count / readiness.total_programs) * 100);
    if (readyPercent < 70) {
      alerts.push({
        id: 'low-readiness',
        title: 'Low overall readiness',
        description: `Only ${readyPercent}% of programs have ≥80% readiness score`,
        severity: readyPercent < 50 ? 'critical' : 'warning',
        category: 'readiness',
        timestamp: new Date(),
      });
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

// ============================================
// Health Score Calculation
// ============================================

export interface HealthScoreResult {
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  breakdown: {
    label: string;
    score: number;
    weight: number;
    status: 'healthy' | 'warning' | 'critical';
  }[];
}

export function calculateProgramsHealthScore(
  metrics: ProgramsMetrics,
  readiness: ReadinessBreakdown,
  alerts: ProgramsAlert[]
): HealthScoreResult {
  const breakdown: HealthScoreResult['breakdown'] = [];

  // 1. Programs Ready (30%)
  const programsReadyScore = metrics.programsReadyPercent;
  breakdown.push({
    label: 'Programs Ready',
    score: programsReadyScore,
    weight: 0.30,
    status: programsReadyScore >= 80 ? 'healthy' : programsReadyScore >= 60 ? 'warning' : 'critical',
  });

  // 2. Enrollment vs Target (25%)
  const enrollmentScore = Math.min(metrics.enrollmentPercent, 100);
  breakdown.push({
    label: 'Enrollment',
    score: enrollmentScore,
    weight: 0.25,
    status: enrollmentScore >= 75 ? 'healthy' : enrollmentScore >= 50 ? 'warning' : 'critical',
  });

  // 3. Faculty Confirmed (15%)
  const facultyScore = metrics.facultyConfirmedPercent;
  breakdown.push({
    label: 'Faculty Confirmed',
    score: facultyScore,
    weight: 0.15,
    status: facultyScore >= 90 ? 'healthy' : facultyScore >= 70 ? 'warning' : 'critical',
  });

  // 4. Materials On Track (10%)
  const materialsPercent = readiness.total_programs > 0
    ? Math.round((readiness.materials_ordered_count / readiness.total_programs) * 100)
    : 0;
  breakdown.push({
    label: 'Materials On Track',
    score: materialsPercent,
    weight: 0.10,
    status: materialsPercent >= 85 ? 'healthy' : materialsPercent >= 60 ? 'warning' : 'critical',
  });

  // 5. Certifications Current (10%)
  const certScore = metrics.certificationsPercent;
  breakdown.push({
    label: 'Certifications',
    score: certScore,
    weight: 0.10,
    status: certScore >= 90 ? 'healthy' : certScore >= 70 ? 'warning' : 'critical',
  });

  // 6. No Critical Blockers (10%)
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const blockersScore = criticalAlerts === 0 ? 100 : 0;
  breakdown.push({
    label: 'No Critical Blockers',
    score: blockersScore,
    weight: 0.10,
    status: blockersScore === 100 ? 'healthy' : 'critical',
  });

  // Calculate weighted total
  const totalScore = Math.round(
    breakdown.reduce((sum, item) => sum + item.score * item.weight, 0)
  );

  // Determine overall status
  let status: HealthScoreResult['status'] = 'healthy';
  if (totalScore < 60) status = 'critical';
  else if (totalScore < 80) status = 'warning';

  return { score: totalScore, status, breakdown };
}

// ============================================
// Full Dashboard Data Fetcher
// ============================================

export interface ProgramsDashboardData {
  programs: ProgramSummary[];
  metrics: ProgramsMetrics;
  readiness: ReadinessBreakdown;
  atRiskPrograms: AtRiskProgram[];
  roomBlockAlerts: RoomBlockAlert[];
  facultyGaps: FacultyGap[];
  recentActivity: ProgramActivity[];
  alerts: ProgramsAlert[];
  healthScore: HealthScoreResult;
}

export async function getProgramsDashboardData(): Promise<ProgramsDashboardData> {
  const [
    programs,
    metrics,
    readiness,
    atRiskPrograms,
    roomBlockAlerts,
    facultyGaps,
    recentActivity,
  ] = await Promise.all([
    getProgramsSummary(90),
    getProgramsMetrics(),
    getReadinessBreakdown(),
    getAtRiskPrograms(),
    getRoomBlockAlerts(),
    getFacultyGaps(),
    getRecentProgramActivity(10),
  ]);

  const alerts = generateProgramsAlerts(atRiskPrograms, roomBlockAlerts, facultyGaps, readiness);
  const healthScore = calculateProgramsHealthScore(metrics, readiness, alerts);

  return {
    programs,
    metrics,
    readiness,
    atRiskPrograms,
    roomBlockAlerts,
    facultyGaps,
    recentActivity,
    alerts,
    healthScore,
  };
}
