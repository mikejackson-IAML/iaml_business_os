// Core Dashboard Types
// These types define the structure for the entire dashboard system

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export type TrendDirection = 'up' | 'down' | 'neutral';

export type MetricFormat =
  | 'number'
  | 'percent'
  | 'currency'
  | 'text'
  | 'date'
  | 'date_short'
  | 'fraction'
  | 'trend';

export type DataSource =
  | 'supabase'
  | 'smartlead'
  | 'phantombuster'
  | 'apollo'
  | 'heyreach'
  | 'vercel'
  | 'manual'
  | 'api';

// Base metric definition
export interface MetricDefinition {
  id: string;
  label: string;
  description?: string;
  source: DataSource;
  query?: string;
  format: MetricFormat;
  target?: number;
  trend?: boolean;
  icon?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
}

// Runtime metric with actual value
export interface MetricValue extends MetricDefinition {
  value: number | string;
  previousValue?: number | string;
  delta?: number;
  deltaDirection?: TrendDirection;
  status?: HealthStatus;
  updatedAt?: Date;
}

// Summary card for KPIs
export interface SummaryCardData {
  id: string;
  label: string;
  value: string | number;
  delta?: string;
  deltaValue?: number;
  trending?: TrendDirection;
  icon?: string;
  status?: HealthStatus;
  target?: number;
  format?: MetricFormat;
}

// Alert/notification item
export interface AlertItem {
  id: string;
  title: string;
  description?: string;
  severity: 'info' | 'warning' | 'critical';
  category?: string;
  timestamp?: Date;
  actionLabel?: string;
  actionCommand?: string;
  actionLink?: string;
  dismissable?: boolean;
}

// Quick action button
export interface QuickAction {
  id: string;
  name: string;
  label?: string;
  command?: string;
  link?: string;
  description?: string;
  icon?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
}

// Activity feed item
export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: Date;
  user?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

// Table column definition
export interface TableColumn {
  id: string;
  label: string;
  width?: string;
  format?: MetricFormat;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'status' | 'icon' | 'progress';
  colorCoding?: {
    green?: string;
    yellow?: string;
    red?: string;
  };
}

// Section layout configuration
export interface DashboardSection {
  id: string;
  title: string;
  type:
    | 'health-score'
    | 'metrics-grid'
    | 'metrics-summary'
    | 'alert-list'
    | 'alert-cards'
    | 'action-buttons'
    | 'activity-feed'
    | 'program-table'
    | 'campaign-list'
    | 'platform-status'
    | 'checklist-progress'
    | 'deadline-list'
    | 'gap-list'
    | 'recommendation-list'
    | 'custom';
  position: 'top' | 'main' | 'sidebar' | 'bottom';
  description?: string;
  metrics?: MetricDefinition[];
  config?: Record<string, unknown>;
}

// Status indicator configuration
export interface StatusIndicatorConfig {
  healthy: {
    color: string;
    conditions: string[];
  };
  warning: {
    color: string;
    conditions: string[];
  };
  critical: {
    color: string;
    conditions: string[];
  };
}

// Filter definition
export interface FilterConfig {
  id: string;
  label?: string;
  default: string;
  options: string[];
}

// Department configuration
export interface DepartmentConfig {
  department: string;
  title?: string;
  summaryPrompt?: string;
  keyMetrics?: MetricDefinition[];
  quickActions?: QuickAction[];
  statusIndicators?: StatusIndicatorConfig;
  commonQuestions?: string[];
  dashboardSections?: DashboardSection[];
  layout?: {
    sections: DashboardSection[];
  };
  filters?: Record<string, FilterConfig>;
  refreshIntervalSeconds?: number;
  autoRefresh?: boolean;
  notifications?: {
    enabled: boolean;
    criticalSound?: boolean;
    browserNotifications?: boolean;
  };
}

// Dashboard state
export interface DashboardState {
  isLoading: boolean;
  lastRefresh?: Date;
  activeFilters: Record<string, string>;
  selectedDepartment?: string;
  error?: string;
}

// Navigation item for sidebar
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
  children?: NavItem[];
  active?: boolean;
}

// Dashboard layout props
export interface DashboardLayoutProps {
  departments: DepartmentConfig[];
  currentDepartment?: string;
  navItems?: NavItem[];
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  onDepartmentChange?: (department: string) => void;
  onRefresh?: () => void;
}
