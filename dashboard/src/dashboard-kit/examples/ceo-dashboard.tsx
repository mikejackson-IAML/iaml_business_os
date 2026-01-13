'use client';

/**
 * Example CEO Dashboard
 *
 * This is a complete example showing how to use the dashboard-kit components
 * to build a CEO-level business overview dashboard with multiple departments.
 *
 * Copy this file to your Next.js app/dashboard/page.tsx and customize as needed.
 */

import * as React from 'react';
import {
  DashboardLayout,
  DepartmentSelector,
  HealthScore,
  MetricsGrid,
  AlertList,
  ActivityFeed,
  QuickActions,
  DataTable,
  PlatformStatus,
  ChecklistProgress,
  DeadlineList,
} from '../components';
import type {
  MetricValue,
  AlertItem,
  ActivityItem,
  QuickAction,
  HealthStatus,
  DepartmentConfig,
} from '../types';
import {
  digitalDepartmentConfig,
  leadIntelligenceDepartmentConfig,
  marketingDepartmentConfig,
  programsDepartmentConfig,
} from '../types';

// All department configurations
const departments: DepartmentConfig[] = [
  digitalDepartmentConfig,
  leadIntelligenceDepartmentConfig,
  marketingDepartmentConfig,
  programsDepartmentConfig,
];

// Mock data - replace with your actual data fetching
const mockDepartmentHealth: Record<string, HealthStatus> = {
  digital: 'healthy',
  'lead-intelligence': 'warning',
  marketing: 'healthy',
  programs: 'critical',
};

const mockMetrics: MetricValue[] = [
  {
    id: 'revenue',
    label: 'Monthly Revenue',
    value: 125000,
    format: 'currency',
    delta: 12.5,
    deltaDirection: 'up',
    status: 'healthy',
    icon: 'dollar-sign',
    source: 'manual',
  },
  {
    id: 'customers',
    label: 'Active Customers',
    value: 1284,
    format: 'number',
    delta: 8.2,
    deltaDirection: 'up',
    status: 'healthy',
    icon: 'users',
    source: 'supabase',
  },
  {
    id: 'churn',
    label: 'Churn Rate',
    value: 2.4,
    format: 'percent',
    delta: -0.3,
    deltaDirection: 'down',
    status: 'healthy',
    target: 3,
    icon: 'trending-down',
    source: 'supabase',
  },
  {
    id: 'nps',
    label: 'NPS Score',
    value: 72,
    format: 'number',
    delta: 5,
    deltaDirection: 'up',
    status: 'healthy',
    target: 70,
    icon: 'star',
    source: 'manual',
  },
];

const mockAlerts: AlertItem[] = [
  {
    id: '1',
    title: 'Programs: Low enrollment for Denver workshop',
    description: 'Only 45% enrolled with 14 days to go',
    severity: 'critical',
    category: 'enrollment',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    actionLabel: 'View Program',
    actionCommand: '/programs/denver-workshop',
  },
  {
    id: '2',
    title: 'Lead Intel: Apollo credits running low',
    description: 'Only 15% credits remaining',
    severity: 'warning',
    category: 'capacity',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    actionLabel: 'Check Capacity',
    actionCommand: '/capacity-report',
  },
  {
    id: '3',
    title: 'Digital: Performance score dropped',
    description: 'Lighthouse score fell to 68',
    severity: 'warning',
    category: 'performance',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    actionLabel: 'Optimize',
    actionCommand: '/speed-optimize',
  },
];

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'registration',
    title: 'New registration',
    description: 'John Smith registered for Chicago Leadership Summit',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    user: 'System',
  },
  {
    id: '2',
    type: 'faculty_confirmation',
    title: 'Faculty confirmed',
    description: 'Dr. Jane Doe confirmed for NYC workshop',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    user: 'Sarah Johnson',
  },
  {
    id: '3',
    type: 'materials_shipped',
    title: 'Materials shipped',
    description: 'Course materials sent to Atlanta venue',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    user: 'Ops Team',
  },
  {
    id: '4',
    type: 'email_sent',
    title: 'Campaign launched',
    description: 'Q1 newsletter sent to 2,450 subscribers',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    user: 'Marketing',
  },
];

const mockQuickActions: QuickAction[] = [
  {
    id: 'refresh',
    name: 'Refresh All',
    icon: 'refresh-cw',
    command: '/refresh-all',
    variant: 'default',
  },
  {
    id: 'report',
    name: 'Generate Report',
    icon: 'file-text',
    command: '/weekly-report',
    variant: 'outline',
  },
  {
    id: 'alerts',
    name: 'View All Alerts',
    icon: 'bell',
    link: '/alerts',
    variant: 'outline',
  },
];

// The main CEO Dashboard component
export function CEODashboard() {
  const [currentDepartment, setCurrentDepartment] = React.useState<string>('overview');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const handleAction = (action: QuickAction) => {
    console.log('Action triggered:', action);
    // Handle command or link navigation
    if (action.command) {
      // Execute command
      console.log('Executing command:', action.command);
    } else if (action.link) {
      // Navigate to link
      window.location.href = action.link;
    }
  };

  const handleAlertAction = (alert: AlertItem) => {
    console.log('Alert action:', alert);
    if (alert.actionCommand) {
      console.log('Executing:', alert.actionCommand);
    }
  };

  return (
    <DashboardLayout
      departments={departments}
      currentDepartment={currentDepartment}
      title="Business Dashboard"
      userInfo={{
        name: 'CEO',
        role: 'Chief Executive Officer',
      }}
      onDepartmentChange={setCurrentDepartment}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
      lastUpdated={new Date()}
      notifications={mockAlerts.filter((a) => a.severity === 'critical').length}
      theme={theme}
      onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      {/* Department selector pills */}
      <div className="mb-6">
        <DepartmentSelector
          departments={[
            { department: 'overview', title: 'Overview' },
            ...departments,
          ]}
          currentDepartment={currentDepartment}
          onDepartmentChange={setCurrentDepartment}
          departmentHealth={mockDepartmentHealth}
        />
      </div>

      {/* Content based on selected department */}
      {currentDepartment === 'overview' ? (
        <OverviewDashboard
          metrics={mockMetrics}
          alerts={mockAlerts}
          activities={mockActivities}
          quickActions={mockQuickActions}
          departmentHealth={mockDepartmentHealth}
          onAction={handleAction}
          onAlertAction={handleAlertAction}
        />
      ) : (
        <DepartmentDashboard
          department={currentDepartment}
          config={departments.find((d) => d.department === currentDepartment)}
        />
      )}
    </DashboardLayout>
  );
}

// Overview dashboard showing cross-department summary
interface OverviewDashboardProps {
  metrics: MetricValue[];
  alerts: AlertItem[];
  activities: ActivityItem[];
  quickActions: QuickAction[];
  departmentHealth: Record<string, HealthStatus>;
  onAction: (action: QuickAction) => void;
  onAlertAction: (alert: AlertItem) => void;
}

function OverviewDashboard({
  metrics,
  alerts,
  activities,
  quickActions,
  departmentHealth,
  onAction,
  onAlertAction,
}: OverviewDashboardProps) {
  // Calculate overall health
  const healthValues = Object.values(departmentHealth);
  const criticalCount = healthValues.filter((h) => h === 'critical').length;
  const warningCount = healthValues.filter((h) => h === 'warning').length;

  let overallStatus: HealthStatus = 'healthy';
  let overallScore = 95;

  if (criticalCount > 0) {
    overallStatus = 'critical';
    overallScore = 45;
  } else if (warningCount > 0) {
    overallStatus = 'warning';
    overallScore = 72;
  }

  return (
    <div className="space-y-6">
      {/* Top row: Health + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HealthScore
          score={overallScore}
          status={overallStatus}
          label="Business Health"
          description="Aggregate health across all departments"
          trend={criticalCount === 0 ? 'up' : 'down'}
          trendValue={criticalCount === 0 ? 3 : -8}
          breakdown={Object.entries(departmentHealth).map(([dept, status]) => ({
            label: dept.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            score: status === 'healthy' ? 95 : status === 'warning' ? 72 : 45,
            status,
          }))}
          showBreakdown
          className="lg:col-span-2"
        />
        <QuickActions
          actions={quickActions}
          onAction={onAction}
          layout="vertical"
        />
      </div>

      {/* Key metrics */}
      <MetricsGrid metrics={metrics} columns={4} />

      {/* Bottom row: Alerts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertList
          alerts={alerts}
          title="Needs Attention"
          maxItems={5}
          onAction={onAlertAction}
        />
        <ActivityFeed
          activities={activities}
          title="Recent Activity"
          maxItems={5}
        />
      </div>
    </div>
  );
}

// Department-specific dashboard
interface DepartmentDashboardProps {
  department: string;
  config?: DepartmentConfig;
}

function DepartmentDashboard({ department, config }: DepartmentDashboardProps) {
  if (!config) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Department not found
      </div>
    );
  }

  // This is where you would render the department-specific sections
  // based on config.layout.sections

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium">
        {config.title || config.department} Dashboard
      </div>
      <p className="text-muted-foreground">
        {config.summaryPrompt || 'Department overview and metrics'}
      </p>

      {/* Render department-specific content based on config */}
      {config.keyMetrics && (
        <MetricsGrid
          metrics={config.keyMetrics.map((m) => ({
            ...m,
            value: Math.floor(Math.random() * 100), // Replace with real data
            deltaDirection: 'up' as const,
          }))}
          columns={4}
        />
      )}

      {config.quickActions && (
        <QuickActions
          actions={config.quickActions}
          onAction={(action) => console.log('Action:', action)}
          layout="horizontal"
        />
      )}
    </div>
  );
}

export default CEODashboard;
