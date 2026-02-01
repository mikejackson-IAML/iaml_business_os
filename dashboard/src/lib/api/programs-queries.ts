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

// ============================================
// Registration Types
// ============================================

export interface RegistrationSummary {
  id: string;
  airtable_id: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  job_title: string | null;
  registration_date: string;
  registration_status: string;
  registration_code: string | null;
  payment_status: string;
  payment_method: string | null;
  final_price: number;
  attendance_type: string;
  selected_blocks: string[] | null;
  program_instance_id: string | null;
  instance_name: string | null;
  program_name: string | null;
  format: string | null;
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  state: string | null;
}

// ============================================
// Registration Query Functions
// ============================================

export async function getRecentRegistrations(limit: number = 20): Promise<RegistrationSummary[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('registration_dashboard_summary')
    .select('*')
    .order('registration_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent registrations:', error);
    return [];
  }

  return (data || []) as RegistrationSummary[];
}

export async function getRegistrationsByProgram(
  programInstanceId: string
): Promise<RegistrationSummary[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('registration_dashboard_summary')
    .select('*')
    .eq('program_instance_id', programInstanceId)
    .order('registration_date', { ascending: false });

  if (error) {
    console.error('Error fetching registrations for program:', error);
    return [];
  }

  return (data || []) as RegistrationSummary[];
}

export async function getRegistrationStats(): Promise<{
  total: number;
  paid: number;
  pending: number;
  last7Days: number;
}> {
  const supabase = getServerClient();

  // Get all registrations
  const { data: allRegs, error: allError } = await supabase
    .from('registrations')
    .select('payment_status, registration_date')
    .eq('registration_status', 'Confirmed') as {
      data: { payment_status: string; registration_date: string }[] | null;
      error: Error | null
    };

  if (allError) {
    console.error('Error fetching registration stats:', allError);
    return { total: 0, paid: 0, pending: 0, last7Days: 0 };
  }

  const total = allRegs?.length || 0;
  const paid = allRegs?.filter(r => r.payment_status === 'Paid').length || 0;
  const pending = allRegs?.filter(r => r.payment_status === 'Pending').length || 0;

  // Calculate last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7Days = allRegs?.filter(r => {
    const regDate = new Date(r.registration_date);
    return regDate >= sevenDaysAgo;
  }).length || 0;

  return { total, paid, pending, last7Days };
}

// ============================================
// Programs List Types & Queries (Phase 1)
// ============================================

export interface ProgramListItem {
  id: string;
  instance_name: string;
  program_name: string;
  format: 'in-person' | 'virtual' | 'on-demand' | null;
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  state: string | null;
  current_enrolled: number;
  days_until_start: number | null;
  status: string;
  // Readiness fields
  readiness_score: number;
  faculty_confirmed: boolean;
  venue_confirmed: boolean;
  materials_ordered: boolean;
  materials_received: boolean;
  // Virtual block linking
  parent_program_id: string | null;
  parent_program_name: string | null;
  child_block_count: number;
  child_total_enrolled: number;
}

export interface ProgramListParams {
  city?: string;
  format?: string;
  status?: 'upcoming' | 'completed' | 'all';
  dateFrom?: string;
  dateTo?: string;
  sort?: 'start_date' | 'instance_name' | 'current_enrolled';
  order?: 'asc' | 'desc';
  includeArchived?: boolean;
}

export async function getProgramsList(params: ProgramListParams = {}): Promise<ProgramListItem[]> {
  const supabase = getServerClient();

  let query = supabase
    .from('program_dashboard_summary')
    .select('*');

  // Filter by city
  if (params.city && params.city !== '_all') {
    query = query.eq('city', params.city);
  }

  // Filter by format
  if (params.format && params.format !== '_all') {
    query = query.eq('format', params.format);
  }

  // Filter by status (upcoming vs completed)
  if (params.status === 'upcoming') {
    query = query.or('days_until_start.gte.0,days_until_start.is.null');
  } else if (params.status === 'completed') {
    query = query.lt('days_until_start', 0);
  }
  // 'all' or undefined = no status filter

  // Default: hide archived (completed) unless explicitly requested
  if (!params.includeArchived && params.status !== 'completed' && params.status !== 'all') {
    query = query.or('days_until_start.gte.0,days_until_start.is.null');
  }

  // Date range filters
  if (params.dateFrom) {
    query = query.gte('start_date', params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte('start_date', params.dateTo);
  }

  // Sorting
  const sortColumn = params.sort || 'start_date';
  const sortOrder = params.order !== 'desc';
  query = query.order(sortColumn, { ascending: sortOrder, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching programs list:', error);
    return [];
  }

  // Map to ProgramListItem type with defaults
  return (data || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    instance_name: p.instance_name as string,
    program_name: p.program_name as string,
    format: p.format as ProgramListItem['format'],
    start_date: p.start_date as string | null,
    end_date: p.end_date as string | null,
    city: p.city as string | null,
    state: p.state as string | null,
    current_enrolled: (p.current_enrolled as number) || 0,
    days_until_start: p.days_until_start as number | null,
    status: p.status as string,
    readiness_score: (p.readiness_score as number) || 0,
    faculty_confirmed: Boolean(p.faculty_confirmed),
    venue_confirmed: Boolean(p.venue_confirmed),
    materials_ordered: Boolean(p.materials_ordered),
    materials_received: Boolean(p.materials_received),
    parent_program_id: (p.parent_program_id as string) || null,
    parent_program_name: (p.parent_program_name as string) || null,
    child_block_count: (p.child_block_count as number) || 0,
    child_total_enrolled: (p.child_total_enrolled as number) || 0,
  })) as ProgramListItem[];
}

export async function getDistinctCities(): Promise<string[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('program_instances')
    .select('city')
    .not('city', 'is', null)
    .order('city') as { data: { city: string }[] | null; error: Error | null };

  if (error) {
    console.error('Error fetching distinct cities:', error);
    return [];
  }

  // Get unique cities
  const citySet = new Set((data || []).map(d => d.city).filter(Boolean));
  const cities = Array.from(citySet) as string[];
  return cities;
}

// ============================================
// Program Detail Types & Queries (Phase 2)
// ============================================

export interface ProgramBlock {
  id: string;
  name: string;
  shortName: string; // "Block 1", "Block 2", etc.
  startDate?: string;
}

// Block configuration mapping program names to their blocks
const BLOCK_CONFIG: Record<string, ProgramBlock[]> = {
  'Certificate in Employee Relations Law': [
    { id: 'block_1', name: 'Comprehensive Labor Relations', shortName: 'Block 1' },
    { id: 'block_2', name: 'Discrimination Prevention', shortName: 'Block 2' },
    { id: 'block_3', name: 'Special Issues', shortName: 'Block 3' },
  ],
  'Certificate in Strategic HR Leadership': [
    { id: 'block_1', name: 'HR Strategy Foundations', shortName: 'Block 1' },
    { id: 'block_2', name: 'Advanced Leadership', shortName: 'Block 2' },
  ],
  'Certificate in Legal HR Foundations': [
    { id: 'block_1', name: 'Employment Law Essentials', shortName: 'Block 1' },
    { id: 'block_2', name: 'HR Compliance', shortName: 'Block 2' },
  ],
  'Certificate in HR Analytics': [
    { id: 'block_1', name: 'Data-Driven HR', shortName: 'Block 1' },
    { id: 'block_2', name: 'Advanced Analytics', shortName: 'Block 2' },
  ],
};

/**
 * Get blocks configuration for a program by name
 * Returns empty array for non-certificate programs
 */
export function getBlocksForProgram(programName: string): ProgramBlock[] {
  // Check for exact match first
  if (BLOCK_CONFIG[programName]) {
    return BLOCK_CONFIG[programName];
  }

  // Check for partial match (e.g., "Certificate in Employee Relations Law - Virtual - Oct 2026")
  for (const [key, blocks] of Object.entries(BLOCK_CONFIG)) {
    if (programName.includes(key)) {
      return blocks;
    }
  }

  return [];
}

export interface ProgramDetail {
  id: string;
  instance_name: string;
  program_name: string;
  format: 'in-person' | 'virtual' | 'on-demand' | null;
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  state: string | null;
  venue_name: string | null;
  current_enrolled: number;
  min_capacity: number;
  max_capacity: number;
  days_until_start: number | null;
  status: string;
  readiness_score: number;
  // Virtual block linking
  parent_program_id: string | null;
  parent_program_name: string | null;
  child_block_count: number;
  child_total_enrolled: number;
  // Room block fields (for Logistics tab)
  room_block_hotel: string | null;
  rooms_booked: number | null;
  block_size: number | null;
  room_block_cutoff: string | null;
}

export interface RegistrationRosterItem {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  job_title: string | null;
  registration_date: string;
  registration_status: string;
  payment_status: string;
  payment_method: string | null;
  payment_due_date: string | null;
  final_price: number;
  attendance_type: string;
  selected_blocks: string[] | null;
  registration_source: string | null;
  program_name: string | null;
  // Cancellation fields (available after migration applied)
  cancelled_at: string | null;
  refund_status: 'not_applicable' | 'pending' | 'processed' | 'denied' | null;
  refund_amount: number | null;
  // Apollo enrichment fields (available after enrichment)
  linkedin_url: string | null;
  linkedin_photo_url: string | null;
  company_industry: string | null;
  company_employee_count: number | null;
  company_growth_30d: number | null;
  company_growth_60d: number | null;
  company_growth_90d: number | null;
}

/** Roster filter options */
export interface RosterFilters {
  paymentStatus?: 'all' | 'paid' | 'unpaid' | 'past_due';
  block?: string;
  company?: string;
  source?: string;
}

export async function getProgram(programId: string): Promise<ProgramDetail | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('program_dashboard_summary')
    .select('*')
    .eq('id', programId)
    .single();

  if (error) {
    console.error('Error fetching program:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Map to ProgramDetail type with proper defaults
  const p = data as Record<string, unknown>;
  return {
    id: p.id as string,
    instance_name: p.instance_name as string,
    program_name: p.program_name as string,
    format: p.format as ProgramDetail['format'],
    start_date: p.start_date as string | null,
    end_date: p.end_date as string | null,
    city: p.city as string | null,
    state: p.state as string | null,
    venue_name: p.venue_name as string | null,
    current_enrolled: (p.current_enrolled as number) || 0,
    min_capacity: (p.min_capacity as number) || 0,
    max_capacity: (p.max_capacity as number) || 0,
    days_until_start: p.days_until_start as number | null,
    status: p.status as string,
    readiness_score: (p.readiness_score as number) || 0,
    parent_program_id: (p.parent_program_id as string) || null,
    parent_program_name: (p.parent_program_name as string) || null,
    child_block_count: (p.child_block_count as number) || 0,
    child_total_enrolled: (p.child_total_enrolled as number) || 0,
    // Room block fields
    room_block_hotel: (p.room_block_hotel as string) || null,
    rooms_booked: (p.rooms_booked as number) || null,
    block_size: (p.block_size as number) || null,
    room_block_cutoff: (p.room_block_cutoff as string) || null,
  };
}

export async function getRegistrationsForProgram(
  programId: string,
  filters?: Record<string, string | undefined>
): Promise<RegistrationRosterItem[]> {
  const supabase = getServerClient();

  let query = supabase
    .from('registration_dashboard_summary')
    .select('*')
    .eq('program_instance_id', programId);

  // Apply filters if provided
  if (filters?.paymentStatus && filters.paymentStatus !== '_all') {
    query = query.eq('payment_status', filters.paymentStatus);
  }

  if (filters?.source && filters.source !== '_all') {
    query = query.eq('registration_source', filters.source);
  }

  // Sort by registration date descending (most recent first)
  query = query.order('registration_date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching registrations for program:', error);
    return [];
  }

  // Map to RegistrationRosterItem type
  return (data || []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    first_name: r.first_name as string,
    last_name: r.last_name as string,
    full_name: r.full_name as string,
    email: r.email as string,
    phone: r.phone as string | null,
    company_name: r.company_name as string | null,
    job_title: r.job_title as string | null,
    registration_date: r.registration_date as string,
    registration_status: r.registration_status as string,
    payment_status: r.payment_status as string,
    payment_method: r.payment_method as string | null,
    payment_due_date: (r.payment_due_date as string) || null,
    final_price: (r.final_price as number) || 0,
    attendance_type: r.attendance_type as string,
    selected_blocks: r.selected_blocks as string[] | null,
    registration_source: r.registration_source as string | null,
    program_name: (r.program_name as string) || null,
    // Cancellation fields (null until migration applied)
    cancelled_at: (r.cancelled_at as string) || null,
    refund_status: (r.refund_status as RegistrationRosterItem['refund_status']) || null,
    refund_amount: (r.refund_amount as number) || null,
    // Apollo enrichment fields (null until enriched)
    linkedin_url: (r.linkedin_url as string) || null,
    linkedin_photo_url: (r.linkedin_photo_url as string) || null,
    company_industry: (r.company_industry as string) || null,
    company_employee_count: (r.company_employee_count as number) || null,
    company_growth_30d: (r.company_growth_30d as number) || null,
    company_growth_60d: (r.company_growth_60d as number) || null,
    company_growth_90d: (r.company_growth_90d as number) || null,
  }));
}

/**
 * Check if a block is selected in the selected_blocks array
 * Handles various formats: "Full", "Block 1", "block_1", etc.
 */
export function isBlockSelected(selectedBlocks: string[] | null, blockId: string): boolean {
  if (!selectedBlocks || selectedBlocks.length === 0) return false;

  // "Full" or "full" means all blocks selected
  if (selectedBlocks.some((b) => b.toLowerCase() === 'full')) return true;

  // Check for various block identifier formats
  const blockNum = blockId.replace('block_', '');
  return selectedBlocks.some((b) => {
    const lower = b.toLowerCase();
    return (
      lower === blockId ||
      lower === `block ${blockNum}` ||
      lower === `block_${blockNum}` ||
      lower.includes(`block ${blockNum}`) ||
      lower.includes(blockId)
    );
  });
}

// ============================================
// Company History Types & Queries (Phase 3)
// ============================================

export interface CompanyRegistrationHistoryItem {
  id: string;
  full_name: string;
  program_name: string;
  registration_date: string;
  payment_status: 'paid' | 'unpaid';
}

/**
 * Get all registrations from a specific company across all programs
 * Used by Contact Panel to show colleague history
 */
export async function getCompanyRegistrationHistory(
  companyName: string
): Promise<CompanyRegistrationHistoryItem[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('registration_dashboard_summary')
    .select('id, full_name, program_name, registration_date, payment_status')
    .eq('company_name', companyName)
    .order('registration_date', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching company history:', error);
    return [];
  }

  return (data || []) as CompanyRegistrationHistoryItem[];
}

// ============================================
// Logistics Types & Queries (Phase 4)
// ============================================

export interface ProgramLogistics {
  program_instance_id: string;
  // People
  instructor_name: string | null;
  instructor_contact: string | null;
  instructor_confirmed_at: string | null;
  // My Hotel
  my_hotel_name: string | null;
  my_hotel_dates: string | null;
  my_hotel_confirmation: string | null;
  my_hotel_booked_at: string | null;
  // Instructor Hotel
  instructor_hotel_name: string | null;
  instructor_hotel_dates: string | null;
  instructor_hotel_confirmation: string | null;
  instructor_hotel_booked_at: string | null;
  // Room Block
  room_block_secured_at: string | null;
  // Venue
  venue_location: string | null;
  venue_daily_rate: number | null;
  venue_fb_minimum: number | null;
  venue_confirmed_at: string | null;
  // BEO
  beo_url: string | null;
  beo_file_name: string | null;
  beo_status: 'draft' | 'final' | null;
  beo_uploaded_at: string | null;
  // Materials (7 items)
  materials_sent_to_instructor: boolean;
  materials_sent_at: string | null;
  materials_feedback_received: boolean;
  materials_feedback_at: string | null;
  materials_updated: boolean;
  materials_updated_at: string | null;
  materials_printed: boolean;
  materials_printed_at: string | null;
  materials_shipped: boolean;
  materials_shipped_at: string | null;
  materials_tracking: string | null;
  // AV
  av_purchased: boolean;
  av_purchased_at: string | null;
  av_shipped: boolean;
  av_shipped_at: string | null;
  av_tracking: string | null;
  // Virtual-specific
  platform_ready: boolean;
  platform_link: string | null;
  platform_ready_at: string | null;
  calendar_invites_sent: boolean;
  calendar_invites_at: string | null;
  reminder_emails_sent: boolean;
  reminder_emails_at: string | null;
  // Meta
  updated_at: string | null;
}

export interface ProgramExpense {
  id: string;
  program_instance_id: string;
  category: 'Accommodations' | 'Venue' | 'Materials' | 'Equipment' | 'Other';
  description: string;
  amount: number;
  expense_date: string | null;
  receipt_url: string | null;
  receipt_file_name: string | null;
  receipt_file_type: string | null;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_CATEGORIES = [
  'Accommodations',
  'Venue',
  'Materials',
  'Equipment',
  'Other',
] as const;

/**
 * Default logistics values for programs without a logistics record
 */
function getDefaultLogistics(programId: string): ProgramLogistics {
  return {
    program_instance_id: programId,
    instructor_name: null,
    instructor_contact: null,
    instructor_confirmed_at: null,
    my_hotel_name: null,
    my_hotel_dates: null,
    my_hotel_confirmation: null,
    my_hotel_booked_at: null,
    instructor_hotel_name: null,
    instructor_hotel_dates: null,
    instructor_hotel_confirmation: null,
    instructor_hotel_booked_at: null,
    room_block_secured_at: null,
    venue_location: null,
    venue_daily_rate: null,
    venue_fb_minimum: null,
    venue_confirmed_at: null,
    beo_url: null,
    beo_file_name: null,
    beo_status: null,
    beo_uploaded_at: null,
    materials_sent_to_instructor: false,
    materials_sent_at: null,
    materials_feedback_received: false,
    materials_feedback_at: null,
    materials_updated: false,
    materials_updated_at: null,
    materials_printed: false,
    materials_printed_at: null,
    materials_shipped: false,
    materials_shipped_at: null,
    materials_tracking: null,
    av_purchased: false,
    av_purchased_at: null,
    av_shipped: false,
    av_shipped_at: null,
    av_tracking: null,
    platform_ready: false,
    platform_link: null,
    platform_ready_at: null,
    calendar_invites_sent: false,
    calendar_invites_at: null,
    reminder_emails_sent: false,
    reminder_emails_at: null,
    updated_at: null,
  };
}

/**
 * Get logistics data for a program
 * Returns default values if no record exists yet
 */
export async function getProgramLogistics(programId: string): Promise<ProgramLogistics> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('program_logistics')
    .select('*')
    .eq('program_instance_id', programId)
    .single();

  if (error || !data) {
    // Return default values - record will be created on first update
    return getDefaultLogistics(programId);
  }

  // Map database record to typed interface with proper defaults
  const d = data as Record<string, unknown>;
  return {
    program_instance_id: d.program_instance_id as string,
    instructor_name: (d.instructor_name as string) || null,
    instructor_contact: (d.instructor_contact as string) || null,
    instructor_confirmed_at: (d.instructor_confirmed_at as string) || null,
    my_hotel_name: (d.my_hotel_name as string) || null,
    my_hotel_dates: (d.my_hotel_dates as string) || null,
    my_hotel_confirmation: (d.my_hotel_confirmation as string) || null,
    my_hotel_booked_at: (d.my_hotel_booked_at as string) || null,
    instructor_hotel_name: (d.instructor_hotel_name as string) || null,
    instructor_hotel_dates: (d.instructor_hotel_dates as string) || null,
    instructor_hotel_confirmation: (d.instructor_hotel_confirmation as string) || null,
    instructor_hotel_booked_at: (d.instructor_hotel_booked_at as string) || null,
    room_block_secured_at: (d.room_block_secured_at as string) || null,
    venue_location: (d.venue_location as string) || null,
    venue_daily_rate: (d.venue_daily_rate as number) || null,
    venue_fb_minimum: (d.venue_fb_minimum as number) || null,
    venue_confirmed_at: (d.venue_confirmed_at as string) || null,
    beo_url: (d.beo_url as string) || null,
    beo_file_name: (d.beo_file_name as string) || null,
    beo_status: (d.beo_status as 'draft' | 'final') || null,
    beo_uploaded_at: (d.beo_uploaded_at as string) || null,
    materials_sent_to_instructor: Boolean(d.materials_sent_to_instructor),
    materials_sent_at: (d.materials_sent_at as string) || null,
    materials_feedback_received: Boolean(d.materials_feedback_received),
    materials_feedback_at: (d.materials_feedback_at as string) || null,
    materials_updated: Boolean(d.materials_updated),
    materials_updated_at: (d.materials_updated_at as string) || null,
    materials_printed: Boolean(d.materials_printed),
    materials_printed_at: (d.materials_printed_at as string) || null,
    materials_shipped: Boolean(d.materials_shipped),
    materials_shipped_at: (d.materials_shipped_at as string) || null,
    materials_tracking: (d.materials_tracking as string) || null,
    av_purchased: Boolean(d.av_purchased),
    av_purchased_at: (d.av_purchased_at as string) || null,
    av_shipped: Boolean(d.av_shipped),
    av_shipped_at: (d.av_shipped_at as string) || null,
    av_tracking: (d.av_tracking as string) || null,
    platform_ready: Boolean(d.platform_ready),
    platform_link: (d.platform_link as string) || null,
    platform_ready_at: (d.platform_ready_at as string) || null,
    calendar_invites_sent: Boolean(d.calendar_invites_sent),
    calendar_invites_at: (d.calendar_invites_at as string) || null,
    reminder_emails_sent: Boolean(d.reminder_emails_sent),
    reminder_emails_at: (d.reminder_emails_at as string) || null,
    updated_at: (d.updated_at as string) || null,
  };
}

/**
 * Get all expenses for a program
 */
export async function getProgramExpenses(programId: string): Promise<ProgramExpense[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('program_expenses')
    .select('*')
    .eq('program_instance_id', programId)
    .order('expense_date', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }

  return (data || []) as ProgramExpense[];
}
