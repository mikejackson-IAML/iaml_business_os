'use client';

import { useState, useCallback } from 'react';
import { SessionsPanel } from './components/sessions-panel';
import { DocumentsPanel } from './components/documents-panel';
import { ResearchPanel } from './components/research-panel';
import { ConversationShell } from './components/conversation-shell';
import { IncubationOverlay } from './components/incubation-overlay';
import type {
  PlanningProject,
  PlanningPhase,
  PlanningConversation,
  PlanningDocument,
  PlanningResearch,
} from '@/dashboard-kit/types/departments/planning';
import { isIncubating } from '@/dashboard-kit/types/departments/planning';

interface ProjectDetailClientProps {
  project: PlanningProject;
  phases: PlanningPhase[];
  conversations: PlanningConversation[];
  documents: PlanningDocument[];
  research: PlanningResearch[];
}

export function ProjectDetailClient({
  project,
  phases,
  conversations: initialConversations,
  documents,
  research,
}: ProjectDetailClientProps) {
  const [conversations, setConversations] = useState<PlanningConversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<
    { id: string; role: 'user' | 'assistant'; content: string }[]
  >([]);

  const handleSelectSession = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    // Fetch messages for this conversation
    try {
      const res = await fetch(`/api/planning/conversations/${conversationId}/messages`);
      if (res.ok) {
        const msgs = await res.json();
        setActiveMessages(
          msgs.map((m: { id: string; role: string; content: string }) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
        );
      }
    } catch {
      // If fetch fails, show empty
      setActiveMessages([]);
    }
  }, []);

  const handleNewSession = useCallback(() => {
    setActiveConversationId(null);
    setActiveMessages([]);
  }, []);

  const handleConversationsChange = useCallback((newConversations: PlanningConversation[]) => {
    setConversations(newConversations);
  }, []);

  const handleActiveConversationChange = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Sidebar */}
      <div className="space-y-4">
        <SessionsPanel
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
        />
        <DocumentsPanel documents={documents} />
        <ResearchPanel research={research} />
      </div>

      {/* Main Conversation Area */}
      <div className="lg:col-span-3">
        {isIncubating(project) ? (
          <IncubationOverlay project={project} />
        ) : (
          <ConversationShell
            key={activeConversationId || 'new'}
            projectId={project.id}
            project={project}
            phases={phases}
            initialConversations={conversations}
            activeConversationId={activeConversationId}
            initialMessages={activeMessages}
            onConversationsChange={handleConversationsChange}
            onActiveConversationChange={handleActiveConversationChange}
          />
        )}
      </div>
    </div>
  );
}
