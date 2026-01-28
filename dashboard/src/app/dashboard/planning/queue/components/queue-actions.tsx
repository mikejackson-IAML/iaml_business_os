'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Rocket, Download, Copy, Check, Loader2 } from 'lucide-react';
import { startBuildAction } from '@/app/dashboard/planning/actions';
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

interface QueueActionsProps {
  projectId: string;
  projectTitle: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function QueueActions({ projectId, projectTitle }: QueueActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  function handleStartBuild() {
    setBuildError(null);
    startTransition(async () => {
      const result = await startBuildAction(projectId);
      if (result.success) {
        router.push('/dashboard/planning');
      } else {
        setBuildError(result.error || 'Failed to start build');
      }
    });
  }

  async function handleDownloadZip() {
    setDownloading(true);
    try {
      const res = await fetch('/api/planning/documents/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
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
      saveAs(blob, `${slugify(projectTitle)}-planning.zip`);
    } catch (err) {
      console.error('ZIP download error:', err);
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyCommand() {
    const command = `claude "Start building ${projectTitle} — see .planning/ for project docs"`;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }

  return (
    <div className="shrink-0 flex items-center gap-1">
      {/* View */}
      <Link
        href={`/dashboard/planning/${projectId}`}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border hover:bg-accent transition-colors"
      >
        <Eye className="h-3.5 w-3.5" />
        View
      </Link>

      {/* Start Build with confirmation */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            disabled={isPending}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border hover:bg-accent transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Rocket className="h-3.5 w-3.5" />
            )}
            Build
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start building {projectTitle}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the project to active builds. You can track progress from the pipeline view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {buildError && (
            <p className="text-sm text-red-500">{buildError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartBuild} disabled={isPending}>
              {isPending ? 'Starting...' : 'Start Build'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border hover:bg-accent transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
    </div>
  );
}
