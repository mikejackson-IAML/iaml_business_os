'use client';

import { useState } from 'react';
import { Copy, Check, Terminal, X } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import type { DevProjectSummary } from '@/dashboard-kit/types/departments/development';

interface LaunchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: DevProjectSummary | null;
  command: string;
}

export function LaunchModal({ open, onOpenChange, project, command }: LaunchModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const commands = command.split('\n').filter(Boolean);
  const isMultiple = commands.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              {project ? `Launch ${project.project_name}` : 'Launch All Ready'}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {isMultiple
              ? 'Copy these commands and run them in separate terminals.'
              : 'Copy this command and run it in your terminal.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project path hint */}
          {project && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Directory:</span>{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                ~/Projects/{project.project_key}
              </code>
            </div>
          )}

          {/* Command(s) */}
          <div className="space-y-2">
            {commands.map((cmd, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm"
              >
                <span className="text-muted-foreground">$</span>
                <code className="flex-1 break-all">{cmd}</code>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleCopy} className="flex items-center gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy {isMultiple ? 'All' : 'Command'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
