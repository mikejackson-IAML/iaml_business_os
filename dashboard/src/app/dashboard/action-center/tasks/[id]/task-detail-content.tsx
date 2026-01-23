'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  Workflow,
  Bot,
  User,
  CheckCircle,
  XCircle,
  Play,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/dashboard-kit/components/ui/tabs';
import { FallingPattern } from '@/components/ui/falling-pattern';
import type { TaskExtended, TaskComment, TaskActivity } from '@/lib/api/task-types';
import { format, isToday, isTomorrow, isPast, formatDistanceToNow } from 'date-fns';

// Components to be implemented in later plans (05-05, 05-06, 05-09, 05-10)
// For now, using inline implementations
// import { TaskMetadataSidebar } from './task-metadata-sidebar';
// import { TaskComments } from './task-comments';
// import { TaskActivityList } from './task-activity-list';
// import { CompleteTaskDialog } from './complete-task-dialog';
// import { DismissTaskDialog } from './dismiss-task-dialog';
// import { ApprovalActions } from './approval-actions';
// import { WorkflowContext } from './workflow-context';

interface TaskDetailContentProps {
  task: TaskExtended;
  comments: TaskComment[];
  activity: TaskActivity[];
}

// Config for priority display (reused from task-row)
const priorityConfig = {
  critical: { color: 'bg-red-500', text: 'Critical', variant: 'critical' as const },
  high: { color: 'bg-orange-500', text: 'High', variant: 'warning' as const },
  normal: { color: 'bg-gray-400', text: 'Normal', variant: 'secondary' as const },
  low: { color: 'bg-blue-500', text: 'Low', variant: 'info' as const },
};

// Config for status display
const statusConfig = {
  open: { text: 'Open', variant: 'outline' as const },
  in_progress: { text: 'In Progress', variant: 'info' as const },
  waiting: { text: 'Waiting', variant: 'warning' as const },
  done: { text: 'Done', variant: 'healthy' as const },
  dismissed: { text: 'Dismissed', variant: 'secondary' as const },
};

// Config for task type display
const typeConfig = {
  standard: { text: 'Task', variant: 'secondary' as const },
  approval: { text: 'Approval', variant: 'warning' as const },
  decision: { text: 'Decision', variant: 'info' as const },
  review: { text: 'Review', variant: 'info' as const },
};

// Config for source icons
const sourceIcons = {
  alert: AlertCircle,
  workflow: Workflow,
  ai: Bot,
  manual: User,
  rule: Workflow,
};

/**
 * Format due date with contextual display
 */
function formatDueDate(date: string | null): React.ReactNode {
  if (!date) return null;
  const d = new Date(date);
  if (isPast(d) && !isToday(d)) {
    return <span className="text-red-500 font-medium">Overdue ({format(d, 'MMM d')})</span>;
  }
  if (isToday(d)) {
    return <span className="text-amber-500 font-medium">Due Today</span>;
  }
  if (isTomorrow(d)) {
    return <span className="text-blue-500">Due Tomorrow</span>;
  }
  return format(d, 'MMMM d, yyyy');
}

/**
 * TaskDetailContent - Main content component for task detail page
 * Displays task information, actions, comments, and activity in a two-column layout.
 */
export function TaskDetailContent({ task, comments, activity }: TaskDetailContentProps) {
  // State for action dialogs
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDismissDialog, setShowDismissDialog] = useState(false);

  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.normal;
  const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.open;
  const taskType = typeConfig[task.task_type as keyof typeof typeConfig] || typeConfig.standard;
  const SourceIcon = sourceIcons[task.source as keyof typeof sourceIcons] || User;

  // Determine if task can be actioned (Complete/Dismiss)
  const canTakeAction = task.status === 'open' || task.status === 'in_progress';
  const isApprovalTask = task.task_type === 'approval';

  return (
    <div className="relative min-h-screen">
      <FallingPattern
        color="hsl(var(--accent-primary))"
        backgroundColor="hsl(var(--background))"
        duration={150}
        blurIntensity="1em"
        density={0.5}
        className="fixed inset-0 -z-10 opacity-50"
      />

      <div className="relative z-10 p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-6">
          {/* Back navigation */}
          <Link
            href="/dashboard/action-center"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Action Center
          </Link>

          {/* Title and Actions Row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Left: Title and Badges */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">{task.title}</h1>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Badge */}
                <Badge variant={status.variant}>{status.text}</Badge>

                {/* Task Type Badge */}
                <Badge variant={taskType.variant}>{taskType.text}</Badge>

                {/* Priority Badge */}
                <Badge variant={priority.variant}>
                  <span className={`w-2 h-2 rounded-full ${priority.color} mr-1.5`} />
                  {priority.text}
                </Badge>

                {/* Source Badge */}
                <Badge variant="outline" className="gap-1">
                  <SourceIcon className="h-3 w-3" />
                  <span className="capitalize">{task.source || 'Manual'}</span>
                </Badge>

                {/* Blocked Badge */}
                {task.is_blocked && (
                  <Badge variant="warning">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Blocked
                  </Badge>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {canTakeAction && !isApprovalTask && (
                <>
                  {task.status === 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement start working action (05-07)
                      }}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start Working
                    </Button>
                  )}
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setShowCompleteDialog(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDismissDialog(true)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                </>
              )}

              {canTakeAction && isApprovalTask && (
                // ApprovalActions component placeholder - will be implemented in 05-10
                <div className="flex items-center gap-2">
                  <Button variant="success" size="sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button variant="warning" size="sm">
                    Approve with Changes
                  </Button>
                  <Button variant="destructive" size="sm">
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            {task.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Recommendation Callout (for approval tasks) */}
            {task.recommendation && (
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <Lightbulb className="h-5 w-5" />
                    AI Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium text-amber-900 dark:text-amber-100">{task.recommendation}</p>
                  {task.recommendation_reasoning && (
                    <p className="text-sm text-amber-700 dark:text-amber-300">{task.recommendation_reasoning}</p>
                  )}
                  {task.ai_confidence !== null && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Confidence: {Math.round(task.ai_confidence * 100)}%
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Workflow Context (if task has workflow) */}
            {task.workflow_id && task.workflow_name && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Workflow className="h-5 w-5" />
                    Workflow Context
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{task.workflow_name}</p>
                      {task.workflow_status && (
                        <p className="text-sm text-muted-foreground">Status: {task.workflow_status}</p>
                      )}
                    </div>
                    {/* TODO: Link to workflow detail when available */}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dependencies Section */}
            {(task.blocked_by_count > 0 || task.blocking_count > 0) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Dependencies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {task.blocked_by_count > 0 && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Blocked by {task.blocked_by_count} task{task.blocked_by_count > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {task.blocking_count > 0 && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Blocking {task.blocking_count} task{task.blocking_count > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Related Entity Link */}
            {task.related_entity_url && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Related Item</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={task.related_entity_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    {task.related_entity_type && (
                      <span className="capitalize">{task.related_entity_type}</span>
                    )}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Tabs: Comments & Activity */}
            <Tabs defaultValue="comments" className="w-full">
              <TabsList>
                <TabsTrigger value="comments">
                  Comments ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="activity">
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="mt-4">
                {/* TaskComments placeholder - will be fully implemented in 05-05 */}
                <Card>
                  <CardContent className="pt-6">
                    {comments.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No comments yet. Be the first to add one.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {comment.author_name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Add comment form placeholder */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Comment form coming in plan 05-05
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                {/* TaskActivityList placeholder - will be fully implemented in 05-06 */}
                <Card>
                  <CardContent className="pt-6">
                    {activity.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No activity recorded yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {activity.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                            <div className="flex-1">
                              <p>
                                <span className="font-medium">{item.actor_name || 'System'}</span>
                                {' '}
                                <span className="text-muted-foreground">{item.activity_type.replace(/_/g, ' ')}</span>
                                {item.new_value && (
                                  <>
                                    {' to '}
                                    <span className="font-medium">{item.new_value}</span>
                                  </>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Metadata Sidebar */}
          <div className="space-y-4">
            {/* TaskMetadataSidebar placeholder - will be its own component later */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Due Date */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Due Date</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDueDate(task.due_date) || 'No due date'}
                    </span>
                  </div>
                  {task.due_time && (
                    <p className="text-sm text-muted-foreground ml-6">at {task.due_time}</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Department</p>
                  <p className="text-sm">{task.department || 'Unassigned'}</p>
                </div>

                {/* Assignee */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Assignee</p>
                  <p className="text-sm">{task.assignee_name || 'Unassigned'}</p>
                </div>

                {/* SOP */}
                {task.sop_name && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">SOP</p>
                    <p className="text-sm">{task.sop_name}</p>
                    {task.sop_category && (
                      <p className="text-xs text-muted-foreground">{task.sop_category}</p>
                    )}
                  </div>
                )}

                {/* Created */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Created</p>
                  <p className="text-sm">{format(new Date(task.created_at), 'MMM d, yyyy')}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Last Updated */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Last Updated</p>
                  <p className="text-sm">{format(new Date(task.updated_at), 'MMM d, yyyy')}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Completion/Dismissal Info (for done/dismissed tasks) */}
                {task.status === 'done' && task.completed_at && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Completed</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {format(new Date(task.completed_at), 'MMM d, yyyy')}
                    </p>
                    {task.completion_note && (
                      <p className="text-sm text-muted-foreground mt-1">{task.completion_note}</p>
                    )}
                    {task.approval_outcome && (
                      <div className="mt-2">
                        <Badge variant={
                          task.approval_outcome === 'approved' ? 'healthy' :
                          task.approval_outcome === 'modified' ? 'warning' :
                          'critical'
                        }>
                          {task.approval_outcome.charAt(0).toUpperCase() + task.approval_outcome.slice(1)}
                        </Badge>
                        {task.approval_modifications && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.approval_modifications}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {task.status === 'dismissed' && task.dismissed_at && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Dismissed</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(task.dismissed_at), 'MMM d, yyyy')}
                    </p>
                    {task.dismissed_reason && (
                      <p className="text-sm text-muted-foreground mt-1">{task.dismissed_reason}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog placeholders - will be fully implemented in 05-09, 05-10 */}
        {showCompleteDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Complete Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Complete task dialog coming in plan 05-09</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="success" onClick={() => setShowCompleteDialog(false)}>
                    Complete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showDismissDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Dismiss Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Dismiss task dialog coming in plan 05-09</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowDismissDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={() => setShowDismissDialog(false)}>
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
