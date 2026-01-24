"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SOPRow } from "./sop-row";
import type { SOPTemplateExtended } from "@/lib/api/sop-types";

interface SOPCategoryGroupProps {
  category: string;
  sops: SOPTemplateExtended[];
  defaultExpanded?: boolean;
}

export function SOPCategoryGroup({
  category,
  sops,
  defaultExpanded = true,
}: SOPCategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card>
      <CardHeader className="py-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{category}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {sops.length}
          </Badge>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="divide-y">
            {sops.map((sop) => (
              <SOPRow key={sop.id} sop={sop} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
