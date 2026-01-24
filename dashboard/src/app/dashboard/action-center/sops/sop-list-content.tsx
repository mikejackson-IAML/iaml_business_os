"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, ArrowLeft } from "lucide-react";
import { SOPCategoryGroup } from "../components/sop-category-group";
import type { SOPTemplateExtended } from "@/lib/api/sop-types";

interface SOPListContentProps {
  sops: SOPTemplateExtended[];
  groupedSOPs: Map<string, SOPTemplateExtended[]>;
}

export function SOPListContent({ sops, groupedSOPs }: SOPListContentProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter SOPs by search query
  const filteredGroups = new Map<string, SOPTemplateExtended[]>();

  groupedSOPs.forEach((categorySOPs, category) => {
    const filtered = categorySOPs.filter((sop) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        sop.name.toLowerCase().includes(query) ||
        (sop.description?.toLowerCase().includes(query) ?? false)
      );
    });
    if (filtered.length > 0) {
      filteredGroups.set(category, filtered);
    }
  });

  const totalSOPs = sops.length;
  const filteredCount = [...filteredGroups.values()].reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/action-center"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold">SOP Templates</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {totalSOPs} standard operating procedures
          </p>
        </div>
        <Link href="/dashboard/action-center/sops/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New SOP
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search SOPs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Results count when filtering */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalSOPs} SOPs
        </p>
      )}

      {/* Category groups */}
      {filteredGroups.size > 0 ? (
        <div className="space-y-4">
          {[...filteredGroups.entries()].map(([category, categorySOPs]) => (
            <SOPCategoryGroup
              key={category}
              category={category}
              sops={categorySOPs}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium">No SOPs found</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {searchQuery
              ? "Try adjusting your search"
              : "Create your first SOP to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
