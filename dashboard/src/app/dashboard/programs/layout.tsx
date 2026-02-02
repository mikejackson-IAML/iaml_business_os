import { ChatProvider } from './chat-context';
import { ChatPanel } from './components/chat-panel/chat-panel';
import { ChatFab } from './components/chat-fab';

export default function ProgramsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      {children}
      <ChatPanel />
      <ChatFab />
    </ChatProvider>
  );
}
