import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSOPById } from "@/lib/api/sop-queries";
import { getUserMasteryAction } from "../../sop-actions";
import { SOPDetailSkeleton } from "./sop-detail-skeleton";
import { SOPDetailContent } from "./sop-detail-content";

/**
 * Generate metadata for the SOP detail page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sop = await getSOPById(id);
  if (!sop) {
    return { title: "SOP Not Found" };
  }
  return { title: `${sop.name} | SOP Templates` };
}

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

/**
 * SOPDetailLoader
 * Async server component that fetches SOP and user mastery in parallel.
 * Returns notFound() if SOP doesn't exist.
 */
async function SOPDetailLoader({ id }: { id: string }) {
  const [sop, userMastery] = await Promise.all([
    getSOPById(id),
    getUserMasteryAction(id),
  ]);

  if (!sop) {
    notFound();
  }

  return <SOPDetailContent sop={sop} userMastery={userMastery} />;
}

/**
 * SOPDetailPage
 * Server component with Suspense boundary for the SOP detail route.
 * Route: /dashboard/action-center/sops/[id]
 */
export default async function SOPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<SOPDetailSkeleton />}>
        <SOPDetailLoader id={decodedId} />
      </Suspense>
    </div>
  );
}
