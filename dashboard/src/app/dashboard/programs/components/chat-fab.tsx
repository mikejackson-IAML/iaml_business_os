'use client';

import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { useProgramsChat } from '../chat-context';

export function ChatFab() {
  const { isOpen, toggleChat, messages } = useProgramsChat();

  return (
    <Button
      onClick={toggleChat}
      size="lg"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
      variant={isOpen ? 'secondary' : 'default'}
    >
      {isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <div className="relative">
          <MessageSquare className="h-6 w-6" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500" />
          )}
        </div>
      )}
      <span className="sr-only">{isOpen ? 'Close chat' : 'Open AI chat'}</span>
    </Button>
  );
}
