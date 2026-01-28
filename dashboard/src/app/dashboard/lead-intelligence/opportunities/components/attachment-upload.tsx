'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, FileImage, File, Trash2, Download, Loader2, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import { toast } from 'sonner';
import type { OpportunityAttachment } from '@/lib/api/lead-intelligence-opportunities-types';

interface AttachmentWithSignedUrl extends OpportunityAttachment {
  signed_url?: string | null;
}

interface AttachmentUploadProps {
  opportunityId: string;
  attachments: AttachmentWithSignedUrl[];
  onUpdate: () => void;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPT = '.pdf,.docx,.xlsx,.jpg,.jpeg,.png,.gif';

function formatFileSize(bytes: number | null): string {
  if (bytes == null || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return <File className="h-4 w-4" />;
  if (fileType.startsWith('image/')) return <FileImage className="h-4 w-4" />;
  if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
  return <File className="h-4 w-4" />;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function AttachmentUpload({ opportunityId, attachments, onUpdate }: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (file.size > MAX_SIZE) {
      toast.error('File exceeds 10MB limit');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/lead-intelligence/opportunities/' + opportunityId + '/attachments', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      toast.success('Uploaded ' + file.name);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [opportunityId, onUpdate]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  async function handleDelete(attachmentId: string) {
    setDeleting(attachmentId);
    try {
      const res = await fetch('/api/lead-intelligence/opportunities/' + opportunityId + '/attachments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachment_id: attachmentId }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Attachment deleted');
      onUpdate();
    } catch {
      toast.error('Failed to delete attachment');
    } finally {
      setDeleting(null);
    }
  }

  function handleDownload(att: AttachmentWithSignedUrl) {
    if (att.signed_url) {
      window.open(att.signed_url, '_blank');
    } else {
      toast.error('Download URL not available');
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Attachments ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={
            'border-2 border-dashed rounded-md p-6 text-center transition-colors ' +
            (dragOver ? 'border-primary bg-primary/5' : 'border-border')
          }
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop a file here, or
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, DOCX, XLSX, JPG, PNG (max 10MB)
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Attachment List */}
        {attachments.length > 0 && (
          <div className="divide-y">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3 py-2">
                <div className="text-muted-foreground shrink-0">
                  {getFileIcon(att.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{att.file_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(att.file_size)}</span>
                    <span>{formatDate(att.uploaded_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDownload(att)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(att.id)}
                    disabled={deleting === att.id}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    {deleting === att.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
