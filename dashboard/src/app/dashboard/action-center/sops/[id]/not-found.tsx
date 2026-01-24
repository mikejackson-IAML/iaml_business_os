import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SOPNotFound() {
  return (
    <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh]">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">SOP Not Found</h1>
      <p className="text-muted-foreground mb-6">
        The SOP you&apos;re looking for doesn&apos;t exist or has been deleted.
      </p>
      <Link href="/dashboard/action-center/sops">
        <Button>Back to SOPs</Button>
      </Link>
    </div>
  );
}
