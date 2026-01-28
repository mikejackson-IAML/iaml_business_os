'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { DocPreviewModal } from './doc-preview-modal';
import { DOC_TYPE_LABELS } from '@/lib/planning/doc-templates';
import { ExportPanel } from './export-panel';
import type { PlanningDocument } from '@/dashboard-kit/types/departments/planning';

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

interface DocumentsPanelProps {
  documents: PlanningDocument[];
  projectId: string;
  projectName: string;
  onDocumentsChanged?: () => void;
}

export function DocumentsPanel({ documents, projectId, projectName, onDocumentsChanged }: DocumentsPanelProps) {
  const [selectedDoc, setSelectedDoc] = useState<PlanningDocument | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDocClick = (doc: PlanningDocument) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  const handleDocumentUpdated = () => {
    onDocumentsChanged?.();
  };

  return (
    <>
      <Card data-testid="documents-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">No documents yet</p>
              <p className="text-xs text-muted-foreground">Documents will appear as you progress through planning.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  data-testid="document-item"
                  onClick={() => handleDocClick(doc)}
                  className="w-full text-left p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                    </p>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      v{doc.version}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(doc.updated_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
          <ExportPanel
            projectId={projectId}
            projectName={projectName}
            hasGsdDocs={documents.some((d) => d.doc_type.startsWith('gsd_'))}
          />
        </CardContent>
      </Card>

      <DocPreviewModal
        document={selectedDoc}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onDocumentUpdated={handleDocumentUpdated}
      />
    </>
  );
}
