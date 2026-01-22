import { User, MapPin, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/dashboard-kit/components/ui/tooltip';
import type { NotRespondedInstructor } from '@/lib/api/faculty-scheduler-queries';

interface NotRespondedListProps {
  instructors: NotRespondedInstructor[];
}

function getTierLabel(tier: number): string {
  switch (tier) {
    case 0: return 'VIP';
    case 1: return 'Local';
    case 2: return 'Open';
    default: return '-';
  }
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatViewedAt(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function NotRespondedList({ instructors }: NotRespondedListProps) {
  // Group by program for better organization
  const groupedByProgram = instructors.reduce<Record<string, NotRespondedInstructor[]>>(
    (acc, instructor) => {
      const key = instructor.scheduled_program_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(instructor);
      return acc;
    },
    {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md flex items-center gap-2">
          <User className="h-5 w-5" />
          Not Responded
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Instructors notified but haven't claimed
        </p>
      </CardHeader>
      <CardContent>
        {instructors.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            All notified instructors have responded
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByProgram).slice(0, 5).map(([programId, programInstructors]) => {
              const program = programInstructors[0]; // All have same program info
              return (
                <div key={programId} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{program.program_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {programInstructors.length} waiting
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {program.program_city && program.program_state
                        ? `${program.program_city}, ${program.program_state}`
                        : 'Location TBD'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {programInstructors.slice(0, 3).map((instructor) => (
                      <div
                        key={instructor.instructor_id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{instructor.full_name}</span>
                          <span className="text-muted-foreground">
                            ({getTierLabel(instructor.tier_when_notified)})
                          </span>
                          {instructor.viewed_at && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-muted-foreground border-muted-foreground/30"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Viewed
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Viewed {formatViewedAt(instructor.viewed_at)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(instructor.notified_at)}
                        </span>
                      </div>
                    ))}
                    {programInstructors.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        + {programInstructors.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {Object.keys(groupedByProgram).length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                + {Object.keys(groupedByProgram).length - 5} more programs
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
