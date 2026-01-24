import { getSOPsAction } from "../sop-actions";
import { SOPListContent } from "./sop-list-content";
import type { SOPTemplateExtended } from "@/lib/api/sop-types";

// Group SOPs by category
function groupByCategory(sops: SOPTemplateExtended[]): Map<string, SOPTemplateExtended[]> {
  const groups = new Map<string, SOPTemplateExtended[]>();

  for (const sop of sops) {
    const category = sop.category || "Uncategorized";
    const existing = groups.get(category) || [];
    groups.set(category, [...existing, sop]);
  }

  // Sort categories alphabetically, but put "Uncategorized" last
  return new Map(
    [...groups.entries()].sort(([a], [b]) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    })
  );
}

export async function SOPListDataLoader() {
  try {
    const result = await getSOPsAction({ limit: 100, is_active: true });
    const sops = result.sops || [];
    const groupedSOPs = groupByCategory(sops);

    return <SOPListContent sops={sops} groupedSOPs={groupedSOPs} />;
  } catch (error) {
    console.error("Error loading SOPs:", error);
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load SOPs</p>
        <p className="text-sm text-destructive mt-1">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }
}
