/**
 * Digest Data Generator
 *
 * Generates the data needed for the daily digest email by querying
 * critical, due today, and overdue tasks for a user.
 */

import { getServerClient } from '@/lib/supabase/server';
import type { TaskExtended } from '@/lib/api/task-types';

/**
 * Task data needed for digest email
 */
export interface DigestTask {
  id: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

/**
 * Stats for the digest email
 */
export interface DigestStats {
  totalActive: number;
  completedThisWeek: number;
}

/**
 * Complete digest data returned by generateDigestData
 */
export interface DigestData {
  criticalTasks: DigestTask[];
  dueTodayTasks: DigestTask[];
  overdueTasks: DigestTask[];
  stats: DigestStats;
}

/**
 * Convert TaskExtended to DigestTask
 */
function toDigestTask(task: TaskExtended): DigestTask {
  return {
    id: task.id,
    title: task.title,
    due_date: task.due_date,
    due_time: task.due_time,
    priority: task.priority,
  };
}

/**
 * Generate digest data for a specific user
 *
 * @param userId - The user ID to generate digest for
 * @returns DigestData with critical, due today, overdue tasks and stats
 */
export async function generateDigestData(userId: string): Promise<DigestData> {
  const supabase = getServerClient();

  // Query critical tasks (open or in_progress with critical priority)
  const { data: criticalData, error: criticalError } = await supabase
    .from('tasks_extended')
    .select('*')
    .in('status', ['open', 'in_progress'])
    .eq('priority', 'critical')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10);

  if (criticalError) {
    console.error('Error fetching critical tasks:', criticalError);
    throw new Error('Failed to fetch critical tasks');
  }

  // Query tasks due today (using due_category from the view)
  const { data: dueTodayData, error: dueTodayError } = await supabase
    .from('tasks_extended')
    .select('*')
    .in('status', ['open', 'in_progress'])
    .eq('due_category', 'today')
    .neq('priority', 'critical') // Exclude critical since they're shown separately
    .order('due_time', { ascending: true, nullsFirst: false })
    .limit(10);

  if (dueTodayError) {
    console.error('Error fetching due today tasks:', dueTodayError);
    throw new Error('Failed to fetch due today tasks');
  }

  // Query overdue tasks (using due_category from the view)
  const { data: overdueData, error: overdueError } = await supabase
    .from('tasks_extended')
    .select('*')
    .in('status', ['open', 'in_progress'])
    .eq('due_category', 'overdue')
    .neq('priority', 'critical') // Exclude critical since they're shown separately
    .order('due_date', { ascending: true })
    .limit(10);

  if (overdueError) {
    console.error('Error fetching overdue tasks:', overdueError);
    throw new Error('Failed to fetch overdue tasks');
  }

  // Get total active count
  const { count: totalActive, error: activeError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('status', ['open', 'in_progress', 'waiting']);

  if (activeError) {
    console.error('Error fetching active task count:', activeError);
    throw new Error('Failed to fetch active task count');
  }

  // Get completed this week count
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { count: completedThisWeek, error: completedError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'done')
    .gte('completed_at', oneWeekAgo.toISOString());

  if (completedError) {
    console.error('Error fetching completed task count:', completedError);
    throw new Error('Failed to fetch completed task count');
  }

  return {
    criticalTasks: (criticalData as TaskExtended[] || []).map(toDigestTask),
    dueTodayTasks: (dueTodayData as TaskExtended[] || []).map(toDigestTask),
    overdueTasks: (overdueData as TaskExtended[] || []).map(toDigestTask),
    stats: {
      totalActive: totalActive || 0,
      completedThisWeek: completedThisWeek || 0,
    },
  };
}

/**
 * Check if digest data has any urgent items worth sending
 * Returns true if there are critical, due today, or overdue tasks
 */
export function hasUrgentItems(data: DigestData): boolean {
  return (
    data.criticalTasks.length > 0 ||
    data.dueTodayTasks.length > 0 ||
    data.overdueTasks.length > 0
  );
}
