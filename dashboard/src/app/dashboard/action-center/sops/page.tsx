import { Suspense } from "react";
import { SOPListSkeleton } from "./sop-list-skeleton";
import { SOPListDataLoader } from "./sop-list-data-loader";

export const metadata = {
  title: "SOP Templates | Action Center",
  description: "Manage standard operating procedures",
};

export default function SOPListPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<SOPListSkeleton />}>
        <SOPListDataLoader />
      </Suspense>
    </div>
  );
}
