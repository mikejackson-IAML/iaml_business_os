'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LogisticsCard, StatusIndicator } from './logistics-card';
import type { ProgramLogistics } from '@/lib/api/programs-queries';

interface BEOCardProps {
  programId: string;
  logistics: ProgramLogistics;
  onUpdate: () => void;
}

export function BEOCard({ programId, logistics, onUpdate }: BEOCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasFile = !!logistics.beo_url;
  const isFinal = logistics.beo_status === 'final';

  let status: StatusIndicator = 'incomplete';
  let summary = 'Not uploaded';

  if (hasFile && isFinal) {
    status = 'complete';
    summary = `${logistics.beo_file_name || 'BEO'} (final)`;
  } else if (hasFile) {
    status = 'warning';
    summary = `${logistics.beo_file_name || 'BEO'} (draft)`;
  }

  async function handleUpload(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File exceeds 10MB limit');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'beo');

      const res = await fetch(`/api/programs/${programId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast.success('BEO uploaded');
        onUpdate();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!logistics.beo_url) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/programs/${programId}/attachments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storage_path: logistics.beo_url,
          type: 'beo',
        }),
      });

      if (res.ok) {
        toast.success('BEO deleted');
        onUpdate();
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload() {
    if (!logistics.beo_url) return;

    try {
      const res = await fetch(`/api/programs/${programId}/attachments?path=${encodeURIComponent(logistics.beo_url)}`);
      const data = await res.json();

      if (data.signed_url) {
        window.open(data.signed_url, '_blank');
      } else {
        toast.error('Could not get download link');
      }
    } catch {
      toast.error('Download failed');
    }
  }

  async function toggleStatus() {
    const newStatus = logistics.beo_status === 'final' ? 'draft' : 'final';
    try {
      const res = await fetch(`/api/programs/${programId}/logistics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'beo_status', value: newStatus }),
      });

      if (res.ok) {
        toast.success(`BEO marked as ${newStatus}`);
        onUpdate();
      }
    } catch {
      toast.error('Failed to update status');
    }
  }

  return (
    <LogisticsCard
      title="BEO (Banquet Event Order)"
      icon={<FileText className="h-4 w-4 text-orange-500" />}
      statusSummary={summary}
      statusIndicator={status}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div className="space-y-3">
        {hasFile ? (
          <>
            {/* File info */}
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="text-sm truncate">{logistics.beo_file_name}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={handleDownload}
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-1.5 text-muted-foreground hover:text-destructive"
                  title="Delete"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Status toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Status:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleStatus}
                  className={`px-3 py-1 text-xs rounded-full ${
                    isFinal
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {isFinal ? 'Final' : 'Draft'}
                </button>
              </div>
            </div>

            {logistics.beo_uploaded_at && (
              <p className="text-xs text-muted-foreground">
                Uploaded {new Date(logistics.beo_uploaded_at).toLocaleDateString()}
              </p>
            )}
          </>
        ) : (
          /* Upload dropzone */
          <div
            className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Uploading...</span>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload BEO document
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOCX (max 10MB)
                </p>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>
    </LogisticsCard>
  );
}
