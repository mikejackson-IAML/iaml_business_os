'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Sparkles, Send, Loader2, X, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Button } from '@/dashboard-kit/components/ui/button';

interface Source {
  id: string;
  content: string;
  memory_type: string;
  similarity: number;
  project_id?: string;
  project_title?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export function GlobalSearchModal() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const userMessage: Message = { role: 'user', content: question };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = updatedMessages
        .filter((m) => !m.sources)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/planning/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          // No projectId — cross-project search
          conversationHistory: conversationHistory.slice(0, -1),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const resetConversation = () => {
    setMessages([]);
    setInput('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-background rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any project..."
              disabled={loading}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={loading || !input.trim()}
              className="shrink-0 h-7 w-7 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetConversation}
              className="shrink-0 h-7 w-7 p-0"
              title="New conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="shrink-0 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="max-h-[50vh] overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                Search across all projects
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Ask questions and I&apos;ll find answers from your planning memories.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary/10 rounded-lg p-3 ml-8'
                    : 'bg-muted/50 rounded-lg p-3 mr-8'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/50">
                    {(() => {
                      // Deduplicate by project_title + memory_type
                      const seen = new Set<string>();
                      const uniqueSources: Array<{ project_title: string; memory_type: string }> = [];
                      for (const s of msg.sources!) {
                        const key = `${s.project_title || 'Unknown'}:${s.memory_type}`;
                        if (!seen.has(key)) {
                          seen.add(key);
                          uniqueSources.push({
                            project_title: s.project_title || 'Unknown',
                            memory_type: s.memory_type,
                          });
                        }
                      }
                      return uniqueSources.map((s) => (
                        <Badge
                          key={`${s.project_title}:${s.memory_type}`}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {s.project_title} / {s.memory_type}
                        </Badge>
                      ));
                    })()}
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="bg-muted/50 rounded-lg p-3 mr-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching across all projects...
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-border/50 text-center">
          <p className="text-[11px] text-muted-foreground/60">
            <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">
              {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? 'Cmd' : 'Ctrl'}+K
            </kbd>{' '}
            to toggle &middot; searches across all projects
          </p>
        </div>
      </div>
    </div>
  );
}
