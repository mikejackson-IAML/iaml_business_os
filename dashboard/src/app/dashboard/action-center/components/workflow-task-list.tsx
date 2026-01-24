'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { WorkflowTaskRow } from './workflow-task-row';
import type { TaskExtended } from '@/lib/api/task-types';

interface WorkflowTaskListProps {
  tasks: TaskExtended[];
}

interface SortedTask {
  task: TaskExtended;
  depth: 0 | 1 | 2;
  blockedByName?: string;
}

/**
 * Sorts tasks by dependency order (topological sort)
 * - Parent tasks come before tasks that depend on them
 * - Calculates depth level based on dependency chain
 * - Handles circular dependencies gracefully
 */
function sortTasksByDependency(tasks: TaskExtended[]): SortedTask[] {
  if (tasks.length === 0) return [];

  // Build task map for quick lookup
  const taskMap = new Map<string, TaskExtended>();
  tasks.forEach((task) => taskMap.set(task.id, task));

  // Build adjacency list (task -> tasks that depend on it)
  const dependents = new Map<string, Set<string>>();
  tasks.forEach((task) => {
    task.depends_on?.forEach((depId) => {
      if (!dependents.has(depId)) {
        dependents.set(depId, new Set());
      }
      dependents.get(depId)!.add(task.id);
    });
  });

  // Calculate in-degree (number of dependencies) for each task
  const inDegree = new Map<string, number>();
  tasks.forEach((task) => {
    // Only count dependencies that exist in this workflow
    const validDeps = (task.depends_on || []).filter((depId) => taskMap.has(depId));
    inDegree.set(task.id, validDeps.length);
  });

  // Find all tasks with no dependencies (start nodes)
  const queue: string[] = [];
  tasks.forEach((task) => {
    if (inDegree.get(task.id) === 0) {
      queue.push(task.id);
    }
  });

  // Topological sort using Kahn's algorithm
  const sorted: string[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const taskId = queue.shift()!;
    if (visited.has(taskId)) continue;
    visited.add(taskId);
    sorted.push(taskId);

    // Process all tasks that depend on this task
    const deps = dependents.get(taskId) || new Set();
    deps.forEach((depId) => {
      const degree = inDegree.get(depId) || 0;
      inDegree.set(depId, degree - 1);
      if (degree - 1 === 0) {
        queue.push(depId);
      }
    });
  }

  // Handle circular dependencies or orphans - add remaining tasks
  tasks.forEach((task) => {
    if (!visited.has(task.id)) {
      console.warn(`[WorkflowTaskList] Task "${task.title}" has circular dependency or missing dependency, adding at end`);
      sorted.push(task.id);
    }
  });

  // Calculate depth for each task
  const depthMap = new Map<string, number>();

  function calculateDepth(taskId: string, visited: Set<string> = new Set()): number {
    if (depthMap.has(taskId)) return depthMap.get(taskId)!;

    // Prevent infinite recursion on circular deps
    if (visited.has(taskId)) return 0;
    visited.add(taskId);

    const task = taskMap.get(taskId);
    if (!task || !task.depends_on || task.depends_on.length === 0) {
      depthMap.set(taskId, 0);
      return 0;
    }

    // Find max depth of all dependencies that exist in this workflow
    const validDeps = task.depends_on.filter((depId) => taskMap.has(depId));
    if (validDeps.length === 0) {
      depthMap.set(taskId, 0);
      return 0;
    }

    const maxDepDepth = Math.max(
      ...validDeps.map((depId) => calculateDepth(depId, new Set(visited)))
    );

    // Depth is parent depth + 1, capped at 2
    const depth = Math.min(maxDepDepth + 1, 2);
    depthMap.set(taskId, depth);
    return depth;
  }

  // Calculate depths for all tasks
  sorted.forEach((taskId) => calculateDepth(taskId));

  // Build result with depth and blocked-by info
  return sorted.map((taskId) => {
    const task = taskMap.get(taskId)!;
    const depth = (depthMap.get(taskId) || 0) as 0 | 1 | 2;

    // Find the first dependency's name for "blocked by" indicator
    let blockedByName: string | undefined;
    if (depth > 0 && task.depends_on && task.depends_on.length > 0) {
      const firstDep = task.depends_on.find((depId) => taskMap.has(depId));
      if (firstDep) {
        blockedByName = taskMap.get(firstDep)?.title;
      }
    }

    return { task, depth, blockedByName };
  });
}

/**
 * WorkflowTaskList - Task list component for workflow detail
 *
 * Features:
 * - Section header "Tasks in this Workflow"
 * - Card container
 * - Sorts tasks using dependency sorting (topological sort)
 * - Maps over sorted tasks rendering WorkflowTaskRow with depth
 * - Empty state if no tasks
 */
export function WorkflowTaskList({ tasks }: WorkflowTaskListProps) {
  const sortedTasks = useMemo(() => sortTasksByDependency(tasks), [tasks]);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Tasks in this Workflow</h2>

      <Card>
        <CardContent className="p-0">
          {sortedTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No tasks in this workflow yet.</p>
              <p className="text-sm mt-1">Tasks will appear here once added to the workflow.</p>
            </div>
          ) : (
            <div className="divide-y">
              {sortedTasks.map(({ task, depth, blockedByName }) => (
                <WorkflowTaskRow
                  key={task.id}
                  task={task}
                  depth={depth}
                  blockedByName={blockedByName}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
