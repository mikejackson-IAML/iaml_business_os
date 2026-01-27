'use client';

import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/dashboard-kit/components/ui/button';
import type { ContactListParams } from '@/lib/api/lead-intelligence-contacts-types';

const LABEL_MAP: Record<string, string> = {
  status: 'Status',
  state: 'State',
  company_id: 'Company',
  title: 'Title',
  department: 'Department',
  seniority_level: 'Seniority',
  email_status: 'Email Status',
  is_vip: 'VIP',
  engagement_score_min: 'Min Engagement',
  engagement_score_max: 'Max Engagement',
  created_after: 'Created After',
  created_before: 'Created Before',
  company_size: 'Company Size',
  program_id: 'Program',
  search: 'Search',
};

const VALUE_DISPLAY: Record<string, Record<string, string>> = {
  seniority_level: {
    c_suite: 'C-Suite',
    vp: 'VP',
    director: 'Director',
    manager: 'Manager',
    senior: 'Senior',
    entry: 'Entry Level',
  },
  is_vip: {
    true: 'VIP Only',
    false: 'Non-VIP',
  },
  email_status: {
    valid: 'Valid',
    invalid: 'Invalid',
    unknown: 'Unknown',
    catch_all: 'Catch-All',
  },
  status: {
    lead: 'Lead',
    customer: 'Customer',
    prospect: 'Prospect',
    churned: 'Churned',
    partner: 'Partner',
  },
};

function displayValue(key: string, value: string): string {
  return VALUE_DISPLAY[key]?.[value] ?? value;
}

interface FilterPillsProps {
  filters: Partial<ContactListParams>;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function FilterPills({ filters, onRemove, onClearAll }: FilterPillsProps) {
  // Exclude pagination/sort keys
  const excludeKeys = new Set(['page', 'limit', 'sort', 'order']);
  const entries = Object.entries(filters).filter(
    ([key, value]) => !excludeKeys.has(key) && value !== undefined && value !== '' && value !== null
  );

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium">AI Filters:</span>
      <AnimatePresence mode="popLayout">
        {entries.map(([key, value]) => (
          <motion.span
            key={key}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2.5 py-0.5 text-xs font-medium"
          >
            {LABEL_MAP[key] ?? key}: {displayValue(key, String(value))}
            <button
              type="button"
              onClick={() => onRemove(key)}
              className="ml-0.5 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800/50 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      {entries.length >= 2 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
