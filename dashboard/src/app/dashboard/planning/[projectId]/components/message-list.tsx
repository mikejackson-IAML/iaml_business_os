'use client';

import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: ChatMessage[];
  streamingContent?: string;
  isStreaming: boolean;
}

export function MessageList({ messages, streamingContent, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Start a conversation
            </h3>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-[240px]">
              Begin planning your idea with AI-guided conversations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          data-testid={`message-${msg.role}`}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            {msg.role === 'assistant' ? (
              <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            )}
          </div>
        </div>
      ))}

      {isStreaming && streamingContent !== undefined && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
            <p className="text-sm whitespace-pre-wrap">
              {streamingContent}
              <span className="inline-block w-2 h-4 ml-0.5 bg-foreground/70 animate-pulse rounded-sm" />
            </p>
          </div>
        </div>
      )}

      {isStreaming && !streamingContent && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
