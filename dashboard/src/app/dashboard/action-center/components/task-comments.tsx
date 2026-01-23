'use client';

import { useState, useTransition } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import type { TaskComment } from '@/lib/api/task-types';
import { addCommentAction } from '../actions';
import { formatDistanceToNow } from 'date-fns';

// ==================== CommentItem Component ====================

interface CommentItemProps {
  comment: TaskComment;
}

/**
 * CommentItem - Displays a single comment with author, timestamp, and content
 */
function CommentItem({ comment }: CommentItemProps) {
  const isSystemComment = comment.comment_type === 'system' || comment.comment_type === 'status_change';

  return (
    <div className={`border-b border-border last:border-0 pb-4 last:pb-0 ${isSystemComment ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header: Author, Type Badge, Timestamp */}
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="font-medium text-sm">
              {comment.author_name || 'System'}
            </span>

            {/* Type badge for system/status_change comments */}
            {isSystemComment && (
              <Badge variant="secondary" className="text-xs">
                {comment.comment_type === 'status_change' ? 'Status Change' : 'System'}
              </Badge>
            )}

            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Content */}
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================== AddCommentForm Component ====================

interface AddCommentFormProps {
  taskId: string;
}

/**
 * AddCommentForm - Form to add a new comment to a task
 */
function AddCommentForm({ taskId }: AddCommentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate content is not empty
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addCommentAction(taskId, content.trim());
      if (result.success) {
        setContent('');
      } else {
        setError(result.error || 'Failed to add comment');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment... (Enter to submit, Shift+Enter for new line)"
            rows={2}
            disabled={isPending}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !content.trim()}
          className="h-auto self-end"
        >
          {isPending ? (
            <span className="animate-pulse">...</span>
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Send comment</span>
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}

// ==================== Main TaskComments Component ====================

interface TaskCommentsProps {
  taskId: string;
  comments: TaskComment[];
}

/**
 * TaskComments - Displays the comments thread for a task with add comment form
 */
export function TaskComments({ taskId, comments }: TaskCommentsProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Add Comment Form at top */}
        <AddCommentForm taskId={taskId} />

        {/* Divider */}
        {comments.length > 0 && (
          <div className="border-t border-border" />
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">No comments yet</p>
            <p className="text-sm text-muted-foreground">Be the first to add a comment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
