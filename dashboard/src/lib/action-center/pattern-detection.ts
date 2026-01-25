/**
 * Pattern Detection Module
 *
 * Implements four pattern detection algorithms that analyze task history
 * and feed insights into AI analysis. These patterns run on 90-day task
 * history and help Claude provide actionable recommendations.
 *
 * Pattern Types:
 * 1. Recurring Neglect - Tasks dismissed/overdue in same category
 * 2. Workload Imbalance - Days with too many tasks vs empty days
 * 3. Velocity Trend - Completion speed changes over time
 * 4. Deadline Clustering - Multiple high-priority tasks due same day
 */

import type { TaskExtended } from '@/lib/api/task-types';
import type { AIPatternInsight, DetectedPatternItem } from './ai-analysis-types';
import { differenceInDays, format, startOfDay } from 'date-fns';

/**
 * Detect all patterns from task history
 *
 * @param tasks - Array of extended tasks from the last 90 days
 * @returns Array of detected pattern insights
 */
export function detectPatterns(tasks: TaskExtended[]): AIPatternInsight[] {
  const patterns: AIPatternInsight[] = [];

  patterns.push(...detectRecurringNeglect(tasks));
  patterns.push(...detectWorkloadImbalance(tasks));
  patterns.push(...detectVelocityTrend(tasks));
  patterns.push(...detectDeadlineClustering(tasks));

  return patterns;
}

/**
 * Pattern 1: Recurring Neglect
 *
 * Identifies tasks that are consistently dismissed or overdue
 * within the same category (task_type + department combination).
 * Threshold: 3+ neglected tasks in a category.
 *
 * @param tasks - Array of tasks to analyze
 * @returns Array of recurring neglect patterns
 */
function detectRecurringNeglect(tasks: TaskExtended[]): AIPatternInsight[] {
  const patterns: AIPatternInsight[] = [];

  // Group neglected tasks by task_type and department
  const neglectedByType: Record<string, TaskExtended[]> = {};

  for (const task of tasks) {
    const isNeglected = task.status === 'dismissed' || task.is_overdue;
    if (!isNeglected) continue;

    const key = `${task.task_type}:${task.department || 'unassigned'}`;
    if (!neglectedByType[key]) neglectedByType[key] = [];
    neglectedByType[key].push(task);
  }

  // Flag patterns with 3+ neglected tasks
  for (const [key, neglectedTasks] of Object.entries(neglectedByType)) {
    if (neglectedTasks.length >= 3) {
      const [taskType, department] = key.split(':');
      const displayDepartment = department === 'unassigned' ? 'no department' : department;

      patterns.push({
        type: 'recurring_neglect',
        description: `${neglectedTasks.length} ${taskType} tasks in ${displayDepartment} have been dismissed or are overdue`,
        severity: neglectedTasks.length >= 5 ? 'concern' : 'warning',
        affected_items: neglectedTasks.map(t => ({ id: t.id, title: t.title })),
      });
    }
  }

  return patterns;
}

/**
 * Pattern 2: Workload Imbalance
 *
 * Identifies days with too many tasks due (>5 tasks per day).
 * Suggests spreading work more evenly across the week.
 *
 * @param tasks - Array of tasks to analyze
 * @returns Array of workload imbalance patterns
 */
function detectWorkloadImbalance(tasks: TaskExtended[]): AIPatternInsight[] {
  const patterns: AIPatternInsight[] = [];

  // Group upcoming tasks by due date
  const tasksByDate: Record<string, TaskExtended[]> = {};
  const today = startOfDay(new Date());

  for (const task of tasks) {
    // Skip tasks without due date, or already completed/dismissed
    if (!task.due_date || task.status === 'done' || task.status === 'dismissed') continue;

    const dueDate = new Date(task.due_date);
    if (dueDate < today) continue; // Skip past due dates

    const dateKey = format(dueDate, 'yyyy-MM-dd');
    if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
    tasksByDate[dateKey].push(task);
  }

  // Find overloaded days (>5 tasks)
  for (const [date, dateTasks] of Object.entries(tasksByDate)) {
    if (dateTasks.length > 5) {
      const formattedDate = format(new Date(date), 'MMM d');
      patterns.push({
        type: 'workload_imbalance',
        description: `${dateTasks.length} tasks due on ${formattedDate} - consider spreading out`,
        severity: dateTasks.length > 8 ? 'concern' : 'warning',
        affected_items: dateTasks.map(t => ({ id: t.id, title: t.title })),
        recommendation: `Review the ${dateTasks.length} tasks due on ${formattedDate} and consider redistributing some to adjacent days.`,
      });
    }
  }

  return patterns;
}

/**
 * Pattern 3: Completion Velocity Trend
 *
 * Compares task completion speed in the last 30 days vs the 90-day average.
 * Flags significant changes (>50% slower or faster).
 *
 * @param tasks - Array of tasks to analyze
 * @returns Array of velocity trend patterns
 */
function detectVelocityTrend(tasks: TaskExtended[]): AIPatternInsight[] {
  const patterns: AIPatternInsight[] = [];

  // Filter to completed tasks with completion timestamp
  const completedTasks = tasks.filter(t => t.status === 'done' && t.completed_at);
  if (completedTasks.length < 5) return patterns; // Not enough data

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  /**
   * Calculate average days from creation to completion
   */
  const calculateAvgVelocity = (taskList: TaskExtended[]): number => {
    if (taskList.length === 0) return 0;

    const velocities = taskList.map(t => {
      const created = new Date(t.created_at);
      const completed = new Date(t.completed_at!);
      return differenceInDays(completed, created);
    });

    return velocities.reduce((a, b) => a + b, 0) / velocities.length;
  };

  // Split into recent (30 days) and older (30-90 days) tasks
  const recentTasks = completedTasks.filter(t => new Date(t.completed_at!) > thirtyDaysAgo);
  const olderTasks = completedTasks.filter(t => new Date(t.completed_at!) <= thirtyDaysAgo);

  // Need at least 3 tasks in each period for meaningful comparison
  if (recentTasks.length < 3 || olderTasks.length < 3) return patterns;

  const recentVelocity = calculateAvgVelocity(recentTasks);
  const overallVelocity = calculateAvgVelocity(olderTasks);

  // Avoid division by zero
  if (overallVelocity === 0) return patterns;

  // Flag if velocity changed significantly (>50% slower or faster)
  if (recentVelocity > overallVelocity * 1.5) {
    // Slowing down
    const percentSlower = Math.round((recentVelocity / overallVelocity - 1) * 100);
    patterns.push({
      type: 'velocity_trend',
      description: `Task completion is ${percentSlower}% slower than your 90-day average`,
      severity: recentVelocity > overallVelocity * 2 ? 'concern' : 'warning',
      affected_items: [], // No specific tasks - trend-based insight
      recommendation: 'Consider breaking tasks into smaller pieces or identifying blockers that may be slowing progress.',
    });
  } else if (recentVelocity < overallVelocity * 0.5) {
    // Speeding up (positive pattern)
    const percentFaster = Math.round((1 - recentVelocity / overallVelocity) * 100);
    patterns.push({
      type: 'velocity_trend',
      description: `Great job! You're completing tasks ${percentFaster}% faster than your 90-day average`,
      severity: 'info', // Positive pattern
      affected_items: [],
    });
  }

  return patterns;
}

/**
 * Pattern 4: Deadline Clustering
 *
 * Identifies days where multiple high-priority tasks (critical/high)
 * are due on the same day. Threshold: 2+ high-priority tasks per day.
 *
 * @param tasks - Array of tasks to analyze
 * @returns Array of deadline clustering patterns
 */
function detectDeadlineClustering(tasks: TaskExtended[]): AIPatternInsight[] {
  const patterns: AIPatternInsight[] = [];

  // Group high-priority upcoming tasks by date
  const highPriorityByDate: Record<string, TaskExtended[]> = {};
  const today = startOfDay(new Date());

  for (const task of tasks) {
    if (!task.due_date) continue;
    if (task.status === 'done' || task.status === 'dismissed') continue;
    if (!['critical', 'high'].includes(task.priority)) continue;

    const dueDate = new Date(task.due_date);
    if (dueDate < today) continue;

    const dateKey = format(dueDate, 'yyyy-MM-dd');
    if (!highPriorityByDate[dateKey]) highPriorityByDate[dateKey] = [];
    highPriorityByDate[dateKey].push(task);
  }

  // Flag days with 2+ high-priority tasks
  for (const [date, dateTasks] of Object.entries(highPriorityByDate)) {
    if (dateTasks.length >= 2) {
      const formattedDate = format(new Date(date), 'MMM d');
      const criticalCount = dateTasks.filter(t => t.priority === 'critical').length;
      const highCount = dateTasks.filter(t => t.priority === 'high').length;

      let priorityBreakdown = '';
      if (criticalCount > 0 && highCount > 0) {
        priorityBreakdown = ` (${criticalCount} critical, ${highCount} high)`;
      } else if (criticalCount > 0) {
        priorityBreakdown = ' (all critical)';
      }

      patterns.push({
        type: 'deadline_clustering',
        description: `${dateTasks.length} high-priority tasks due ${formattedDate}${priorityBreakdown}`,
        severity: dateTasks.length >= 3 || criticalCount >= 2 ? 'concern' : 'warning',
        affected_items: dateTasks.map(t => ({ id: t.id, title: t.title })),
        recommendation: `Review the ${dateTasks.length} high-priority deadlines on ${formattedDate} to ensure they are all achievable.`,
      });
    }
  }

  return patterns;
}
