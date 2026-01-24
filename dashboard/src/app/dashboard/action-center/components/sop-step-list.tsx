"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/dashboard-kit/components/ui/button";
import { Plus } from "lucide-react";
import { SortableStep } from "./sortable-step";
import { SOPStepEditor } from "./sop-step-editor";
import type { SOPStep } from "@/lib/api/sop-types";

interface SOPStepListProps {
  steps: SOPStep[];
  onChange: (steps: SOPStep[]) => void;
  readOnly?: boolean;
}

export function SOPStepList({ steps, onChange, readOnly = false }: SOPStepListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px drag before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.order === active.id);
      const newIndex = steps.findIndex((s) => s.order === over.id);

      const reordered = arrayMove(steps, oldIndex, newIndex);

      // Update order values to match new positions
      const withUpdatedOrders = reordered.map((step, index) => ({
        ...step,
        order: index + 1,
      }));

      onChange(withUpdatedOrders);
    }
  };

  // Move step up
  const moveUp = (index: number) => {
    if (index === 0) return;
    const reordered = arrayMove(steps, index, index - 1);
    const withUpdatedOrders = reordered.map((step, i) => ({
      ...step,
      order: i + 1,
    }));
    onChange(withUpdatedOrders);
  };

  // Move step down
  const moveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const reordered = arrayMove(steps, index, index + 1);
    const withUpdatedOrders = reordered.map((step, i) => ({
      ...step,
      order: i + 1,
    }));
    onChange(withUpdatedOrders);
  };

  // Save edited step
  const saveStep = (index: number, step: SOPStep) => {
    const updated = [...steps];
    updated[index] = step;
    onChange(updated);
    setEditingIndex(null);
  };

  // Delete step
  const deleteStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    // Renumber remaining steps
    const renumbered = updated.map((step, i) => ({
      ...step,
      order: i + 1,
    }));
    onChange(renumbered);
    setEditingIndex(null);
  };

  // Add new step
  const addStep = (step: SOPStep) => {
    const newStep = {
      ...step,
      order: steps.length + 1,
    };
    onChange([...steps, newStep]);
    setIsAddingNew(false);
  };

  // Create new step template
  const newStepTemplate: SOPStep = {
    order: steps.length + 1,
    title: "",
    description: null,
    estimated_minutes: null,
    links: [],
    notes: null,
  };

  if (readOnly) {
    return (
      <div className="space-y-2">
        {steps.map((step, index) => (
          <SortableStep
            key={step.order}
            step={step}
            stepNumber={index + 1}
            readOnly
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={steps.map((s) => s.order)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {steps.map((step, index) => (
              editingIndex === index ? (
                <SOPStepEditor
                  key={step.order}
                  step={step}
                  stepNumber={index + 1}
                  onSave={(updated) => saveStep(index, updated)}
                  onCancel={() => setEditingIndex(null)}
                  onDelete={() => deleteStep(index)}
                />
              ) : (
                <SortableStep
                  key={step.order}
                  step={step}
                  stepNumber={index + 1}
                  onEdit={() => setEditingIndex(index)}
                  onMoveUp={index > 0 ? () => moveUp(index) : undefined}
                  onMoveDown={index < steps.length - 1 ? () => moveDown(index) : undefined}
                />
              )
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add new step */}
      {isAddingNew ? (
        <SOPStepEditor
          step={newStepTemplate}
          stepNumber={steps.length + 1}
          onSave={addStep}
          onCancel={() => setIsAddingNew(false)}
          isNew
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setIsAddingNew(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      )}

      {/* Empty state */}
      {steps.length === 0 && !isAddingNew && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No steps yet. Click &quot;Add Step&quot; to create the first step.</p>
        </div>
      )}
    </div>
  );
}
