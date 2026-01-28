'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';

interface Note {
  id: string;
  note_type: string;
  content: string;
  created_at: string;
}

const NOTE_TYPES = ['general', 'call', 'meeting', 'email'] as const;

export function NotesTab({ companyId }: { companyId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteType, setNoteType] = useState<string>('general');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function fetchNotes() {
    try {
      const res = await fetch(`/api/lead-intelligence/companies/${companyId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : []);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, [companyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/lead-intelligence/companies/${companyId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_type: noteType, content: content.trim() }),
      });
      if (res.ok) {
        setContent('');
        await fetchNotes();
      }
    } catch {
      // fail silently
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              {NOTE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNoteType(type)}
                  className={`rounded-md px-3 py-1 text-sm capitalize transition-colors ${
                    noteType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a note about this company..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={!content.trim() || submitting}>
                {submitting ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notes Timeline */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No notes yet</div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="capitalize">
                    {note.note_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
