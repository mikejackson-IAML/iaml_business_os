'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DocEditorProps {
  initialContent: string;
  docId: string;
  onSaved: (newDoc: { id: string; version: number; content: string }) => void;
  onCancel: () => void;
}

export function DocEditor({ initialContent, docId, onSaved, onCancel }: DocEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/planning/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      onSaved({ id: data.id, version: data.version, content: data.content });
    } catch (err) {
      console.error('Failed to save document:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 min-h-[400px] w-full font-mono text-sm bg-muted/50 border border-border rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}
