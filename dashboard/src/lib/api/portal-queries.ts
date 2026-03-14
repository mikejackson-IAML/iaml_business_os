import { getServerClient } from '@/lib/supabase/server';

// ============================================
// Types
// ============================================

export interface PortalProgram {
  id: string;
  instance_name: string;
  program_name: string;
  format: string | null;
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  state: string | null;
  current_enrolled: number;
  max_capacity: number;
  min_capacity: number;
  status: string;
  enrollment_percent: number | null;
  days_until_start: number | null;
  // Computed from registrations
  total_registered: number;
  total_paid: number;
  total_pending: number;
  total_invoice_requested: number;
  total_revenue: number;
  total_outstanding: number;
}

export interface PortalRegistration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  job_title: string | null;
  registration_date: string | null;
  registration_status: string;
  payment_status: string;
  payment_method: string | null;
  final_price: number;
  attendance_type: string;
  selected_blocks: string[] | null;
  registration_source: string | null;
  cancelled_at: string | null;
  stripe_invoice_id: string | null;
}

export interface PortalOverviewMetrics {
  total_upcoming_programs: number;
  total_registrations: number;
  total_paid: number;
  total_pending: number;
  total_invoice_requested: number;
  total_revenue: number;
  total_outstanding: number;
}

// ============================================
// Queries
// ============================================

export async function getPortalPrograms(): Promise<PortalProgram[]> {
  const supabase = getServerClient();

  // Get upcoming programs
  const { data: programs, error: programsError } = await supabase
    .from('program_dashboard_summary')
    .select('*')
    .gte('days_until_start', -7) // Include programs that started within last week
    .order('start_date', { ascending: true });

  if (programsError) {
    console.error('Error fetching portal programs:', programsError);
    return [];
  }

  // Get registration stats per program
  const { data: regStats, error: regError } = await supabase
    .from('registrations')
    .select('program_instance_id, payment_status, payment_method, final_price, registration_status')
    .in('registration_status', ['Confirmed', 'Pending']);

  if (regError) {
    console.error('Error fetching registration stats:', regError);
  }

  // Aggregate registration data per program
  const statsMap = new Map<string, {
    total_registered: number;
    total_paid: number;
    total_pending: number;
    total_invoice_requested: number;
    total_revenue: number;
    total_outstanding: number;
  }>();

  for (const reg of regStats || []) {
    const pid = reg.program_instance_id;
    if (!pid) continue;

    const stats = statsMap.get(pid) || {
      total_registered: 0,
      total_paid: 0,
      total_pending: 0,
      total_invoice_requested: 0,
      total_revenue: 0,
      total_outstanding: 0,
    };

    stats.total_registered++;

    const isPaid = reg.payment_status === 'Paid' || reg.payment_status === 'Paid in Full';
    const isInvoice = reg.payment_method === 'Invoice';

    if (isPaid) {
      stats.total_paid++;
      stats.total_revenue += reg.final_price || 0;
    } else if (isInvoice) {
      // Invoice requested but not yet paid
      stats.total_invoice_requested++;
      stats.total_outstanding += reg.final_price || 0;
    } else {
      stats.total_pending++;
      stats.total_outstanding += reg.final_price || 0;
    }

    statsMap.set(pid, stats);
  }

  return (programs || []).map((p) => ({
    id: p.id,
    instance_name: p.instance_name,
    program_name: p.program_name,
    format: p.format,
    start_date: p.start_date,
    end_date: p.end_date,
    city: p.city,
    state: p.state,
    current_enrolled: p.current_enrolled,
    max_capacity: p.max_capacity,
    min_capacity: p.min_capacity,
    status: p.status,
    enrollment_percent: p.enrollment_percent,
    days_until_start: p.days_until_start,
    ...(statsMap.get(p.id) || {
      total_registered: 0,
      total_paid: 0,
      total_pending: 0,
      total_invoice_requested: 0,
      total_revenue: 0,
      total_outstanding: 0,
    }),
  }));
}

export async function getPortalRegistrations(programInstanceId: string): Promise<PortalRegistration[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('registration_dashboard_summary')
    .select('*')
    .eq('program_instance_id', programInstanceId)
    .order('registration_date', { ascending: false });

  if (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }

  return (data || []).map((r) => ({
    id: r.id,
    first_name: r.first_name,
    last_name: r.last_name,
    email: r.email,
    phone: r.phone,
    company_name: r.company_name,
    job_title: r.job_title,
    registration_date: r.registration_date,
    registration_status: r.registration_status,
    payment_status: r.payment_status,
    payment_method: r.payment_method,
    final_price: r.final_price || 0,
    attendance_type: r.attendance_type,
    selected_blocks: r.selected_blocks,
    registration_source: r.registration_source,
    cancelled_at: r.cancelled_at,
    stripe_invoice_id: r.stripe_invoice_id,
  }));
}

export async function getPortalProgramDetail(programInstanceId: string) {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('program_dashboard_summary')
    .select('*')
    .eq('id', programInstanceId)
    .single();

  if (error) {
    console.error('Error fetching program detail:', error);
    return null;
  }

  return data;
}

export function computeOverviewMetrics(programs: PortalProgram[]): PortalOverviewMetrics {
  return programs.reduce(
    (acc, p) => ({
      total_upcoming_programs: acc.total_upcoming_programs + 1,
      total_registrations: acc.total_registrations + p.total_registered,
      total_paid: acc.total_paid + p.total_paid,
      total_pending: acc.total_pending + p.total_pending,
      total_invoice_requested: acc.total_invoice_requested + p.total_invoice_requested,
      total_revenue: acc.total_revenue + p.total_revenue,
      total_outstanding: acc.total_outstanding + p.total_outstanding,
    }),
    {
      total_upcoming_programs: 0,
      total_registrations: 0,
      total_paid: 0,
      total_pending: 0,
      total_invoice_requested: 0,
      total_revenue: 0,
      total_outstanding: 0,
    }
  );
}
