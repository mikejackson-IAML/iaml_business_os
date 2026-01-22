'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { InstructorHistoryPanel } from './instructor-history-panel';
import {
  getInstructorHistory,
  type TeachingHistoryRecord,
  type NotRespondedInstructor,
} from '@/lib/api/faculty-scheduler-queries';

interface InstructorListProps {
  instructors: NotRespondedInstructor[];
}

interface ExpandedState {
  [instructorId: string]: {
    loading: boolean;
    history: TeachingHistoryRecord[];
  };
}

export function InstructorList({ instructors }: InstructorListProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Deduplicate instructors (they may appear multiple times for different programs)
  const uniqueInstructors = Array.from(
    new Map(instructors.map(i => [i.instructor_id, i])).values()
  );

  const handleToggle = async (instructorId: string) => {
    if (expanded[instructorId]) {
      // Collapse
      setExpanded(prev => {
        const next = { ...prev };
        delete next[instructorId];
        return next;
      });
    } else {
      // Expand - fetch history
      setExpanded(prev => ({
        ...prev,
        [instructorId]: { loading: true, history: [] },
      }));

      const history = await getInstructorHistory(instructorId);

      setExpanded(prev => ({
        ...prev,
        [instructorId]: { loading: false, history },
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md flex items-center gap-2">
          <Users className="h-5 w-5" />
          Instructor History
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Click to view teaching history
        </p>
      </CardHeader>
      <CardContent>
        {uniqueInstructors.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No instructors to display
          </p>
        ) : (
          <div className="space-y-2">
            {uniqueInstructors.slice(0, 10).map((instructor) => {
              const isExpanded = !!expanded[instructor.instructor_id];
              const state = expanded[instructor.instructor_id];

              return (
                <div key={instructor.instructor_id} className="border border-border rounded-lg">
                  <button
                    onClick={() => handleToggle(instructor.instructor_id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-background-card-light transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">{instructor.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {instructor.firm_state || 'Location unknown'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {instructor.tier_designation === 0 ? 'VIP' : instructor.tier_designation === null ? 'Standard' : `Tier ${instructor.tier_designation}`}
                    </Badge>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-border">
                      <InstructorHistoryPanel
                        history={state.history}
                        loading={state.loading}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {uniqueInstructors.length > 10 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                + {uniqueInstructors.length - 10} more instructors
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
