# Dashboard Kit

A comprehensive, production-ready dashboard component library for building CEO and department-level business dashboards with Next.js 15+ and React 19+.

## Features

- **Multi-department support** - Pre-configured for Digital, Lead Intelligence, Marketing, and Programs departments
- **Health monitoring** - Visual health scores with color-coded status indicators
- **Metrics & KPIs** - Flexible metric cards with trends, targets, and formatting
- **Alerts & notifications** - Priority-based alert system with actions
- **Data tables** - Sortable, searchable, paginated tables
- **Activity feeds** - Timeline-style activity tracking
- **Platform status** - Monitor external service health
- **Dark mode** - Full dark mode support out of the box
- **TypeScript** - Fully typed with comprehensive interfaces

## Quick Start

### 1. Copy the dashboard-kit folder

Copy the entire `dashboard-kit/` folder to your Next.js project.

### 2. Install dependencies

```bash
npm install clsx tailwind-merge class-variance-authority lucide-react @radix-ui/react-progress @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-slot
```

### 3. Update your Tailwind config

Merge the contents of `dashboard-kit/styles/tailwind.config.js` with your existing config, or copy the CSS variables from `dashboard-kit/styles/globals.css`.

### 4. Import and use components

```tsx
import {
  DashboardLayout,
  HealthScore,
  MetricsGrid,
  AlertList,
} from '@/dashboard-kit/components';

export default function Dashboard() {
  return (
    <DashboardLayout
      departments={departments}
      currentDepartment="overview"
      title="Business Dashboard"
    >
      <HealthScore score={85} status="healthy" />
      <MetricsGrid metrics={metrics} />
      <AlertList alerts={alerts} />
    </DashboardLayout>
  );
}
```

## Folder Structure

```
dashboard-kit/
├── components/
│   ├── ui/                    # Base UI primitives (Button, Card, Badge, etc.)
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── progress.tsx
│   │   ├── skeleton.tsx
│   │   ├── tabs.tsx
│   │   ├── tooltip.tsx
│   │   └── index.ts
│   ├── dashboard/             # Dashboard-specific components
│   │   ├── dashboard-layout.tsx    # Main layout with sidebar
│   │   ├── department-tabs.tsx     # Department navigation
│   │   ├── status-indicator.tsx    # Health status dots/badges
│   │   ├── metric-card.tsx         # KPI cards
│   │   ├── health-score.tsx        # Department health display
│   │   ├── metrics-grid.tsx        # Grid of metrics
│   │   ├── alert-list.tsx          # Alert/warning list
│   │   ├── activity-feed.tsx       # Activity timeline
│   │   ├── quick-actions.tsx       # Action buttons
│   │   ├── data-table.tsx          # Data tables
│   │   ├── platform-status.tsx     # External service status
│   │   ├── checklist-progress.tsx  # Progress checklists
│   │   ├── deadline-list.tsx       # Upcoming deadlines
│   │   └── index.ts
│   └── index.ts
├── types/
│   ├── dashboard.ts           # Core dashboard types
│   ├── departments/
│   │   ├── digital.ts         # Digital department types & config
│   │   ├── lead-intelligence.ts
│   │   ├── marketing.ts
│   │   └── programs.ts
│   └── index.ts
├── lib/
│   └── utils.ts               # Utility functions (cn, formatters)
├── config/
│   └── colors.ts              # Color palette
├── styles/
│   ├── globals.css            # CSS variables & base styles
│   └── tailwind.config.js     # Tailwind configuration
├── examples/
│   └── ceo-dashboard.tsx      # Complete example dashboard
└── README.md
```

## Components

### Layout

#### DashboardLayout

Main layout component with sidebar navigation, header, and content area.

```tsx
<DashboardLayout
  departments={departments}
  currentDepartment="digital"
  title="Dashboard"
  userInfo={{ name: 'CEO', role: 'Chief Executive Officer' }}
  onDepartmentChange={(dept) => setDepartment(dept)}
  onRefresh={() => refetch()}
  isRefreshing={isLoading}
  notifications={3}
  theme="light"
  onThemeToggle={() => toggleTheme()}
>
  {children}
</DashboardLayout>
```

#### DepartmentTabs / DepartmentSelector

Switch between departments with optional health indicators.

```tsx
<DepartmentSelector
  departments={departments}
  currentDepartment={current}
  onDepartmentChange={onChange}
  departmentHealth={{ digital: 'healthy', programs: 'critical' }}
/>
```

### Core Components

#### MetricCard

Display a single KPI with optional trend, target, and status.

```tsx
<MetricCard
  label="Monthly Revenue"
  value={125000}
  format="currency"
  delta={12.5}
  deltaDirection="up"
  status="healthy"
  target={150000}
  icon={DollarSign}
/>
```

#### HealthScore

Visual health score with circular progress and breakdown.

```tsx
<HealthScore
  score={85}
  status="healthy"
  label="Department Health"
  trend="up"
  trendValue={5}
  breakdown={[
    { label: 'Uptime', score: 99, status: 'healthy' },
    { label: 'Performance', score: 72, status: 'warning' },
  ]}
  showBreakdown
/>
```

#### MetricsGrid

Responsive grid of metric cards.

```tsx
<MetricsGrid
  metrics={metrics}
  columns={4}
  isLoading={isLoading}
  onMetricClick={(metric) => console.log(metric)}
/>
```

### Alerts & Activity

#### AlertList

Priority-sorted list of alerts with actions.

```tsx
<AlertList
  alerts={alerts}
  title="Needs Attention"
  maxItems={5}
  onAction={(alert) => handleAlert(alert)}
  onDismiss={(id) => dismissAlert(id)}
/>
```

#### ActivityFeed

Timeline of recent activities.

```tsx
<ActivityFeed
  activities={activities}
  title="Recent Activity"
  maxItems={10}
  showTimestamp
  onItemClick={(item) => viewDetails(item)}
/>
```

### Data Display

#### DataTable

Sortable, searchable, paginated data table.

```tsx
<DataTable
  data={programs}
  columns={[
    { id: 'name', label: 'Program', width: '30%' },
    { id: 'date', label: 'Date', format: 'date_short' },
    { id: 'enrollment', label: 'Enrolled', format: 'percent', colorCoding: {...} },
  ]}
  searchable
  sortable
  pagination={{
    currentPage: 1,
    totalPages: 5,
    itemsPerPage: 10,
    totalItems: 48,
    onPageChange: setPage,
  }}
/>
```

#### PlatformStatus

Monitor external service health.

```tsx
<PlatformStatus
  platforms={[
    { id: 'apollo', name: 'apollo', displayName: 'Apollo', status: 'operational', creditsRemaining: 500, creditsTotal: 2000 },
    { id: 'phantombuster', name: 'phantombuster', displayName: 'PhantomBuster', status: 'rate_limited' },
  ]}
  onRefresh={refreshPlatforms}
/>
```

#### ChecklistProgress

Progress tracker for checklists.

```tsx
<ChecklistProgress
  items={[
    { id: '1', label: 'Faculty Confirmed', completed: true },
    { id: '2', label: 'Venue Booked', completed: true },
    { id: '3', label: 'Materials Ordered', completed: false, required: true },
  ]}
  showPercentage
  showCount
  colorCoded
/>
```

## Types

All components are fully typed. Key types:

```tsx
// Health status
type HealthStatus = 'healthy' | 'warning' | 'critical';

// Metric value
interface MetricValue {
  id: string;
  label: string;
  value: string | number;
  format: 'number' | 'percent' | 'currency' | 'text';
  delta?: number;
  deltaDirection?: 'up' | 'down' | 'neutral';
  target?: number;
  status?: HealthStatus;
  icon?: string;
}

// Alert
interface AlertItem {
  id: string;
  title: string;
  description?: string;
  severity: 'info' | 'warning' | 'critical';
  category?: string;
  timestamp?: Date;
  actionLabel?: string;
  actionCommand?: string;
}

// Department config
interface DepartmentConfig {
  department: string;
  title?: string;
  keyMetrics?: MetricDefinition[];
  quickActions?: QuickAction[];
  statusIndicators?: StatusIndicatorConfig;
  layout?: { sections: DashboardSection[] };
  refreshIntervalSeconds?: number;
}
```

## Customization

### Colors

Update `config/colors.ts` to match your brand:

```ts
export const colors = {
  primary: {
    main: '#2563eb', // Your primary color
    // ...
  },
  departments: {
    digital: '#3b82f6',
    marketing: '#ec4899',
    // Add your departments
  },
};
```

### Department Configs

Each department has a pre-built configuration in `types/departments/`. Customize these for your specific needs:

```ts
// types/departments/your-department.ts
export const yourDepartmentConfig: DepartmentConfig = {
  department: 'your-dept',
  title: 'Your Department',
  keyMetrics: [
    {
      id: 'custom_metric',
      label: 'Custom Metric',
      source: 'supabase',
      format: 'number',
      // ...
    },
  ],
  // ...
};
```

## What You'll Need to Add

This kit provides the **UI layer**. You'll need to add:

1. **Authentication** - NextAuth.js, Clerk, or your preferred solution
2. **Database** - Prisma, Drizzle, Supabase, or similar
3. **Data Fetching** - TanStack Query, SWR, or server actions
4. **Real-time Updates** - Pusher, Ably, or Supabase Realtime
5. **API Routes** - For your specific data sources

## Example: Connecting to Supabase

```tsx
import { createClient } from '@supabase/supabase-js';
import { MetricsGrid } from '@/dashboard-kit/components';

export default async function Dashboard() {
  const supabase = createClient(url, key);

  const { data: metrics } = await supabase
    .from('metrics')
    .select('*')
    .eq('department', 'programs');

  return <MetricsGrid metrics={formatMetrics(metrics)} />;
}
```

## License

MIT - Use freely in your projects.
