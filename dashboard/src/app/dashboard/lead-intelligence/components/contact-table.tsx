'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import { ContactAvatar } from './contact-avatar';
import { StatusBadge } from './status-badge';
import { ContactRowActions } from './contact-row-actions';
import type { Contact } from '@/lib/api/lead-intelligence-contacts-types';

interface ContactTableProps {
  contacts: Contact[];
  isLoading?: boolean;
  onSort: (field: string, order: 'asc' | 'desc') => void;
  currentSort: string;
  currentOrder: 'asc' | 'desc';
  pagination: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

interface ColumnDef {
  id: string;
  label: string;
  sortable: boolean;
  width?: string;
}

const columns: ColumnDef[] = [
  { id: 'last_name', label: 'Name', sortable: true },
  { id: 'company', label: 'Company', sortable: false },
  { id: 'title', label: 'Title', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'last_activity_at', label: 'Last Activity', sortable: true },
  { id: 'actions', label: '', sortable: false, width: '48px' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function ContactTable({
  contacts,
  isLoading,
  onSort,
  currentSort,
  currentOrder,
  pagination,
}: ContactTableProps) {
  const handleSort = (columnId: string) => {
    const newOrder = currentSort === columnId && currentOrder === 'asc' ? 'desc' : 'asc';
    onSort(columnId, newOrder);
  };

  const SortIcon = ({ columnId }: { columnId: string }) => {
    if (currentSort !== columnId) {
      return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
    }
    return currentOrder === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={`text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                      col.sortable ? 'cursor-pointer hover:text-foreground' : ''
                    }`}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => col.sortable && handleSort(col.id)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && <SortIcon columnId={col.id} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td colSpan={columns.length} className="px-4 py-3">
                      <div className="h-10 bg-muted/50 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No contacts found
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/lead-intelligence/contacts/${contact.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <ContactAvatar contact={contact} size="sm" />
                        <span className="text-sm font-medium">
                          {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown'}
                        </span>
                      </Link>
                    </td>

                    {/* Company */}
                    <td className="px-4 py-3 text-sm">
                      {contact.company ? (
                        <Link
                          href={`/dashboard/lead-intelligence/companies/${contact.company.id}`}
                          className="hover:underline text-muted-foreground"
                        >
                          {contact.company.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {contact.title ?? '--'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={contact.status ?? 'inactive'}
                        isVip={contact.is_vip ?? false}
                      />
                    </td>

                    {/* Last Activity */}
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(contact.last_activity_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <ContactRowActions contact={contact} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Showing{' '}
              {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
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
                disabled={pagination.currentPage <= 1}
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
                        variant={pagination.currentPage === page ? 'default' : 'outline'}
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
                disabled={pagination.currentPage >= pagination.totalPages}
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
