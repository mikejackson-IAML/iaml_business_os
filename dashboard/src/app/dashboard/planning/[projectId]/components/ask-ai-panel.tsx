'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Button } from '@/dashboard-kit/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    id: string;
    content: string;
    memory_type: string;
    similarity: number;
  }>;
}

interface AskAIPanelProps {
  projectId: string;
}

export function AskAIPanel({ projectId }: AskAIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
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
          projectId,
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
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Ask AI
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0 p-3 pt-0">
        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-[200px] max-h-[400px]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Ask questions about this project</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                I&apos;ll search through your planning memories to find answers.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary/10 rounded-lg p-2 ml-4'
                    : 'bg-muted/50 rounded-lg p-2 mr-4'
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
                    {[...new Set(msg.sources.map((s) => s.memory_type))].map(
                      (type) => (
                        <Badge
                          key={type}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {type}
                        </Badge>
                      )
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="bg-muted/50 rounded-lg p-2 mr-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking...
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this project..."
            disabled={loading}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
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
            disabled={loading || !input.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
