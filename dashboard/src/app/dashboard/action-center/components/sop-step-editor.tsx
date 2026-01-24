"use client";

import { useState } from "react";
import { Button } from "@/dashboard-kit/components/ui/button";
import { Input } from "@/dashboard-kit/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/dashboard-kit/components/ui/card";
import { Plus, Trash, X, Save, Link as LinkIcon } from "lucide-react";
import type { SOPStep } from "@/lib/api/sop-types";

interface SOPStepEditorProps {
  step: SOPStep;
  stepNumber: number;
  onSave: (step: SOPStep) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
}

export function SOPStepEditor({
  step,
  stepNumber,
  onSave,
  onCancel,
  onDelete,
  isNew = false,
}: SOPStepEditorProps) {
  const [title, setTitle] = useState(step.title);
  const [description, setDescription] = useState(step.description || "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    step.estimated_minutes?.toString() || ""
  );
  const [links, setLinks] = useState<string[]>(step.links || []);
  const [notes, setNotes] = useState(step.notes || "");
  const [newLink, setNewLink] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }

    if (estimatedMinutes && (isNaN(Number(estimatedMinutes)) || Number(estimatedMinutes) < 0)) {
      newErrors.estimatedMinutes = "Must be a positive number";
    }

    // Validate links are valid URLs
    for (const link of links) {
      try {
        new URL(link);
      } catch {
        newErrors.links = "All links must be valid URLs";
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validate()) return;

    const updatedStep: SOPStep = {
      order: step.order,
      title: title.trim(),
      description: description.trim() || null,
      estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
      links: links.filter((l) => l.trim()),
      notes: notes.trim() || null,
    };

    onSave(updatedStep);
  };

  // Add link
  const addLink = () => {
    if (!newLink.trim()) return;

    try {
      new URL(newLink);
      setLinks([...links, newLink.trim()]);
      setNewLink("");
      // Clear any newLink error
      const { newLink: _, ...restErrors } = errors;
      setErrors(restErrors);
    } catch {
      setErrors({ ...errors, newLink: "Invalid URL" });
    }
  };

  // Remove link
  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {isNew ? "New Step" : `Step ${stepNumber}`}
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="step-title" className="text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </label>
          <Input
            id="step-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done"
            className={errors.title ? "border-destructive" : ""}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="step-description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="step-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed instructions for this step"
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        {/* Estimated Minutes */}
        <div className="space-y-2">
          <label htmlFor="step-minutes" className="text-sm font-medium">
            Estimated Minutes
          </label>
          <Input
            id="step-minutes"
            type="number"
            min="0"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            placeholder="e.g., 5"
            className={errors.estimatedMinutes ? "border-destructive" : ""}
          />
          {errors.estimatedMinutes && (
            <p className="text-xs text-destructive">{errors.estimatedMinutes}</p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Reference Links</label>
          <div className="flex gap-2">
            <Input
              value={newLink}
              onChange={(e) => {
                setNewLink(e.target.value);
                const { newLink: _, ...restErrors } = errors;
                setErrors(restErrors);
              }}
              placeholder="https://..."
              className={errors.newLink ? "border-destructive" : ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addLink}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {errors.newLink && (
            <p className="text-xs text-destructive">{errors.newLink}</p>
          )}
          {errors.links && (
            <p className="text-xs text-destructive">{errors.links}</p>
          )}

          {links.length > 0 && (
            <div className="space-y-2 mt-2">
              {links.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded"
                >
                  <LinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate flex-1 text-primary hover:underline"
                  >
                    {link}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeLink(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label htmlFor="step-notes" className="text-sm font-medium">
            Notes
          </label>
          <textarea
            id="step-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional tips or warnings"
            rows={2}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div>
          {onDelete && !isNew && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {isNew ? "Add Step" : "Save"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
