'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { DocVersionSelector } from './doc-version-selector';
import { DocEditor } from './doc-editor';
import { DOC_TYPE_LABELS } from '@/lib/planning/doc-templates';
import type { DocumentType } from '@/dashboard-kit/types/departments/planning';

interface DocPreviewModalProps {
  document: {
    id: string;
    doc_type: DocumentType;
    content: string;
    version: number;
    project_id: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUpdated: () => void;
}

export function DocPreviewModal({
  document,
  open,
  onOpenChange,
  onDocumentUpdated,
}: DocPreviewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState('');
  const [currentVersion, setCurrentVersion] = useState(1);
  const [currentDocId, setCurrentDocId] = useState('');

  // Sync state when document prop changes
  useEffect(() => {
    if (document) {
      setCurrentContent(document.content);
      setCurrentVersion(document.version);
      setCurrentDocId(document.id);
      setIsEditing(false);
    }
  }, [document]);

  if (!document) return null;

  const handleVersionSelect = async (version: { id: string; version: number }) => {
    try {
      const res = await fetch(
        `/api/planning/documents/_list?projectId=${document.project_id}&docType=${document.doc_type}&version=${version.version}`
      );
      const data = await res.json();
      if (data.content) {
        setCurrentContent(data.content);
        setCurrentVersion(data.version);
        setCurrentDocId(data.id);
      }
    } catch (err) {
      console.error('Failed to load version:', err);
    }
  };

  const handleSaved = (newDoc: { id: string; version: number; content: string }) => {
    setCurrentContent(newDoc.content);
    setCurrentVersion(newDoc.version);
    setCurrentDocId(newDoc.id);
    setIsEditing(false);
    onDocumentUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-8">
            <div className="flex items-center gap-2">
              <DialogTitle>
                {DOC_TYPE_LABELS[document.doc_type] || document.doc_type}
              </DialogTitle>
              <Badge variant="secondary" className="text-[10px]">
                v{currentVersion}
              </Badge>
            </div>
            <DocVersionSelector
              projectId={document.project_id}
              docType={document.doc_type}
              currentVersion={currentVersion}
              onVersionSelect={handleVersionSelect}
            />
          </div>
          <DialogDescription className="sr-only">
            Document preview and editor
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isEditing ? (
            <DocEditor
              initialContent={currentContent}
              docId={currentDocId}
              onSaved={handleSaved}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none px-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isEditing && (
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
