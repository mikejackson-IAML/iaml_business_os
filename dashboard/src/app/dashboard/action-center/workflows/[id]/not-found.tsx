import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * WorkflowNotFound
 * Displayed when a workflow ID doesn't exist or has been deleted.
 * Provides clear messaging and navigation back to workflow list.
 */
export default function WorkflowNotFound() {
  return (
    <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh]">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Workflow Not Found</h1>
      <p className="text-muted-foreground mb-6">
        The workflow you&apos;re looking for doesn&apos;t exist or has been deleted.
      </p>
      <Link href="/dashboard/action-center/workflows">
        <Button>Back to Workflows</Button>
      </Link>
    </div>
  );
}
