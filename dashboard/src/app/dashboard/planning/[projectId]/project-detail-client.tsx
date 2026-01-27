'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SessionsPanel } from './components/sessions-panel';
import { DocumentsPanel } from './components/documents-panel';
import { ResearchPanel } from './components/research-panel';
import { AskAIPanel } from './components/ask-ai-panel';
import { ConversationShell } from './components/conversation-shell';
import { IncubationOverlay } from './components/incubation-overlay';
import { PhaseProgressBar } from './components/phase-progress-bar';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { navigateToPhaseAction } from '../actions';
import type {
  PlanningProject,
  PlanningPhase,
  PlanningConversation,
  PlanningDocument,
  PlanningResearch,
  PhaseType,
} from '@/dashboard-kit/types/departments/planning';
import { isIncubating, PHASE_ORDER } from '@/dashboard-kit/types/departments/planning';

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
  const router = useRouter();
  const [conversations, setConversations] = useState<PlanningConversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<
    { id: string; role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [pendingPhaseNav, setPendingPhaseNav] = useState<PhaseType | null>(null);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'sessions' | 'ask-ai'>('sessions');

  const handlePhaseClick = useCallback((targetPhase: PhaseType) => {
    const targetIdx = PHASE_ORDER.indexOf(targetPhase);
    const currentIdx = PHASE_ORDER.indexOf(project.current_phase);

    if (targetIdx > currentIdx) {
      // Forward skip -- show warning
      setPendingPhaseNav(targetPhase);
      setShowSkipWarning(true);
    } else {
      // Backward navigation -- proceed directly
      navigateToPhaseAction(project.id, targetPhase).then(() => {
        router.refresh();
      });
    }
  }, [project.id, project.current_phase, router]);

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
    <>
      <Card>
        <CardContent className="p-4">
          <PhaseProgressBar
            phases={phases}
            currentPhase={project.current_phase}
            project={project}
            onPhaseClick={handlePhaseClick}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="space-y-4">
          {/* Sidebar tab switcher */}
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            <button
              type="button"
              onClick={() => setSidebarTab('sessions')}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                sidebarTab === 'sessions'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sessions
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('ask-ai')}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                sidebarTab === 'ask-ai'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ask AI
            </button>
          </div>

          {sidebarTab === 'sessions' ? (
            <>
              <SessionsPanel
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectSession={handleSelectSession}
                onNewSession={handleNewSession}
              />
              <DocumentsPanel documents={documents} projectId={project.id} projectName={project.title} />
              <ResearchPanel research={research} projectId={project.id} />
            </>
          ) : (
            <AskAIPanel projectId={project.id} />
          )}
        </div>

        {/* Main Conversation Area */}
        <div className="lg:col-span-3">
          {isIncubating(project) ? (
            <IncubationOverlay project={project} />
          ) : (
            <ConversationShell
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

      {/* Skip ahead warning dialog */}
      <AlertDialog open={showSkipWarning} onOpenChange={setShowSkipWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip ahead?</AlertDialogTitle>
            <AlertDialogDescription>
              Earlier phases aren&apos;t complete yet. Skipping ahead means you
              may miss important planning steps. You can always go back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingPhaseNav) {
                  await navigateToPhaseAction(project.id, pendingPhaseNav);
                  router.refresh();
                }
                setPendingPhaseNav(null);
              }}
            >
              Skip ahead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
