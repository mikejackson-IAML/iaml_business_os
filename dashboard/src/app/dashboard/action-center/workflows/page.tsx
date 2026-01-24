import { Suspense } from "react";
import { WorkflowListSkeleton } from "./workflow-list-skeleton";
import { WorkflowListDataLoader } from "./workflow-list-data-loader";

export const metadata = {
  title: "Workflows | Action Center",
  description: "Manage workflows and task dependencies",
};

export default function WorkflowListPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<WorkflowListSkeleton />}>
        <WorkflowListDataLoader />
      </Suspense>
    </div>
  );
}
