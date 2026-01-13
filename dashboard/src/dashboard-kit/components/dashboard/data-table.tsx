'use client';

import * as React from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { StatusBadge } from './status-indicator';
import { TableRowSkeleton } from '../ui/skeleton';
import { formatDate, formatDateShort, formatNumber, formatPercent, formatCurrency } from '../../lib/utils';
import type { TableColumn, HealthStatus, MetricFormat } from '../../types';

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn[];
  title?: string;
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  sortable?: boolean;
  defaultSort?: { column: string; direction: 'asc' | 'desc' };
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  onExport?: () => void;
  emptyMessage?: string;
  className?: string;
}

// Format cell value based on column type
function formatCellValue(value: unknown, format?: MetricFormat): React.ReactNode {
  if (value === null || value === undefined) {
    return '—';
  }

  switch (format) {
    case 'date':
      return formatDate(value as Date | string);
    case 'date_short':
      return formatDateShort(value as Date | string);
    case 'number':
      return formatNumber(value as number);
    case 'percent':
      return formatPercent(value as number);
    case 'currency':
      return formatCurrency(value as number);
    case 'fraction':
      if (typeof value === 'object' && value !== null && 'numerator' in value && 'denominator' in value) {
        const obj = value as { numerator: number; denominator: number };
        return `${obj.numerator}/${obj.denominator}`;
      }
      return String(value);
    default:
      return String(value);
  }
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  title,
  isLoading = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  sortable = false,
  defaultSort,
  onSort,
  pagination,
  onRowClick,
  onExport,
  emptyMessage = 'No data available',
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState(defaultSort);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleSort = (columnId: string) => {
    if (!sortable) {
      return;
    }
    const newDirection =
      sortConfig?.column === columnId && sortConfig.direction === 'asc'
        ? 'desc'
        : 'asc';
    setSortConfig({ column: columnId, direction: newDirection });
    onSort?.(columnId, newDirection);
  };

  const SortIcon = ({ columnId }: { columnId: string }) => {
    if (sortConfig?.column !== columnId) {
      return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <Card className={className}>
      {(title || searchable || onExport) && (
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            <div className="flex items-center gap-2">
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearch}
                    className="pl-9 w-64"
                  />
                </div>
              )}
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      'text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider',
                      sortable && column.sortable !== false && 'cursor-pointer hover:text-foreground'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable !== false && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {sortable && column.sortable !== false && (
                        <SortIcon columnId={column.id} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={columns.length}>
                      <TableRowSkeleton columns={columns.length} />
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-12 text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      'border-b border-border/50 transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-muted/50'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => {
                      const value = row[column.id];

                      // Handle status column
                      if (column.type === 'status' && typeof value === 'string') {
                        return (
                          <td key={column.id} className="px-4 py-3">
                            <StatusBadge status={value as HealthStatus}>
                              {value.charAt(0).toUpperCase() + value.slice(1)}
                            </StatusBadge>
                          </td>
                        );
                      }

                      // Handle icon column
                      if (column.type === 'icon') {
                        return (
                          <td key={column.id} className="px-4 py-3">
                            {Boolean(value) && (
                              <span className="text-amber-500">⚠️</span>
                            )}
                          </td>
                        );
                      }

                      // Handle progress/fraction with color coding
                      if (column.colorCoding && typeof value === 'number') {
                        const percent = value * 100;
                        let statusColor: 'healthy' | 'warning' | 'critical' = 'healthy';
                        if (percent < 50) {
                          statusColor = 'critical';
                        } else if (percent < 80) {
                          statusColor = 'warning';
                        }

                        return (
                          <td key={column.id} className="px-4 py-3">
                            <Badge variant={statusColor}>
                              {formatCellValue(value, column.format)}
                            </Badge>
                          </td>
                        );
                      }

                      return (
                        <td key={column.id} className="px-4 py-3 text-sm">
                          {formatCellValue(value, column.format)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
              {Math.min(
                pagination.currentPage * pagination.itemsPerPage,
                pagination.totalItems
              )}{' '}
              of {pagination.totalItems}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const current = pagination.currentPage;
                  return (
                    page === 1 ||
                    page === pagination.totalPages ||
                    Math.abs(page - current) <= 1
                  );
                })
                .map((page, index, filtered) => {
                  const showEllipsis =
                    index > 0 && page - filtered[index - 1] > 1;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={
                          pagination.currentPage === page ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => pagination.onPageChange(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  );
                })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DataTable;
