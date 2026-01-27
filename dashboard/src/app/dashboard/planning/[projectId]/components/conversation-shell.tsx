'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { PhaseTransitionModal } from './phase-transition-modal';
import { ForceCompleteButton } from './force-complete-button';
import { ReadinessBadge } from './readiness-badge';
import { stripMarkers, INCUBATION_DURATIONS } from '@/lib/planning/phase-transitions';
import {
  getPhaseLabel,
  PHASE_ORDER,
} from '@/dashboard-kit/types/departments/planning';
import type {
  PlanningProject,
  PlanningPhase,
  PlanningConversation,
} from '@/dashboard-kit/types/departments/planning';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationShellProps {
  projectId: string;
  project: PlanningProject;
  phases: PlanningPhase[];
  initialConversations: PlanningConversation[];
  activeConversationId: string | null;
  initialMessages: ChatMessage[];
  onConversationsChange: (conversations: PlanningConversation[]) => void;
  onActiveConversationChange: (conversationId: string | null) => void;
}

export function ConversationShell({
  projectId,
  project,
  activeConversationId,
  initialMessages,
  onConversationsChange,
  onActiveConversationChange,
}: ConversationShellProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(activeConversationId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showTransition, setShowTransition] = useState(false);
  const [readinessResult, setReadinessResult] = useState<{ passed: boolean; reason?: string } | null>(null);
  const pendingConversationId = useRef<string | null>(null);
  const selfInitiatedChange = useRef(false);

  // Sync state when parent changes active conversation (sidebar clicks only)
  useEffect(() => {
    if (selfInitiatedChange.current) {
      selfInitiatedChange.current = false;
      return;
    }
    setConversationId(activeConversationId);
    setMessages(initialMessages);
    setStreamingContent('');
    setError(null);
    setShowTransition(false);
    setReadinessResult(null);
  }, [activeConversationId, initialMessages]);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/planning/conversations?projectId=${projectId}`);
      if (res.ok) {
        const convs = await res.json();
        onConversationsChange(convs);
      }
    } catch {
      // Silently fail on refresh
    }
  }, [projectId, onConversationsChange]);

  const handleSend = useCallback(
    async (message: string) => {
      // Add user message optimistically
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingContent('');
      setError(null);

      try {
        const res = await fetch('/api/planning/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            phaseType: project.current_phase,
            conversationId,
            message,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split('\n\n');
          // Keep last potentially incomplete chunk
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(trimmed.slice(6));

              if (data.type === 'conversation_created') {
                setConversationId(data.conversationId);
                pendingConversationId.current = data.conversationId;
                refreshConversations();
              } else if (data.type === 'text') {
                accumulated += data.content;
                setStreamingContent(stripMarkers(accumulated));
              } else if (data.type === 'phase_complete') {
                setShowTransition(true);
              } else if (data.type === 'readiness_result') {
                setReadinessResult({ passed: data.passed, reason: data.reason });
              } else if (data.type === 'done') {
                // Add completed assistant message with markers stripped
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: stripMarkers(accumulated),
                  },
                ]);
                setStreamingContent('');
                setIsStreaming(false);
                // Now safe to notify parent of new conversation ID
                if (pendingConversationId.current) {
                  selfInitiatedChange.current = true;
                  onActiveConversationChange(pendingConversationId.current);
                  pendingConversationId.current = null;
                }
                refreshConversations();
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Stream error');
              }
            } catch (parseErr) {
              // Skip malformed SSE lines
              if (parseErr instanceof SyntaxError) continue;
              throw parseErr;
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setIsStreaming(false);
        setStreamingContent('');
        if (pendingConversationId.current) {
          selfInitiatedChange.current = true;
          onActiveConversationChange(pendingConversationId.current);
          pendingConversationId.current = null;
        }
      }
    },
    [projectId, project.current_phase, conversationId, onActiveConversationChange, refreshConversations]
  );

  const currentPhaseIdx = PHASE_ORDER.indexOf(project.current_phase);
  const nextPhase = currentPhaseIdx < PHASE_ORDER.length - 1
    ? PHASE_ORDER[currentPhaseIdx + 1]
    : project.current_phase;

  return (
    <Card className="h-full min-h-[500px] flex flex-col">
      <CardHeader className="pb-2 border-b shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Conversation — {getPhaseLabel(project.current_phase)}
          </CardTitle>
          <ForceCompleteButton projectId={projectId} currentPhase={project.current_phase} />
        </div>
      </CardHeader>

      {readinessResult && (
        <div className="px-4 pt-2">
          <ReadinessBadge result={readinessResult} />
        </div>
      )}

      <MessageList
        messages={messages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
      />

      {error && (
        <div className="mx-4 mb-2 p-2 rounded bg-destructive/10 text-destructive text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 shrink-0">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={isStreaming} />

      <PhaseTransitionModal
        open={showTransition}
        onOpenChange={setShowTransition}
        projectId={projectId}
        currentPhase={project.current_phase}
        nextPhase={nextPhase}
        incubationHours={INCUBATION_DURATIONS[project.current_phase]}
        readinessResult={readinessResult}
      />
    </Card>
  );
}
