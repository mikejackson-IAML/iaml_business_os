'use client';

import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import type { PlanningDocument, DocumentType } from '@/dashboard-kit/types/departments/planning';

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

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  icp: 'ICP Profile',
  lean_canvas: 'Lean Canvas',
  problem_statement: 'Problem Statement',
  feature_spec: 'Feature Spec',
  technical_scope: 'Technical Scope',
  competitive_intel: 'Competitive Intel',
  gsd_project: 'PROJECT.md',
  gsd_requirements: 'REQUIREMENTS.md',
  gsd_roadmap: 'ROADMAP.md',
};

interface DocumentsPanelProps {
  documents: PlanningDocument[];
}

export function DocumentsPanel({ documents }: DocumentsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Documents will be generated during planning conversations
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
