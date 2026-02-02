'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useProgramsChat } from '../../chat-context';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import { ExampleQueries } from './example-queries';

export function ChatPanel() {
  const {
    isOpen,
    closeChat,
    messages,
    isLoading,
    addMessage,
    setLoading,
    updateMessage,
    programContext
  } = useProgramsChat();

  const handleSend = async (content: string) => {
    // Add user message
    addMessage({ role: 'user', content });
    setLoading(true);

    // Add placeholder assistant message for streaming
    const assistantId = addMessage({ role: 'assistant', content: '' });

    try {
      const response = await fetch('/api/programs/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }].map(m => ({ role: m.role, content: m.content })),
          programId: programContext?.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let dataResult: { result: Record<string, unknown>[]; format: 'table' | 'chart' | 'text'; chartConfig?: { type: 'bar'; xKey: string; yKey: string; title?: string } } | null = null;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.type === 'text') {
              fullContent += json.content;
              updateMessage(assistantId, { content: fullContent });
            } else if (json.type === 'data') {
              dataResult = {
                result: json.result,
                format: json.format || 'table',
                chartConfig: json.chartConfig
              };
            } else if (json.type === 'error') {
              updateMessage(assistantId, { content: `Error: ${json.message}` });
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      if (dataResult) {
        updateMessage(assistantId, { content: fullContent, data: dataResult });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateMessage(assistantId, { content: `Sorry, something went wrong: ${errorMessage}. Please try again.` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && closeChat()}>
      <SheetContent className="w-full sm:w-[750px] flex flex-col p-0">
        <SheetHeader className="p-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            Programs AI Assistant
            {programContext && (
              <span className="text-sm font-normal text-muted-foreground">
                - {programContext.name}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {messages.length === 0 ? (
            <ExampleQueries onSelect={handleSend} />
          ) : (
            <ChatMessages />
          )}
        </div>

        <ChatInput onSend={handleSend} disabled={isLoading} placeholder="Ask about programs..." />
      </SheetContent>
    </Sheet>
  );
}
