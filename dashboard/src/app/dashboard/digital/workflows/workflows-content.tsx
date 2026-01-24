'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  ExternalLink,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { WorkflowRegistry } from '@/lib/api/workflow-queries';
import {
  getWorkflowHealthStatus,
  getCriticalityColor,
  getCategoryInfo,
  formatDuration,
  formatTimeAgo,
} from '@/lib/api/workflow-queries';

interface WorkflowsContentProps {
  workflows: WorkflowRegistry[];
  stats: {
    totalWorkflows: number;
    activeWorkflows: number;
    totalErrorsToday: number;
    unresolvedErrors: number;
    overallSuccessRate: number;
  };
}

function StatusIndicator({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  const colors = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  };

  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${colors[status]}`}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
}

export function WorkflowsContent({ workflows, stats }: WorkflowsContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Extract unique departments and categories from workflows
  const departments = useMemo(() => {
    const depts = new Set<string>();
    workflows.forEach((w) => {
      if (w.department) depts.add(w.department);
    });
    return Array.from(depts).sort();
  }, [workflows]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    workflows.forEach((w) => {
      if (w.category) cats.add(w.category);
    });
    return Array.from(cats).sort();
  }, [workflows]);

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !w.workflow_name.toLowerCase().includes(query) &&
          !(w.description || '').toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Department filter
      if (departmentFilter !== 'all' && w.department !== departmentFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && w.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const status = getWorkflowHealthStatus(w.success_rate_7d, w.unresolved_errors);
        if (status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [workflows, searchQuery, departmentFilter, categoryFilter, statusFilter]);

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
              <span className="badge-live">LIVE</span>
              <h1 className="text-display-sm text-foreground">Workflow Health</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
          <p className="text-muted-foreground">
            Monitor and manage all n8n workflow automations
          </p>
          <div className="mt-2 flex items-center gap-4">
            <Link
              href="/dashboard/digital"
              className="text-sm text-accent-primary hover:underline"
            >
              &larr; Back to Digital Dashboard
            </Link>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <MetricCard
            label="Total Workflows"
            value={stats.totalWorkflows}
            icon={Activity}
            status="healthy"
          />
          <MetricCard
            label="Active"
            value={stats.activeWorkflows}
            icon={CheckCircle}
            status="healthy"
          />
          <MetricCard
            label="Success Rate (7d)"
            value={stats.overallSuccessRate.toFixed(1)}
            format="percent"
            icon={RefreshCw}
            status={
              stats.overallSuccessRate >= 95
                ? 'healthy'
                : stats.overallSuccessRate >= 80
                ? 'warning'
                : 'critical'
            }
          />
          <MetricCard
            label="Errors Today"
            value={stats.totalErrorsToday}
            icon={AlertTriangle}
            status={stats.totalErrorsToday === 0 ? 'healthy' : 'critical'}
          />
          <MetricCard
            label="Unresolved"
            value={stats.unresolvedErrors}
            icon={XCircle}
            status={stats.unresolvedErrors === 0 ? 'healthy' : 'critical'}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept.charAt(0).toUpperCase() + dept.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {getCategoryInfo(cat).label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Workflow Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-heading-md flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Workflows ({filteredWorkflows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredWorkflows.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No workflows found</p>
                <p className="text-sm">
                  {workflows.length === 0
                    ? 'Register workflows to see them here'
                    : 'Try adjusting your filters'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border">
                      <th className="pb-3 pr-4 w-10">Status</th>
                      <th className="pb-3 px-4">Workflow</th>
                      <th className="pb-3 px-4">Description</th>
                      <th className="pb-3 px-4">Department</th>
                      <th className="pb-3 px-4 text-right">Success (7d)</th>
                      <th className="pb-3 px-4 text-right">Last Run</th>
                      <th className="pb-3 px-4 text-center">Errors</th>
                      <th className="pb-3 pl-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkflows.map((workflow) => {
                      const status = getWorkflowHealthStatus(
                        workflow.success_rate_7d,
                        workflow.unresolved_errors
                      );
                      const categoryInfo = getCategoryInfo(workflow.category);

                      return (
                        <tr
                          key={workflow.workflow_id}
                          className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 pr-4">
                            <StatusIndicator status={status} />
                          </td>
                          <td className="py-4 px-4">
                            <Link
                              href={`/dashboard/digital/workflows/${encodeURIComponent(workflow.workflow_id)}`}
                              className="font-medium text-foreground hover:text-accent-primary transition-colors"
                            >
                              {workflow.workflow_name}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${categoryInfo.color}`}>
                                {categoryInfo.label}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${getCriticalityColor(
                                  workflow.criticality
                                )}`}
                              >
                                {workflow.criticality}
                              </span>
                              {!workflow.is_active && (
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-muted-foreground line-clamp-2">
                              {workflow.description || '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm capitalize">
                              {workflow.department || '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span
                              className={`font-medium ${
                                workflow.success_rate_7d === null
                                  ? 'text-muted-foreground'
                                  : workflow.success_rate_7d >= 95
                                  ? 'text-emerald-600'
                                  : workflow.success_rate_7d >= 80
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {workflow.success_rate_7d !== null
                                ? `${workflow.success_rate_7d}%`
                                : '-'}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {workflow.runs_7d} runs
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-sm">
                              {formatTimeAgo(workflow.last_run)}
                            </span>
                            {workflow.avg_duration_ms && (
                              <div className="text-xs text-muted-foreground">
                                ~{formatDuration(workflow.avg_duration_ms)}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {workflow.unresolved_errors > 0 ? (
                              <span className="inline-flex items-center gap-1 text-sm text-red-600">
                                <XCircle className="h-4 w-4" />
                                {workflow.unresolved_errors}
                              </span>
                            ) : workflow.errors_7d > 0 ? (
                              <span className="text-sm text-muted-foreground">
                                {workflow.errors_7d} resolved
                              </span>
                            ) : (
                              <span className="text-sm text-emerald-600">
                                <CheckCircle className="h-4 w-4 inline" />
                              </span>
                            )}
                          </td>
                          <td className="py-4 pl-4">
                            <Link
                              href={`/dashboard/digital/workflows/${encodeURIComponent(workflow.workflow_id)}`}
                              className="text-muted-foreground hover:text-accent-primary transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
