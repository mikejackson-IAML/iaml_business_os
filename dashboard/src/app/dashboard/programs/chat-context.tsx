'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: {
    result: Record<string, unknown>[];
    format: 'table' | 'chart' | 'text';
    chartConfig?: {
      type: 'bar';
      xKey: string;
      yKey: string;
      title?: string;
    };
  };
  timestamp: Date;
}

interface ChatContextValue {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  programContext: { id: string; name: string } | null;

  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setProgramContext: (context: { id: string; name: string } | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [programContext, setProgramContextState] = useState<{ id: string; name: string } | null>(null);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const id = crypto.randomUUID();
    setMessages(prev => [...prev, { ...message, id, timestamp: new Date() }]);
    return id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);
  const setLoading = useCallback((loading: boolean) => setIsLoading(loading), []);
  const setProgramContext = useCallback((context: { id: string; name: string } | null) => {
    setProgramContextState(context);
  }, []);

  return (
    <ChatContext.Provider value={{
      messages, isOpen, isLoading, programContext,
      openChat, closeChat, toggleChat, addMessage, updateMessage,
      clearMessages, setLoading, setProgramContext
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useProgramsChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useProgramsChat must be used within ChatProvider');
  }
  return context;
}
