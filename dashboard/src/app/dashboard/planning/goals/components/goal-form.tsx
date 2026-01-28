'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/dashboard-kit/components/ui/button';
import type { UserGoal, GoalType, GoalTier } from '@/dashboard-kit/types/departments/planning';
import {
  BUSINESS_GOAL_TYPES,
  GOAL_TIERS,
  getTierFromPriority,
  getGoalTypeLabel,
} from '@/dashboard-kit/types/departments/planning';
import { createGoalAction, updateGoalAction } from '../../actions';

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: UserGoal;
}

export function GoalForm({ open, onOpenChange, goal }: GoalFormProps) {
  const isEdit = !!goal;
  const [goalType, setGoalType] = useState<GoalType>(goal?.goal_type ?? 'revenue');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [tier, setTier] = useState<GoalTier>(goal ? getTierFromPriority(goal.priority) : 'must-have');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    const priority = GOAL_TIERS[tier].value;

    const result = isEdit
      ? await updateGoalAction(goal!.id, { description: description.trim(), priority })
      : await createGoalAction(goalType, description.trim(), priority);

    setSubmitting(false);

    if (result.success) {
      toast.success(isEdit ? 'Goal updated' : 'Goal created');
      onOpenChange(false);
      // Reset form for next add
      if (!isEdit) {
        setGoalType('revenue');
        setDescription('');
        setTier('must-have');
      }
    } else {
      toast.error(result.error ?? 'Something went wrong');
    }
  }

  const tierOptions: GoalTier[] = ['must-have', 'should-have', 'nice-to-have'];
  const tierColors: Record<GoalTier, string> = {
    'must-have': 'border-red-500 bg-red-500/10 text-red-400',
    'should-have': 'border-amber-500 bg-amber-500/10 text-amber-400',
    'nice-to-have': 'border-gray-500 bg-gray-500/10 text-gray-400',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal Type */}
          {!isEdit && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Type</label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as GoalType)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {BUSINESS_GOAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {getGoalTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="What do you want to achieve?"
              required
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/200</p>
          </div>

          {/* Tier */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Priority Tier</label>
            <div className="grid grid-cols-3 gap-2">
              {tierOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    tier === t
                      ? tierColors[t]
                      : 'border-border text-muted-foreground hover:border-foreground/30'
                  }`}
                >
                  {GOAL_TIERS[t].label}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !description.trim()}>
              {submitting ? 'Saving...' : isEdit ? 'Update' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
