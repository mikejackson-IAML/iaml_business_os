'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { Input } from '@/dashboard-kit/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import type { ContactListParams } from '@/lib/api/lead-intelligence-contacts-types';
import type { AISearchResult } from '@/lib/api/lead-intelligence-ai-types';

const PLACEHOLDER_EXAMPLES = [
  'Try: attorneys in Florida',
  'Try: VIP contacts at large companies',
  'Try: directors with high engagement',
  'Try: leads with invalid emails',
];

interface AISearchBarProps {
  onFiltersApplied: (filters: Partial<ContactListParams>) => void;
  isLoading?: boolean;
}

export function AISearchBar({ onFiltersApplied, isLoading: externalLoading }: AISearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const loading = externalLoading || isSearching;

  // Rotate placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || isSearching) return;

    setIsSearching(true);
    try {
      const res = await fetch('/api/lead-intelligence/ai/parse-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!res.ok) {
        toast.error('Search failed, try again');
        return;
      }

      const data: AISearchResult = await res.json();

      if (data.error) {
        toast.error(data.suggestion ?? data.error);
        return;
      }

      onFiltersApplied(data.filters);
    } catch {
      toast.error('Search failed, try again');
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, onFiltersApplied]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
          className="pl-9 pr-4"
          disabled={loading}
        />
      </div>

      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
              <div className="h-4 w-4 rounded-full bg-purple-500/20 animate-pulse" />
              <span>Understanding your search...</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500/40 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
