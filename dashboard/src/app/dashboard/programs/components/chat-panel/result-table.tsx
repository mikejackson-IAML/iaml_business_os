'use client';

import { Download } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';

interface ResultTableProps {
  data: Record<string, unknown>[];
  maxRows?: number;
}

export function ResultTable({ data, maxRows = 10 }: ResultTableProps) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No results found.</p>;
  }

  const columns = Object.keys(data[0]);
  const displayData = data.slice(0, maxRows);
  const hasMore = data.length > maxRows;

  const exportCSV = () => {
    const headers = columns.join(',');
    const rows = data.map(row =>
      columns.map(col => {
        const val = row[col];
        const str = String(val ?? '').replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `programs-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format column headers: snake_case -> Title Case
  const formatHeader = (key: string) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Format cell values
  const formatCell = (value: unknown) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      // Currency detection (decimals or large numbers)
      if (String(value).includes('.') || value > 100) {
        return value.toLocaleString();
      }
      return value;
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  return (
    <div className="mt-3 rounded-lg border bg-card">
      <div className="flex items-center justify-between p-2 border-b">
        <span className="text-xs text-muted-foreground">
          {data.length} result{data.length !== 1 ? 's' : ''}
        </span>
        <Button variant="ghost" size="sm" onClick={exportCSV} className="h-7 text-xs">
          <Download className="h-3 w-3 mr-1" />
          CSV
        </Button>
      </div>
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border">
              {columns.map(col => (
                <th key={col} className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {formatHeader(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, i) => (
              <tr key={i} className="border-b border-border/50">
                {columns.map(col => (
                  <td key={col} className="px-3 py-2 text-xs">
                    {formatCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="p-2 border-t text-center">
          <span className="text-xs text-muted-foreground">
            Showing {maxRows} of {data.length} - Export CSV for full data
          </span>
        </div>
      )}
    </div>
  );
}
