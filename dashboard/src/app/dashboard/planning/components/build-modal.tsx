'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Eye,
  Download,
  Copy,
  Check,
  Loader2,
  Rocket,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BuildProject } from '@/dashboard-kit/types/departments/planning';
import { formatBuildDuration } from '@/dashboard-kit/types/departments/planning';
import { updateBuildProgressAction, markShippedAction } from '../actions';

interface BuildModalProps {
  project: BuildProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function BuildModal({
  project,
  open,
  onOpenChange,
  onProjectUpdated,
}: BuildModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(project.build_phase || 1);
  const [totalPhases, setTotalPhases] = useState(project.build_total_phases || 8);
  const [isPending, startTransition] = useTransition();

  const hasPhaseInfo =
    project.build_phase != null && project.build_total_phases != null;

  function handleSaveProgress() {
    startTransition(async () => {
      const result = await updateBuildProgressAction(project.id, currentPhase, totalPhases);
      if (result.success) {
        setIsEditingProgress(false);
        onProjectUpdated();
      }
    });
  }

  function handleMarkShipped() {
    startTransition(async () => {
      const result = await markShippedAction(project.id);
      if (result.success) {
        onOpenChange(false);
        onProjectUpdated();
      }
    });
  }

  const claudeCommand = `claude "Continue building ${project.title} -- see .planning/ for project docs"`;

  async function handleDownloadZip() {
    setDownloading(true);
    try {
      const res = await fetch('/api/planning/documents/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (!res.ok) throw new Error('Failed to fetch documents');

      const { documents } = await res.json();

      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');

      const zip = new JSZip();
      const planningFolder = zip.folder('.planning')!;

      for (const doc of documents) {
        const filePath: string = doc.file_path || '';
        const relativePath = filePath.replace(/^\.planning\//, '');
        if (relativePath) {
          planningFolder.file(relativePath, doc.content || '');
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${slugify(project.title)}-planning.zip`);
    } catch (err) {
      console.error('ZIP download error:', err);
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyCommand() {
    try {
      await navigator.clipboard.writeText(claudeCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg">{project.title}</DialogTitle>
            <Badge className="bg-blue-500 text-white text-xs">Building</Badge>
          </div>
          <DialogDescription className="sr-only">
            Build progress and actions for {project.title}
          </DialogDescription>
        </DialogHeader>

        {/* One-liner */}
        {project.one_liner && (
          <p className="text-sm text-muted-foreground -mt-2">
            {project.one_liner}
          </p>
        )}

        {/* Progress Stepper */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Build Progress</h4>
          {isEditingProgress ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm">Phase</span>
              <input
                type="number"
                min={1}
                max={totalPhases}
                value={currentPhase}
                onChange={(e) => setCurrentPhase(Math.max(1, Math.min(totalPhases, parseInt(e.target.value) || 1)))}
                className="w-16 px-2 py-1 text-sm border rounded bg-background"
              />
              <span className="text-sm">of</span>
              <input
                type="number"
                min={1}
                max={20}
                value={totalPhases}
                onChange={(e) => {
                  const newTotal = Math.max(1, Math.min(20, parseInt(e.target.value) || 8));
                  setTotalPhases(newTotal);
                  if (currentPhase > newTotal) setCurrentPhase(newTotal);
                }}
                className="w-16 px-2 py-1 text-sm border rounded bg-background"
              />
              <Button size="sm" onClick={handleSaveProgress} disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingProgress(false)}>
                Cancel
              </Button>
            </div>
          ) : hasPhaseInfo ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Phase {project.build_phase} of {project.build_total_phases}
              </p>
              {/* Visual stepper */}
              <div className="flex items-center gap-1">
                {Array.from({ length: project.build_total_phases! }).map(
                  (_, i) => {
                    const phaseNum = i + 1;
                    const isCompleted = phaseNum < project.build_phase!;
                    const isCurrent = phaseNum === project.build_phase!;
                    return (
                      <div key={i} className="flex items-center">
                        {/* Circle */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isCurrent
                                ? 'bg-blue-500 text-white animate-pulse'
                                : 'border-2 border-gray-300 dark:border-gray-600 text-muted-foreground'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            phaseNum
                          )}
                        </div>
                        {/* Connecting line */}
                        {i < project.build_total_phases! - 1 && (
                          <div
                            className={`w-4 h-0.5 ${
                              isCompleted
                                ? 'bg-green-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Progress not set</p>
          )}
        </div>

        {/* Build Duration */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Duration</span>
          <span>{formatBuildDuration(project.build_started_at)}</span>
        </div>

        {/* Last Activity */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last activity</span>
          <span>{formatRelativeTime(project.updated_at)}</span>
        </div>

        {/* Claude Code Command */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Claude Code Command</h4>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 text-xs bg-muted rounded font-mono overflow-x-auto">
              {claudeCommand}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCommand}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {/* View Project */}
          <Link
            href={`/dashboard/planning/${project.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border hover:bg-accent transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Project
          </Link>

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleDownloadZip} disabled={downloading}>
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-2" />
                )}
                {downloading ? 'Generating...' : 'Download ZIP'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyCommand}>
                {copied ? (
                  <Check className="h-3.5 w-3.5 mr-2 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-2" />
                )}
                {copied ? 'Copied!' : 'Copy Claude Code Command'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Update Progress */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentPhase(project.build_phase || 1);
              setTotalPhases(project.build_total_phases || 8);
              setIsEditingProgress(true);
            }}
            disabled={isEditingProgress}
          >
            <ArrowRight className="h-4 w-4 mr-1.5" />
            Update
          </Button>

          {/* Mark Shipped */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" size="sm" disabled={isPending}>
                <Rocket className="h-4 w-4 mr-1.5" />
                Shipped
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark as Shipped?</AlertDialogTitle>
                <AlertDialogDescription>
                  Mark &quot;{project.title}&quot; as shipped? This will move it to the Shipped column.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkShipped} disabled={isPending}>
                  {isPending ? 'Shipping...' : 'Ship It!'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
