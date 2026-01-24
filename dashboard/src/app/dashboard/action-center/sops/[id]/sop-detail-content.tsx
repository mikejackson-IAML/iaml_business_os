"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Edit2, MoreVertical, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SOPTemplate } from "@/lib/api/sop-types";
import type { SOPMasteryResult } from "@/lib/api/sop-queries";
import { SOPEditForm } from "../../components/sop-edit-form";

interface SOPDetailContentProps {
  sop: SOPTemplate;
  userMastery: SOPMasteryResult;
}

export function SOPDetailContent({ sop, userMastery }: SOPDetailContentProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "edit">("preview");

  // Format last used date
  const lastUsedText = sop.last_used_at
    ? new Date(sop.last_used_at).toLocaleDateString()
    : "Never";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/action-center/sops"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{sop.name}</h1>
              {!sop.is_active && <Badge variant="secondary">Inactive</Badge>}
            </div>
            {sop.description && (
              <p className="text-muted-foreground mt-1">{sop.description}</p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                // TODO: Implement delete with confirmation
              }}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete SOP
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="edit" className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <TabsContent value="preview" className="m-0">
              {/* Preview content - will be implemented in 06-09 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Steps Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Preview at different mastery levels will be implemented in
                    plan 06-09.
                  </p>
                  {/* Placeholder for steps list */}
                  <div className="mt-4 space-y-3">
                    {sop.steps.map((step) => (
                      <div key={step.order} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {step.order}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{step.title}</p>
                          {step.description && (
                            <p className="text-sm text-muted-foreground">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="edit" className="m-0">
              <SOPEditForm sop={sop} />
            </TabsContent>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Metadata Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Category
                  </p>
                  <p className="mt-1">{sop.category || "Uncategorized"}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Department
                  </p>
                  <p className="mt-1">{sop.department || "—"}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Steps
                  </p>
                  <p className="mt-1">{sop.steps.length} steps</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Version
                  </p>
                  <p className="mt-1">v{sop.version}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Times Used
                  </p>
                  <p className="mt-1">{sop.times_used}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Last Used
                  </p>
                  <p className="mt-1">{lastUsedText}</p>
                </div>
              </CardContent>
            </Card>

            {/* Your Mastery Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Mastery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="capitalize">{userMastery.mastery_tier}</span>
                  <Badge variant="secondary">
                    Level {userMastery.mastery_level}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Complete tasks using this SOP to increase your mastery level.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
