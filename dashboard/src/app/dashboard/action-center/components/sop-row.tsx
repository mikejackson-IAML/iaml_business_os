"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, ListChecks, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SOPTemplateExtended } from "@/lib/api/sop-types";

interface SOPRowProps {
  sop: SOPTemplateExtended;
}

export function SOPRow({ sop }: SOPRowProps) {
  // Calculate total estimated time
  const totalMinutes = sop.steps?.reduce(
    (sum, step) => sum + (step.estimated_minutes || 0),
    0
  ) || 0;

  // Step count
  const stepCount = sop.steps?.length || 0;

  // Usage count (times_used from database)
  const usageCount = sop.times_used || 0;

  return (
    <Link
      href={`/dashboard/action-center/sops/${sop.id}`}
      className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-4 px-4 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded flex items-center justify-center",
          sop.is_active ? "bg-primary/10" : "bg-muted"
        )}>
          <FileText className={cn(
            "h-4 w-4",
            sop.is_active ? "text-primary" : "text-muted-foreground"
          )} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-medium truncate",
              !sop.is_active && "text-muted-foreground"
            )}>
              {sop.name}
            </span>
            {!sop.is_active && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              {stepCount} step{stepCount !== 1 ? 's' : ''}
            </span>
            {totalMinutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ~{totalMinutes} min
              </span>
            )}
            {sop.department && (
              <span className="truncate max-w-[100px]">
                {sop.department}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Usage stats badge */}
      {usageCount > 0 && (
        <Link
          href={`/dashboard/action-center?sop_template_id=${sop.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        >
          <Badge
            variant="outline"
            className="text-xs hover:bg-primary/10 transition-colors"
          >
            <Users className="h-3 w-3 mr-1" />
            {usageCount} task{usageCount !== 1 ? 's' : ''}
          </Badge>
        </Link>
      )}
    </Link>
  );
}
