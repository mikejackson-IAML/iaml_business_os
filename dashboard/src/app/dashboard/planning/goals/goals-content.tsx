'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { UserGoal } from '@/dashboard-kit/types/departments/planning';
import {
  GOAL_TIERS,
  getTierFromPriority,
  getGoalTypeLabel,
} from '@/dashboard-kit/types/departments/planning';
import { deleteGoalAction } from '../actions';
import { GoalForm } from './components/goal-form';

interface GoalsContentProps {
  goals: UserGoal[];
}

export function GoalsContent({ goals }: GoalsContentProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<UserGoal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeCount = goals.filter((g) => g.active).length;
  const maxReached = activeCount >= 5;

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteGoalAction(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (result.success) {
      toast.success('Goal deleted');
    } else {
      toast.error(result.error ?? 'Failed to delete goal');
    }
  }

  const typeColors: Record<string, string> = {
    revenue: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    strategic: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    quick_win: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/dashboard/planning"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Pipeline</span>
        </Link>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="badge-live">GOALS</span>
            <h1 className="text-display-sm text-foreground">Goals Management</h1>
          </div>
          <div className="relative">
            <Button
              onClick={() => setAddOpen(true)}
              disabled={maxReached}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
            {maxReached && (
              <p className="absolute right-0 top-full mt-1 text-xs text-muted-foreground whitespace-nowrap">
                Maximum 5 active goals
              </p>
            )}
          </div>
        </div>
        <p className="text-muted-foreground">
          Set priorities to help AI rank your projects ({activeCount}/5 active)
        </p>
      </header>

      {/* Goals list or empty state */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No goals set yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Add goals to help AI prioritize your projects in the build queue.
            </p>
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const tier = getTierFromPriority(goal.priority);
            const tierInfo = GOAL_TIERS[tier];
            const tierBorder =
              tier === 'must-have'
                ? 'border-l-red-500'
                : tier === 'should-have'
                  ? 'border-l-amber-500'
                  : 'border-l-gray-500';

            return (
              <Card key={goal.id} className={`border-l-4 ${tierBorder}`}>
                <CardContent className="py-4 flex items-center gap-4">
                  {/* Type badge */}
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                      typeColors[goal.goal_type] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                    }`}
                  >
                    {getGoalTypeLabel(goal.goal_type)}
                  </span>

                  {/* Description */}
                  <span className="flex-1 text-sm text-foreground">{goal.description}</span>

                  {/* Tier badge */}
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                      tier === 'must-have'
                        ? 'border-red-500/30 bg-red-500/10 text-red-400'
                        : tier === 'should-have'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : 'border-gray-500/30 bg-gray-500/10 text-gray-400'
                    }`}
                  >
                    {tierInfo.label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditGoal(goal)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(goal.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add dialog */}
      <GoalForm open={addOpen} onOpenChange={setAddOpen} />

      {/* Edit dialog */}
      {editGoal && (
        <GoalForm
          open={!!editGoal}
          onOpenChange={(open) => {
            if (!open) setEditGoal(null);
          }}
          goal={editGoal}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this goal. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
