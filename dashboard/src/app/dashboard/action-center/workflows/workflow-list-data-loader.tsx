import { getWorkflowsAction } from "../workflow-actions";
import { WorkflowListContent } from "./workflow-list-content";

export async function WorkflowListDataLoader() {
  try {
    const result = await getWorkflowsAction({ limit: 50 });

    if (!result.success || !result.data) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load workflows</p>
          <p className="text-sm text-destructive mt-1">
            {result.error || "Unknown error"}
          </p>
        </div>
      );
    }

    const workflows = result.data.workflows || [];

    return <WorkflowListContent workflows={workflows} />;
  } catch (error) {
    console.error("Error loading workflows:", error);
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load workflows</p>
        <p className="text-sm text-destructive mt-1">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }
}
