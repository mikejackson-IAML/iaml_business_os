'use client';

import { MessageSquare, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Input } from '@/dashboard-kit/components/ui/input';

export function ConversationShell() {
  return (
    <Card className="h-full min-h-[500px] flex flex-col">
      <CardHeader className="pb-2 border-b shrink-0">
        <CardTitle className="text-sm font-medium">Conversation</CardTitle>
      </CardHeader>

      {/* Messages area - grows to fill */}
      <CardContent className="flex-1 flex items-center justify-center">
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
      </CardContent>

      {/* Input area - stays at bottom */}
      <div className="p-4 border-t shrink-0">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            disabled
            className="flex-1"
          />
          <Button size="icon" variant="ghost" disabled>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
