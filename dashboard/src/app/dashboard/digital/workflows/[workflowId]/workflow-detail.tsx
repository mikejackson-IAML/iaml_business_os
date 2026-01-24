'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  FileText,
  RefreshCw,
  Calendar,
  User,
  Server,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type {
  WorkflowDetail as WorkflowDetailType,
  WorkflowExecution,
  WorkflowErrorSummary,
} from '@/lib/api/workflow-queries';
import {
  getWorkflowHealthStatus,
  getCriticalityColor,
  getCategoryInfo,
  formatDuration,
  formatTimeAgo,
  getStatusColor,
} from '@/lib/api/workflow-queries';

interface WorkflowDetailProps {
  workflow: WorkflowDetailType;
  executions: WorkflowExecution[];
  errorSummary: WorkflowErrorSummary[];
}

function StatusBadge({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  const config = {
    healthy: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-800 dark:text-emerald-400',
      icon: CheckCircle,
      label: 'Healthy',
    },
    warning: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-800 dark:text-amber-400',
      icon: AlertTriangle,
      label: 'Warning',
    },
    critical: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-400',
      icon: XCircle,
      label: 'Critical',
    },
  };

  const { bg, text, icon: Icon, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}

function ExecutionStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'running':
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

export function WorkflowDetailContent({ workflow, executions, errorSummary }: WorkflowDetailProps) {
  const [activeTab, setActiveTab] = useState<'executions' | 'errors'>('executions');

  const status = getWorkflowHealthStatus(workflow.success_rate_7d, workflow.unresolved_errors);
  const categoryInfo = getCategoryInfo(workflow.category);

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
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/dashboard/digital/workflows"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Workflows</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-display-sm text-foreground">{workflow.workflow_name}</h1>
                <StatusBadge status={status} />
              </div>
              <p className="text-muted-foreground max-w-2xl">
                {workflow.description || 'No description provided'}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <span className={`text-xs px-2 py-0.5 rounded ${categoryInfo.color}`}>
                  {categoryInfo.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${getCriticalityColor(workflow.criticality)}`}>
                  {workflow.criticality.charAt(0).toUpperCase() + workflow.criticality.slice(1)} Priority
                </span>
                {!workflow.is_active && (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    Inactive
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {workflow.documentation_url && (
                <a
                  href={workflow.documentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <User className="h-4 w-4" />
                <span className="text-sm">Owner</span>
              </div>
              <div className="font-medium">{workflow.owner || 'Unassigned'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Trigger</span>
              </div>
              <div className="font-medium capitalize">{workflow.trigger_type || 'Unknown'}</div>
              {workflow.schedule_description && (
                <div className="text-xs text-muted-foreground">{workflow.schedule_description}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Server className="h-4 w-4" />
                <span className="text-sm">Department</span>
              </div>
              <div className="font-medium capitalize">{workflow.department || 'Unknown'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Created</span>
              </div>
              <div className="font-medium">
                {workflow.created_at
                  ? new Date(workflow.created_at).toLocaleDateString()
                  : 'Unknown'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services */}
        {workflow.services && workflow.services.length > 0 && (
          <div className="mb-6">
            <span className="text-sm text-muted-foreground mr-2">Services:</span>
            {workflow.services.map((service) => (
              <span
                key={service}
                className="inline-flex items-center px-2 py-1 mr-2 text-xs rounded bg-muted text-foreground"
              >
                {service}
              </span>
            ))}
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Success Rate (7d)"
            value={workflow.success_rate_7d !== null ? workflow.success_rate_7d.toFixed(1) : '-'}
            format={workflow.success_rate_7d !== null ? 'percent' : undefined}
            icon={CheckCircle}
            status={
              workflow.success_rate_7d === null
                ? 'warning'
                : workflow.success_rate_7d >= 95
                ? 'healthy'
                : workflow.success_rate_7d >= 80
                ? 'warning'
                : 'critical'
            }
            description={`${workflow.runs_7d} runs`}
          />
          <MetricCard
            label="Total Runs"
            value={workflow.total_runs}
            icon={Activity}
            status="healthy"
            description="All time"
          />
          <MetricCard
            label="Avg Duration"
            value={workflow.avg_duration_ms ? formatDuration(workflow.avg_duration_ms) : '-'}
            icon={Clock}
            status="healthy"
            description="Last 7 days"
          />
          <MetricCard
            label="Unresolved Errors"
            value={workflow.unresolved_errors}
            icon={XCircle}
            status={workflow.unresolved_errors === 0 ? 'healthy' : 'critical'}
            description={`${workflow.errors_7d} errors this week`}
          />
        </div>

        {/* Last Run Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Last Run</div>
              <div className="font-medium">{formatTimeAgo(workflow.last_run)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Last Success</div>
              <div className="font-medium text-emerald-600">{formatTimeAgo(workflow.last_success)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Last Error</div>
              <div className="font-medium text-red-600">{formatTimeAgo(workflow.last_error)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-4 border-b border-border">
          <button
            onClick={() => setActiveTab('executions')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'executions'
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Executions ({executions.length})
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'errors'
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Error Summary ({errorSummary.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'executions' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-md flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recent Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No executions recorded</p>
                  <p className="text-sm">Executions will appear here after the workflow runs</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground border-b border-border">
                        <th className="pb-3 pr-4 w-10">Status</th>
                        <th className="pb-3 px-4">Started</th>
                        <th className="pb-3 px-4">Duration</th>
                        <th className="pb-3 px-4">Trigger</th>
                        <th className="pb-3 px-4">Error</th>
                        <th className="pb-3 px-4">Resolution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {executions.map((exec) => (
                        <tr
                          key={exec.id}
                          className={`border-b border-border last:border-0 ${
                            exec.status === 'error' && !exec.resolved
                              ? 'bg-red-50 dark:bg-red-900/10'
                              : ''
                          }`}
                        >
                          <td className="py-3 pr-4">
                            <ExecutionStatusIcon status={exec.status} />
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">{formatTimeAgo(exec.started_at)}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(exec.started_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {formatDuration(exec.duration_ms)}
                          </td>
                          <td className="py-3 px-4 text-sm capitalize">
                            {exec.trigger_type || '-'}
                          </td>
                          <td className="py-3 px-4">
                            {exec.error_message ? (
                              <div>
                                {exec.error_node && (
                                  <div className="text-xs text-amber-600 mb-1">
                                    [{exec.error_node}]
                                  </div>
                                )}
                                <div className="text-sm text-red-600 line-clamp-2">
                                  {exec.error_message}
                                </div>
                                {exec.has_known_fix && (
                                  <div className="text-xs text-emerald-600 mt-1">
                                    Known fix available
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {exec.status === 'error' && (
                              exec.resolved ? (
                                <div>
                                  <span className="text-xs text-emerald-600">Resolved</span>
                                  {exec.resolution_notes && (
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {exec.resolution_notes}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-red-600">Unresolved</span>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'errors' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-md flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Error Summary by Node
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errorSummary.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-emerald-500" />
                  <p className="text-lg">No errors recorded</p>
                  <p className="text-sm">This workflow has no recorded errors</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {errorSummary.map((error, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg ${
                        error.unresolved_count > 0
                          ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium">
                            {error.error_node || 'Unknown Node'}
                          </span>
                          {error.error_node_type && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({error.error_node_type})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {error.error_count} total
                          </span>
                          {error.unresolved_count > 0 && (
                            <span className="text-sm text-red-600 font-medium">
                              {error.unresolved_count} unresolved
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Last: {formatTimeAgo(error.last_occurrence)}
                      </div>
                      {error.sample_message && (
                        <div className="text-sm text-red-600 bg-red-100 dark:bg-red-900/20 p-2 rounded line-clamp-2">
                          {error.sample_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
