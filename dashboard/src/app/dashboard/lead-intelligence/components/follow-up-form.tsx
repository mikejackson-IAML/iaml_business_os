'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Input } from '@/dashboard-kit/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FollowUpFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactIds: string[];
  onSuccess: () => void;
}

export function FollowUpForm({
  open,
  onOpenChange,
  contactIds,
  onSuccess,
}: FollowUpFormProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const isBulk = contactIds.length > 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setSubmitting(true);
    try {
      if (isBulk) {
        const res = await fetch('/api/lead-intelligence/bulk/follow-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactIds,
            title: title.trim(),
            description: description.trim() || undefined,
            due_date: dueDate,
            priority,
          }),
        });
        if (!res.ok) throw new Error('Failed to create follow-ups');
        const data = await res.json();
        toast.success(`Created ${data.created} follow-up task${data.created !== 1 ? 's' : ''}`);
      } else {
        const res = await fetch(`/api/lead-intelligence/contacts/${contactIds[0]}/follow-up`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            due_date: dueDate,
            priority,
          }),
        });
        if (!res.ok) throw new Error('Failed to create follow-up');
        toast.success('Follow-up task created');
      }

      // Reset form
      setTitle('');
      setDueDate('');
      setDescription('');
      setPriority('medium');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Follow-up form error:', err);
      toast.error('Failed to create follow-up task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isBulk ? `Set Follow-up for ${contactIds.length} Contacts` : 'Set Follow-up'}
          </DialogTitle>
          <DialogDescription>
            Create a follow-up task to track next steps.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="follow-up-title">Title *</Label>
            <Input
              id="follow-up-title"
              placeholder="e.g., Schedule intro call"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="follow-up-due">Due Date *</Label>
            <Input
              id="follow-up-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="follow-up-priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="follow-up-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="follow-up-desc">Description</Label>
            <Textarea
              id="follow-up-desc"
              placeholder="Optional notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !dueDate || submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isBulk ? `Create ${contactIds.length} Tasks` : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
