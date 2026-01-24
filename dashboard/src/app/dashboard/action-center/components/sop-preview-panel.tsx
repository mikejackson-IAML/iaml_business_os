"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressiveInstructions } from "./progressive-instructions";
import { MasteryBadge, getMasteryTier } from "./mastery-badge";
import type { SOPTemplate } from "@/lib/api/sop-types";

interface SOPPreviewPanelProps {
  sop: SOPTemplate;
  currentMasteryLevel: number;
}

const MASTERY_PRESETS = [
  { level: 0, label: "Novice (0-2)" },
  { level: 3, label: "Developing (3-5)" },
  { level: 6, label: "Proficient (6-9)" },
  { level: 10, label: "Expert (10+)" },
];

export function SOPPreviewPanel({ sop, currentMasteryLevel }: SOPPreviewPanelProps) {
  const [previewLevel, setPreviewLevel] = useState(currentMasteryLevel);
  const [testVariables, setTestVariables] = useState<Record<string, string>>(() => {
    // Initialize with example values from SOP variables
    const initial: Record<string, string> = {};
    if (sop.variables) {
      for (const [key, value] of Object.entries(sop.variables)) {
        initial[key] = value.example || "";
      }
    }
    return initial;
  });

  const previewTier = getMasteryTier(previewLevel);

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Preview Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mastery Level Selector */}
          <div className="space-y-2">
            <Label>Preview as mastery level</Label>
            <Select
              value={previewLevel.toString()}
              onValueChange={(v) => setPreviewLevel(parseInt(v, 10))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MASTERY_PRESETS.map((preset) => (
                  <SelectItem key={preset.level} value={preset.level.toString()}>
                    <div className="flex items-center gap-2">
                      <MasteryBadge
                        level={preset.level}
                        tier={getMasteryTier(preset.level)}
                        className="text-xs"
                      />
                      <span>{preset.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Variable Test Inputs */}
          {sop.variables && Object.keys(sop.variables).length > 0 && (
            <div className="space-y-3">
              <Label>Test Variable Values</Label>
              {Object.entries(sop.variables).map(([key, meta]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {`{{${key}}}`} - {meta.description}
                  </Label>
                  <Input
                    value={testVariables[key] || ""}
                    onChange={(e) =>
                      setTestVariables({
                        ...testVariables,
                        [key]: e.target.value,
                      })
                    }
                    placeholder={meta.example}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Display */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">
            Preview: <span className="capitalize">{previewTier}</span> View
          </h3>
          <MasteryBadge level={previewLevel} tier={previewTier} showLevel />
        </div>

        <ProgressiveInstructions
          sop={sop}
          masteryLevel={previewLevel}
          variables={testVariables}
          sopDetailUrl={`/dashboard/action-center/sops/${sop.id}`}
        />
      </div>
    </div>
  );
}
