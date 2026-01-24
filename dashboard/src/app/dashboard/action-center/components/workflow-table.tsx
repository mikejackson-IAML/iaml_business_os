'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, CheckCircle2 } from 'lucide-react';
import type { WorkflowExtended } from '@/lib/api/workflow-types';
import { WorkflowRow } from './workflow-row';

interface WorkflowTableProps {
  workflows: WorkflowExtended[];
  isLoading?: boolean;
  emptyStateType: 'filter' | 'all';
  onClearFilters?: () => void;
}

export function WorkflowTable({
  workflows,
  isLoading,
  emptyStateType,
  onClearFilters,
}: WorkflowTableProps) {
  if (workflows.length === 0 && !isLoading) {
    return (
      <Card className="p-12">
        <EmptyState
          type={emptyStateType}
          onClearFilters={onClearFilters}
        />
      </Card>
    );
  }

  return (
    <Card>
      {/* Table Header */}
      <div className="grid grid-cols-[80px_1fr_140px_120px_120px] gap-4 px-6 py-3 border-b border-border text-sm text-muted-foreground font-medium">
        <div>Status</div>
        <div>Name</div>
        <div>Progress</div>
        <div>Due</div>
        <div>Department</div>
      </div>

      {/* Table Body */}
      <div>
        {workflows.map((workflow) => (
          <WorkflowRow
            key={workflow.id}
            workflow={workflow}
          />
        ))}
      </div>
    </Card>
  );
}

function EmptyState({
  type,
  onClearFilters,
}: {
  type: 'filter' | 'all';
  onClearFilters?: () => void;
}) {
  if (type === 'all') {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success mb-4" />
        <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first workflow to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No workflows found</h3>
      <p className="text-muted-foreground mb-4">
        No workflows match your current filters.
      </p>
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}
