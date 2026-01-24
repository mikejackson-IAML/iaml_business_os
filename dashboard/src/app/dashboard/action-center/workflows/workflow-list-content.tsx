"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ArrowLeft } from "lucide-react";
import type { WorkflowExtended, WorkflowStatus } from "@/lib/api/workflow-types";
import { WorkflowTable } from "../components/workflow-table";

interface WorkflowListContentProps {
  workflows: WorkflowExtended[];
}

const WORKFLOW_STATUSES: { value: WorkflowStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
];

const DEPARTMENTS = [
  { value: "all", label: "All Departments" },
  { value: "marketing", label: "Marketing" },
  { value: "operations", label: "Operations" },
  { value: "sales", label: "Sales" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "HR" },
];

export function WorkflowListContent({ workflows }: WorkflowListContentProps) {
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | "all">("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  // Filter workflows based on selected filters (local filtering for now)
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesStatus =
      statusFilter === "all" || workflow.status === statusFilter;
    const matchesDepartment =
      departmentFilter === "all" || workflow.department === departmentFilter;
    return matchesStatus && matchesDepartment;
  });

  const totalWorkflows = workflows.length;
  const hasFilters = statusFilter !== "all" || departmentFilter !== "all";

  const handleClearFilters = () => {
    setStatusFilter("all");
    setDepartmentFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/action-center"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold">Workflows</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {totalWorkflows} workflow{totalWorkflows !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/action-center/workflows/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as WorkflowStatus | "all")
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {WORKFLOW_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={departmentFilter}
          onValueChange={setDepartmentFilter}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept.value} value={dept.value}>
                {dept.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter results count when filtering */}
      {hasFilters && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredWorkflows.length} of {totalWorkflows} workflows
        </p>
      )}

      {/* Workflow table */}
      <WorkflowTable
        workflows={filteredWorkflows}
        emptyStateType={hasFilters ? "filter" : "all"}
        onClearFilters={hasFilters ? handleClearFilters : undefined}
      />
    </div>
  );
}
