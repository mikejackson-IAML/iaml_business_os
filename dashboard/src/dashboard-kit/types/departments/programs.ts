import type { DepartmentConfig, MetricValue, AlertItem, ActivityItem, HealthStatus } from '../dashboard';

// Programs & Operations Department specific types

export type ProgramFormat = 'in_person' | 'virtual' | 'hybrid';
export type ProgramType = 'certificate' | 'single_day' | 'workshop' | 'boot_camp' | 'summit';
export type ProgramStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export interface ReadinessChecklist {
  facultyConfirmed: boolean;
  venueConfirmed: boolean;
  materialsOrdered: boolean;
  materialsReceived: boolean;
  shrmApproved: boolean;
  avOrdered: boolean;
  cateringConfirmed: boolean;
  roomBlockActive: boolean;
  regPageLive: boolean;
  facultyBriefSent: boolean;
}

export interface ProgramInstance {
  id: string;
  programName: string;
  programType: ProgramType;
  format: ProgramFormat;
  status: ProgramStatus;
  startDate: Date;
  endDate: Date;
  location: string;
  venue?: string;
  enrolledCount: number;
  maxCapacity: number;
  enrollmentPercent: number;
  readinessPercent: number;
  readinessChecklist: ReadinessChecklist;
  faculty?: string[];
  alertCount?: number;
  hasAlert?: boolean;
}

export interface FacultyGap {
  id: string;
  programId: string;
  programName: string;
  startDate: Date;
  role: string;
  deadline: Date;
  status: 'open' | 'pending_confirmation' | 'needs_backup';
}

export interface RoomBlock {
  id: string;
  programId: string;
  propertyName: string;
  roomsBlocked: number;
  roomsPickedUp: number;
  pickupRate: number;
  attritionDate: Date;
  status: 'healthy' | 'at_risk' | 'critical';
}

export interface Deadline {
  id: string;
  type:
    | 'materials_to_printer'
    | 'faculty_briefs'
    | 'shrm_submission'
    | 'room_block_decision'
    | 'av_orders'
    | 'catering_final';
  programId?: string;
  programName?: string;
  dueDate: Date;
  description: string;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed';
  daysUntil: number;
}

export interface Registration {
  id: string;
  programId: string;
  participantName: string;
  email: string;
  company?: string;
  registeredAt: Date;
  paymentStatus: 'paid' | 'pending' | 'refunded';
}

export interface ProgramsMetrics {
  programsReady: MetricValue;
  avgEnrollment: MetricValue;
  facultyFillRate: MetricValue;
  registrationsThisWeek: MetricValue;
}

export interface ProgramsDashboardData {
  metrics: ProgramsMetrics;
  upcomingPrograms: ProgramInstance[];
  atRiskPrograms: ProgramInstance[];
  facultyGaps: FacultyGap[];
  roomBlockAlerts: RoomBlock[];
  upcomingDeadlines: Deadline[];
  recentActivity: ActivityItem[];
  alerts: AlertItem[];
  enrollmentSummary: {
    totalSeats: number;
    enrolled: number;
    enrollmentPercent: number;
    weeklyTrend: number;
  };
  readinessBreakdown: {
    label: string;
    completed: number;
    total: number;
    percent: number;
  }[];
  overallHealth: HealthStatus;
}

// Programs department configuration - matches the JSON spec provided
export const programsDepartmentConfig: DepartmentConfig = {
  department: 'programs',
  title: 'Programs & Operations',
  layout: {
    sections: [
      {
        id: 'health',
        title: 'Department Health',
        type: 'health-score',
        position: 'top',
        config: {
          show_trend: true,
          trend_period_days: 7,
          breakdown_visible: true,
        },
      },
      {
        id: 'key-metrics',
        title: 'Key Metrics',
        type: 'metrics-grid',
        position: 'top',
        metrics: [
          {
            id: 'programs_ready',
            label: 'Programs Ready (>80%)',
            source: 'supabase',
            query: 'program_instances.ready_count',
            format: 'fraction',
            trend: true,
            icon: 'check-circle',
          },
          {
            id: 'avg_enrollment',
            label: 'Avg Enrollment',
            source: 'supabase',
            query: 'program_instances.avg_enrollment_pct',
            format: 'percent',
            target: 75,
            trend: true,
            icon: 'users',
          },
          {
            id: 'faculty_fill_rate',
            label: 'Faculty Fill Rate',
            source: 'supabase',
            query: 'faculty_assignments.fill_rate',
            format: 'percent',
            target: 95,
            trend: true,
            icon: 'user-check',
          },
          {
            id: 'registrations_this_week',
            label: 'Registrations (7d)',
            source: 'supabase',
            query: 'registrations.count_7d',
            format: 'number',
            trend: true,
            icon: 'clipboard-list',
          },
        ],
      },
      {
        id: 'upcoming-programs',
        title: 'Upcoming Programs (Next 90 Days)',
        type: 'program-table',
        position: 'main',
        config: {
          columns: [
            { id: 'program_name', label: 'Program', width: '35%' },
            { id: 'start_date', label: 'Date', width: '12%', format: 'date_short' },
            { id: 'location', label: 'Location', width: '15%' },
            {
              id: 'enrollment',
              label: 'Enrolled',
              width: '12%',
              format: 'fraction',
              colorCoding: { green: '>= 80%', yellow: '>= 50%', red: '< 50%' },
            },
            {
              id: 'readiness',
              label: 'Ready',
              width: '10%',
              format: 'percent',
              colorCoding: { green: '>= 80%', yellow: '>= 60%', red: '< 60%' },
            },
            { id: 'alert_icon', label: '', width: '6%', type: 'icon' },
          ],
          default_sort: 'start_date',
          max_items: 10,
          show_all_link: true,
          source: 'supabase',
          query: 'program_instances.upcoming_90_days',
        },
      },
      {
        id: 'readiness-breakdown',
        title: 'Readiness Breakdown',
        type: 'checklist-progress',
        position: 'main',
        config: {
          items: [
            { id: 'faculty_confirmed', label: 'Faculty Confirmed', source: 'supabase', query: 'readiness.faculty_confirmed' },
            { id: 'venue_confirmed', label: 'Venue Confirmed', source: 'supabase', query: 'readiness.venue_confirmed' },
            { id: 'materials_ordered', label: 'Materials Ordered', source: 'supabase', query: 'readiness.materials_ordered' },
            { id: 'materials_received', label: 'Materials Received', source: 'supabase', query: 'readiness.materials_received' },
            { id: 'shrm_approved', label: 'SHRM Approved', source: 'supabase', query: 'readiness.shrm_approved' },
            { id: 'av_ordered', label: 'AV Ordered', source: 'supabase', query: 'readiness.av_ordered' },
            { id: 'catering_confirmed', label: 'Catering Confirmed', source: 'supabase', query: 'readiness.catering_confirmed' },
            { id: 'room_block_active', label: 'Room Block Active', source: 'supabase', query: 'readiness.room_block_active' },
            { id: 'reg_page_live', label: 'Reg Page Live', source: 'supabase', query: 'readiness.reg_page_live' },
            { id: 'faculty_brief_sent', label: 'Faculty Brief Sent', source: 'supabase', query: 'readiness.faculty_brief_sent' },
          ],
          show_percentage: true,
          show_count: true,
          colorCoding: { green: '>= 90%', yellow: '>= 70%', red: '< 70%' },
        },
      },
      {
        id: 'at-risk-programs',
        title: 'At-Risk Programs',
        type: 'alert-cards',
        position: 'sidebar',
        config: {
          max_items: 5,
          severity_order: ['critical', 'warning'],
          show_action: true,
          categories: ['low_enrollment', 'low_readiness', 'faculty_gap', 'materials_late'],
          source: 'supabase',
          query: 'program_instances.at_risk',
        },
      },
      {
        id: 'faculty-gaps',
        title: 'Faculty Gaps',
        type: 'gap-list',
        position: 'sidebar',
        config: {
          max_items: 5,
          show_deadline: true,
          source: 'supabase',
          query: 'program_instances.faculty_gaps',
        },
      },
      {
        id: 'room-block-alerts',
        title: 'Room Block Alerts',
        type: 'metrics-summary',
        position: 'sidebar',
        config: {
          max_items: 5,
          metrics: [
            { id: 'property_name', label: 'Property' },
            { id: 'pickup_rate', label: 'Pickup', format: 'percent' },
            { id: 'attrition_date', label: 'Attrition', format: 'date_short' },
          ],
          source: 'supabase',
          query: 'room_blocks.at_risk',
        },
      },
      {
        id: 'upcoming-deadlines',
        title: 'Upcoming Deadlines',
        type: 'deadline-list',
        position: 'main',
        config: {
          max_items: 10,
          days_ahead: 14,
          group_by_date: true,
          categories: [
            'materials_to_printer',
            'faculty_briefs',
            'shrm_submission',
            'room_block_decision',
            'av_orders',
            'catering_final',
          ],
          source: 'supabase',
          query: 'deadlines.upcoming',
        },
      },
      {
        id: 'enrollment-summary',
        title: 'Enrollment Trends (90-day)',
        type: 'metrics-summary',
        position: 'sidebar',
        config: {
          metrics: [
            { id: 'total_seats', label: 'Total Seats', source: 'supabase', query: 'program_instances.total_capacity_90d', format: 'number' },
            { id: 'enrolled', label: 'Enrolled', source: 'supabase', query: 'program_instances.total_enrolled_90d', format: 'number' },
            { id: 'target', label: 'Target', format: 'text' },
            { id: 'weekly_trend', label: 'This Week', source: 'supabase', query: 'registrations.week_count', format: 'trend' },
          ],
        },
      },
      {
        id: 'recent-activity',
        title: 'Recent Activity',
        type: 'activity-feed',
        position: 'sidebar',
        config: {
          max_items: 10,
          categories: ['registration', 'faculty_confirmation', 'materials_shipped', 'shrm_approval', 'room_block_update'],
          show_timestamp: true,
          source: 'supabase',
          query: 'activity_log.programs',
        },
      },
      {
        id: 'alerts',
        title: 'Needs Attention',
        type: 'alert-list',
        position: 'sidebar',
        config: {
          max_items: 5,
          severity_filter: ['warning', 'critical'],
          categories: ['enrollment', 'readiness', 'faculty', 'materials', 'room_block', 'certification'],
        },
      },
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        type: 'action-buttons',
        position: 'bottom',
        config: {
          actions: [
            { id: 'run_readiness_check', label: 'Run Readiness Check', command: '/readiness-check', icon: 'refresh' },
            { id: 'view_all_programs', label: 'View All Programs', link: '/programs/list', icon: 'list' },
            { id: 'enrollment_report', label: 'Enrollment Report', command: '/registration-report', icon: 'chart-bar' },
            { id: 'faculty_status', label: 'Faculty Status', link: '/programs/faculty', icon: 'users' },
          ],
        },
      },
    ],
  },
  filters: {
    date_range: { id: 'date_range', default: '90_days', options: ['30_days', '60_days', '90_days', '180_days', 'all'] },
    program_type: { id: 'program_type', default: 'all', options: ['all', 'certificate', 'single_day', 'workshop', 'boot_camp', 'summit'] },
    format: { id: 'format', default: 'all', options: ['all', 'in_person', 'virtual', 'hybrid'] },
    status: { id: 'status', default: 'upcoming', options: ['upcoming', 'in_progress', 'completed', 'cancelled', 'all'] },
  },
  refreshIntervalSeconds: 300,
  autoRefresh: true,
  notifications: {
    enabled: true,
    criticalSound: true,
    browserNotifications: true,
  },
};
