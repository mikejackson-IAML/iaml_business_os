'use client';

import { MessageSquare } from 'lucide-react';

const EXAMPLE_QUERIES = [
  "Compare Austin ERL 2025 vs 2024",
  "Which companies sent the most attendees?",
  "Average revenue per program by city",
  "Show all upcoming programs with low enrollment"
];

interface ExampleQueriesProps {
  onSelect: (query: string) => void;
}

export function ExampleQueries({ onSelect }: ExampleQueriesProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">Programs AI Assistant</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ask questions about your programs in plain English. I can query registrations,
          compare programs, analyze attendance, and more.
        </p>
      </div>

      <div className="w-full max-w-md space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">
          Try asking
        </p>
        <div className="grid gap-2">
          {EXAMPLE_QUERIES.map((query) => (
            <button
              key={query}
              onClick={() => onSelect(query)}
              className="text-left p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-colors text-sm"
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
