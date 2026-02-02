'use client';

import { useEffect, useRef } from 'react';
import { useProgramsChat, ChatMessage } from '../../chat-context';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageContent({ message }: { message: ChatMessage }) {
  const hasData = message.data && message.data.result && message.data.result.length > 0;

  return (
    <div className="space-y-2">
      {message.content && (
        <div className="whitespace-pre-wrap">{message.content}</div>
      )}
      {hasData && (
        <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
          {message.data!.format === 'table' && (
            <span>[Table: {message.data!.result.length} rows]</span>
          )}
          {message.data!.format === 'chart' && (
            <span>[Chart: {message.data!.chartConfig?.title || 'Bar chart'}]</span>
          )}
          {message.data!.format === 'text' && (
            <span className="text-primary font-medium text-sm">
              {String(message.data!.result[0]?.value ?? message.data!.result[0])}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 p-3 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Thinking...</span>
    </div>
  );
}

export function ChatMessages() {
  const { messages, isLoading } = useProgramsChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const showTypingIndicator = isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user';

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex flex-col max-w-[85%]",
            message.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
          )}
        >
          <div
            className={cn(
              "rounded-lg px-4 py-2 text-sm",
              message.role === 'user'
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            <MessageContent message={message} />
          </div>
          <span className="text-xs text-muted-foreground mt-1">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      ))}

      {showTypingIndicator && (
        <div className="mr-auto">
          <TypingIndicator />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
