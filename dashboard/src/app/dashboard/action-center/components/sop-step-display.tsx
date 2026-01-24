"use client";

import { Clock, LinkIcon, StickyNote, GripVertical, ChevronUp, ChevronDown, Edit2 } from "lucide-react";
import { Button } from "@/dashboard-kit/components/ui/button";
import type { SOPStep } from "@/lib/api/sop-types";

interface SOPStepDisplayProps {
  step: SOPStep;
  stepNumber: number;
  onEdit: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export function SOPStepDisplay({
  step,
  stepNumber,
  onEdit,
  onMoveUp,
  onMoveDown,
  isDragging = false,
  dragHandleProps,
}: SOPStepDisplayProps) {
  return (
    <div
      className={`flex gap-3 p-3 rounded border ${
        isDragging ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
      }`}
    >
      {/* Drag handle and reorder buttons */}
      <div className="flex flex-col items-center gap-1">
        <div {...dragHandleProps} className="cursor-grab p-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={onMoveUp}
            disabled={!onMoveUp}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={onMoveDown}
            disabled={!onMoveDown}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Step number badge */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
        {stepNumber}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium">{step.title}</p>

        {step.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {step.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
          {step.estimated_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {step.estimated_minutes} min
            </span>
          )}
          {step.links && step.links.length > 0 && (
            <span className="flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              {step.links.length} link{step.links.length !== 1 ? "s" : ""}
            </span>
          )}
          {step.notes && (
            <span className="flex items-center gap-1">
              <StickyNote className="h-3 w-3" />
              Has notes
            </span>
          )}
        </div>
      </div>

      {/* Edit button */}
      <Button
        variant="ghost"
        size="sm"
        className="flex-shrink-0 h-8 w-8 p-0"
        onClick={onEdit}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
