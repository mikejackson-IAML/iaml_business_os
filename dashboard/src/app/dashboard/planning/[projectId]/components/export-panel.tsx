'use client';

import { useState } from 'react';
import { Download, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';

interface ExportPanelProps {
  projectId: string;
  projectName: string;
  hasGsdDocs: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ExportPanel({ projectId, projectName, hasGsdDocs }: ExportPanelProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/planning/documents/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch documents');
      }

      const { documents } = await res.json();

      // Dynamic imports for client-side only libs
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');

      const zip = new JSZip();
      const planningFolder = zip.folder('.planning')!;

      for (const doc of documents) {
        const filePath: string = doc.file_path || '';
        // file_path looks like ".planning/PROJECT.md" or ".planning/references/icp.md"
        const relativePath = filePath.replace(/^\.planning\//, '');
        if (relativePath) {
          planningFolder.file(relativePath, doc.content || '');
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${slugify(projectName)}-planning.zip`);
    } catch (err) {
      console.error('ZIP download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyCommand = async () => {
    const command = `claude "Initialize project from .planning/ - read PROJECT.md, REQUIREMENTS.md, and ROADMAP.md to understand scope, then create the implementation plan"`;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="pt-3 mt-3 border-t">
      <p className="text-xs font-medium text-muted-foreground mb-2">Export GSD Package</p>
      {!hasGsdDocs ? (
        <p className="text-xs text-muted-foreground/70">
          Complete the PACKAGE phase to generate GSD documents for export.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={handleDownloadZip}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {downloading ? 'Generating ZIP...' : 'Download .planning/ ZIP'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={handleCopyCommand}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? 'Copied!' : 'Copy Claude Code Command'}
          </Button>
        </div>
      )}
    </div>
  );
}
