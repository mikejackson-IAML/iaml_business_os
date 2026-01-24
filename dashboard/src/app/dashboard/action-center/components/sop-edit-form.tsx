"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Save, Loader2, Plus, Trash } from "lucide-react";
import { SOPStepList } from "./sop-step-list";
import { updateSOPAction } from "../sop-actions";
import type { SOPTemplate, SOPStep, UpdateSOPRequest } from "@/lib/api/sop-types";

interface SOPEditFormProps {
  sop: SOPTemplate;
  onSaved?: () => void;
}

// Common categories - can be extended
const CATEGORIES = [
  "Operations",
  "Marketing",
  "Website Monitoring",
  "Content",
  "Analytics",
  "Customer Success",
  "Finance",
  "HR",
  "Other",
];

// Common departments
const DEPARTMENTS = [
  "Digital",
  "Marketing",
  "Operations",
  "Sales",
  "Customer Success",
];

export function SOPEditForm({ sop, onSaved }: SOPEditFormProps) {
  const router = useRouter();

  // Form state
  const [name, setName] = useState(sop.name);
  const [description, setDescription] = useState(sop.description || "");
  const [category, setCategory] = useState(sop.category || "");
  const [department, setDepartment] = useState(sop.department || "");
  const [isActive, setIsActive] = useState(sop.is_active);
  const [steps, setSteps] = useState<SOPStep[]>(sop.steps || []);
  const [variables, setVariables] = useState<
    Record<string, { description: string; example: string }>
  >(sop.variables || {});

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // New variable state
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarDesc, setNewVarDesc] = useState("");
  const [newVarExample, setNewVarExample] = useState("");

  // Warn about unsaved changes before navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Track changes
  const markChanged = () => {
    setHasUnsavedChanges(true);
    setError(null);
  };

  // Add variable
  const addVariable = () => {
    if (!newVarKey.trim()) return;

    setVariables({
      ...variables,
      [newVarKey.trim()]: {
        description: newVarDesc.trim(),
        example: newVarExample.trim(),
      },
    });

    setNewVarKey("");
    setNewVarDesc("");
    setNewVarExample("");
    markChanged();
  };

  // Remove variable
  const removeVariable = (key: string) => {
    const updated = { ...variables };
    delete updated[key];
    setVariables(updated);
    markChanged();
  };

  // Save changes
  const handleSave = async () => {
    // Validate
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    const updateData: UpdateSOPRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
      department: department || undefined,
      is_active: isActive,
      steps,
      variables,
    };

    const result = await updateSOPAction(sop.id, updateData);

    setIsSaving(false);

    if (!result.success) {
      if (result.error?.includes("version") || result.error?.includes("409")) {
        setShowConflictDialog(true);
      } else {
        setError(result.error || "Failed to save");
      }
      return;
    }

    setHasUnsavedChanges(false);
    router.refresh();
    onSaved?.();
  };

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sop-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sop-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markChanged();
              }}
              placeholder="SOP name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sop-description">Description</Label>
            <Textarea
              id="sop-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markChanged();
              }}
              placeholder="What this SOP covers"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sop-category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v);
                  markChanged();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sop-department">Department</Label>
              <Select
                value={department}
                onValueChange={(v) => {
                  setDepartment(v);
                  markChanged();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="sop-active"
              checked={isActive}
              onCheckedChange={(checked) => {
                setIsActive(checked);
                markChanged();
              }}
            />
            <Label htmlFor="sop-active">Active</Label>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <SOPStepList
            steps={steps}
            onChange={(updated) => {
              setSteps(updated);
              markChanged();
            }}
          />
        </CardContent>
      </Card>

      {/* Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variables</CardTitle>
          <p className="text-sm text-muted-foreground">
            Define variables that can be substituted in step text using {"{{variable_name}}"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing variables */}
          {Object.entries(variables).map(([key, value]) => (
            <div key={key} className="flex items-start gap-3 p-3 bg-muted rounded">
              <div className="flex-1 space-y-1">
                <code className="text-sm font-mono">{`{{${key}}}`}</code>
                <p className="text-sm text-muted-foreground">{value.description}</p>
                <p className="text-xs text-muted-foreground">
                  Example: {value.example}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeVariable(key)}
              >
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          {/* Add new variable */}
          <div className="space-y-3 p-3 border rounded">
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="variable_name"
                value={newVarKey}
                onChange={(e) => setNewVarKey(e.target.value.replace(/\s/g, "_"))}
              />
              <Input
                placeholder="Description"
                value={newVarDesc}
                onChange={(e) => setNewVarDesc(e.target.value)}
              />
              <Input
                placeholder="Example value"
                value={newVarExample}
                onChange={(e) => setNewVarExample(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariable}
              disabled={!newVarKey.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Variable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Version conflict dialog */}
      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Version Conflict</AlertDialogTitle>
            <AlertDialogDescription>
              This SOP has been modified by someone else since you started editing.
              Please refresh to see the latest version before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.refresh()}>
              Refresh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
