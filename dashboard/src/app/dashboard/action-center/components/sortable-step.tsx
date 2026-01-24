"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SOPStepDisplay } from "./sop-step-display";
import type { SOPStep } from "@/lib/api/sop-types";

interface SortableStepProps {
  step: SOPStep;
  stepNumber: number;
  onEdit?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  readOnly?: boolean;
}

export function SortableStep({
  step,
  stepNumber,
  onEdit,
  onMoveUp,
  onMoveDown,
  readOnly = false,
}: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.order, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SOPStepDisplay
        step={step}
        stepNumber={stepNumber}
        onEdit={onEdit || (() => {})}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        isDragging={isDragging}
        dragHandleProps={readOnly ? undefined : listeners}
      />
    </div>
  );
}
