'use client';

import { useState } from 'react';
import type {
  SpeedAuditDashboardData,
  SpeedAuditItem,
} from '@/lib/api/speed-audit-queries';

// ==================== Props ====================

interface SpeedAuditContentProps {
  data: SpeedAuditDashboardData;
}

// ==================== Helper Functions ====================

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400';
  if (score >= 90) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBgColor(score: number | null): string {
  if (score === null) return 'bg-gray-100';
  if (score >= 90) return 'bg-green-100';
  if (score >= 50) return 'bg-yellow-100';
  return 'bg-red-100';
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-yellow-100 text-yellow-800';
    case 'medium':
      return 'bg-blue-100 text-blue-800';
    case 'low':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatDelta(delta: number | null): string {
  if (delta === null) return '-';
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

function getDeltaColor(delta: number | null, inverted: boolean = false): string {
  if (delta === null) return 'text-gray-400';
  const isPositive = inverted ? delta < 0 : delta > 0;
  if (isPositive) return 'text-green-600';
  if (delta === 0) return 'text-gray-600';
  return 'text-red-600';
}

// ==================== Components ====================

function StatCard({
  label,
  value,
  delta,
  deltaInverted = false,
  suffix = '',
}: {
  label: string;
  value: number | string | null;
  delta?: number | null;
  deltaInverted?: boolean;
  suffix?: string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${typeof value === 'number' ? getScoreColor(value) : ''}`}>
          {value ?? '-'}
          {suffix}
        </span>
        {delta !== undefined && delta !== null && (
          <span className={`text-sm ${getDeltaColor(delta, deltaInverted)}`}>
            {formatDelta(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

function ScoreGauge({ score, label }: { score: number | null; label: string }) {
  const percentage = score ?? 0;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            cx="48"
            cy="48"
            r="36"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="48"
            cy="48"
            r="36"
            fill="none"
            stroke={score !== null && score >= 90 ? '#22c55e' : score !== null && score >= 50 ? '#eab308' : '#ef4444'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${getScoreColor(score)}`}>
            {score ?? '-'}
          </span>
        </div>
      </div>
      <span className="text-sm text-gray-500 mt-2">{label}</span>
    </div>
  );
}

function TrendChart({ data }: { data: SpeedAuditDashboardData['trends'] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No trend data available
      </div>
    );
  }

  // Simple line chart visualization
  const maxMobile = Math.max(...data.map(d => d.avg_pagespeed_mobile ?? 0), 100);
  const maxDesktop = Math.max(...data.map(d => d.avg_pagespeed_desktop ?? 0), 100);
  const maxScore = Math.max(maxMobile, maxDesktop);

  return (
    <div className="relative h-64">
      <div className="absolute inset-0 flex items-end justify-between gap-2">
        {data.map((point, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-1 items-end" style={{ height: '200px' }}>
              {/* Mobile bar */}
              <div
                className="flex-1 bg-blue-500 rounded-t transition-all duration-300"
                style={{
                  height: `${((point.avg_pagespeed_mobile ?? 0) / maxScore) * 100}%`,
                }}
                title={`Mobile: ${point.avg_pagespeed_mobile}`}
              />
              {/* Desktop bar */}
              <div
                className="flex-1 bg-green-500 rounded-t transition-all duration-300"
                style={{
                  height: `${((point.avg_pagespeed_desktop ?? 0) / maxScore) * 100}%`,
                }}
                title={`Desktop: ${point.avg_pagespeed_desktop}`}
              />
            </div>
            <span className="text-xs text-gray-400 truncate w-full text-center">
              {point.audit_week.split('-W')[1] ? `W${point.audit_week.split('-W')[1]}` : point.audit_week}
            </span>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="absolute top-0 right-0 flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span>Mobile</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Desktop</span>
        </div>
      </div>
    </div>
  );
}

function AuditItemRow({
  item,
  selected,
  onToggle,
}: {
  item: SpeedAuditItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          disabled={item.approved || item.executed}
          className="rounded border-gray-300"
        />
      </td>
      <td className="py-3 px-4 font-mono text-sm">{item.item_code}</td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(item.severity)}`}>
          {item.severity}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="font-medium">{item.title}</div>
        {item.page_url && (
          <div className="text-xs text-gray-400 truncate max-w-xs">
            {item.page_url}
          </div>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        <span className={item.estimated_impact === 'High' ? 'text-red-600 font-medium' : ''}>
          {item.estimated_impact || '-'}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        {item.estimated_savings_ms ? `${item.estimated_savings_ms}ms` : '-'}
      </td>
      <td className="py-3 px-4 text-center">
        {item.approved ? (
          <span className="text-green-600">Approved</span>
        ) : item.executed ? (
          <span className="text-blue-600">Executed</span>
        ) : item.validated ? (
          <span className="text-purple-600">Validated</span>
        ) : (
          <span className="text-gray-400">Pending</span>
        )}
      </td>
    </tr>
  );
}

function RecentAuditsTable({ audits }: { audits: SpeedAuditDashboardData['recentAudits'] }) {
  if (audits.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No audits recorded yet
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-sm text-gray-500 border-b">
          <th className="py-2 px-4">Week</th>
          <th className="py-2 px-4">Mobile</th>
          <th className="py-2 px-4">Desktop</th>
          <th className="py-2 px-4">Issues</th>
          <th className="py-2 px-4">Status</th>
          <th className="py-2 px-4">Progress</th>
        </tr>
      </thead>
      <tbody>
        {audits.map((audit) => (
          <tr key={audit.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4">
              <div className="font-medium">{audit.audit_week}</div>
              <div className="text-xs text-gray-400">{audit.audit_date}</div>
            </td>
            <td className="py-3 px-4">
              <span className={getScoreColor(audit.avg_pagespeed_mobile)}>
                {audit.avg_pagespeed_mobile ?? '-'}
              </span>
              {audit.mobile_score_delta !== null && (
                <span className={`ml-1 text-xs ${getDeltaColor(audit.mobile_score_delta)}`}>
                  ({formatDelta(audit.mobile_score_delta)})
                </span>
              )}
            </td>
            <td className="py-3 px-4">
              <span className={getScoreColor(audit.avg_pagespeed_desktop)}>
                {audit.avg_pagespeed_desktop ?? '-'}
              </span>
              {audit.desktop_score_delta !== null && (
                <span className={`ml-1 text-xs ${getDeltaColor(audit.desktop_score_delta)}`}>
                  ({formatDelta(audit.desktop_score_delta)})
                </span>
              )}
            </td>
            <td className="py-3 px-4">
              <div className="flex gap-1 text-xs">
                {audit.critical_issues > 0 && (
                  <span className="px-1 bg-red-100 text-red-800 rounded">{audit.critical_issues}</span>
                )}
                {audit.high_issues > 0 && (
                  <span className="px-1 bg-yellow-100 text-yellow-800 rounded">{audit.high_issues}</span>
                )}
                {audit.medium_issues > 0 && (
                  <span className="px-1 bg-blue-100 text-blue-800 rounded">{audit.medium_issues}</span>
                )}
                {audit.low_issues > 0 && (
                  <span className="px-1 bg-gray-100 text-gray-800 rounded">{audit.low_issues}</span>
                )}
              </div>
            </td>
            <td className="py-3 px-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                audit.status === 'completed' ? 'bg-green-100 text-green-800' :
                audit.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                audit.status === 'deferred' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {audit.status}
              </span>
            </td>
            <td className="py-3 px-4">
              <div className="text-xs">
                {audit.items_executed}/{audit.items_approved} executed
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ==================== Main Component ====================

export function SpeedAuditContent({ data }: SpeedAuditContentProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const { currentAudit, currentItems, recentAudits, trends, stats } = data;

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAllPending = () => {
    const pending = currentItems.filter(i => !i.approved && !i.executed);
    setSelectedItems(new Set(pending.map(i => i.id)));
  };

  const selectBySeverity = (severity: string) => {
    const matching = currentItems.filter(i => !i.approved && !i.executed && i.severity === severity);
    setSelectedItems(new Set(matching.map(i => i.id)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Speed Audit</h1>
          <p className="text-gray-500">Weekly performance optimization tracking</p>
        </div>
        <div className="flex gap-2">
          {currentAudit?.status === 'pending' && selectedItems.size > 0 && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Approve Selected ({selectedItems.size})
            </button>
          )}
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Run Manual Audit
          </button>
        </div>
      </div>

      {/* Current Audit Summary */}
      {currentAudit && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold">Current Audit</h2>
              <p className="text-sm text-gray-500">
                Week of {currentAudit.audit_date} ({currentAudit.audit_week})
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentAudit.status === 'completed' ? 'bg-green-100 text-green-800' :
              currentAudit.status === 'approved' ? 'bg-blue-100 text-blue-800' :
              currentAudit.status === 'deferred' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {currentAudit.status.charAt(0).toUpperCase() + currentAudit.status.slice(1)}
            </span>
          </div>

          {/* Score Gauges */}
          <div className="flex justify-center gap-12 mb-6">
            <ScoreGauge score={currentAudit.avg_pagespeed_mobile} label="Mobile" />
            <ScoreGauge score={currentAudit.avg_pagespeed_desktop} label="Desktop" />
          </div>

          {/* Core Web Vitals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="LCP"
              value={currentAudit.avg_lcp_ms ? `${(currentAudit.avg_lcp_ms / 1000).toFixed(1)}s` : null}
              delta={currentAudit.lcp_delta_ms}
              deltaInverted={true}
            />
            <StatCard
              label="CLS"
              value={currentAudit.avg_cls}
            />
            <StatCard
              label="FCP"
              value={currentAudit.avg_fcp_ms ? `${(currentAudit.avg_fcp_ms / 1000).toFixed(1)}s` : null}
            />
            <StatCard
              label="TTFB"
              value={currentAudit.avg_ttfb_ms ? `${currentAudit.avg_ttfb_ms}ms` : null}
            />
          </div>

          {/* Issues Summary */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Issues Found</h3>
            <div className="flex gap-4">
              <button
                onClick={() => selectBySeverity('critical')}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <span className="text-2xl font-bold text-red-600">{currentAudit.critical_issues}</span>
                <span className="block text-xs text-red-600">Critical</span>
              </button>
              <button
                onClick={() => selectBySeverity('high')}
                className="px-4 py-2 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
              >
                <span className="text-2xl font-bold text-yellow-600">{currentAudit.high_issues}</span>
                <span className="block text-xs text-yellow-600">High</span>
              </button>
              <button
                onClick={() => selectBySeverity('medium')}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <span className="text-2xl font-bold text-blue-600">{currentAudit.medium_issues}</span>
                <span className="block text-xs text-blue-600">Medium</span>
              </button>
              <button
                onClick={() => selectBySeverity('low')}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl font-bold text-gray-600">{currentAudit.low_issues}</span>
                <span className="block text-xs text-gray-600">Low</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Audits" value={stats.totalAudits} />
        <StatCard label="Items Fixed" value={stats.totalItemsFixed} />
        <StatCard
          label="Avg Mobile Improvement"
          value={stats.avgMobileImprovement}
          suffix=" pts"
        />
        <StatCard
          label="Avg Desktop Improvement"
          value={stats.avgDesktopImprovement}
          suffix=" pts"
        />
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Performance Trends</h2>
        <TrendChart data={trends} />
      </div>

      {/* Current Audit Items */}
      {currentAudit && currentItems.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Audit Items ({currentItems.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={selectAllPending}
                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
              >
                Select All Pending
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
              >
                Clear Selection
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                  <th className="py-2 px-4 w-10"></th>
                  <th className="py-2 px-4">Code</th>
                  <th className="py-2 px-4">Severity</th>
                  <th className="py-2 px-4">Issue</th>
                  <th className="py-2 px-4 text-center">Impact</th>
                  <th className="py-2 px-4 text-right">Savings</th>
                  <th className="py-2 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) => (
                  <AuditItemRow
                    key={item.id}
                    item={item}
                    selected={selectedItems.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Audits History */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Recent Audits</h2>
        </div>
        <div className="overflow-x-auto">
          <RecentAuditsTable audits={recentAudits} />
        </div>
      </div>
    </div>
  );
}
