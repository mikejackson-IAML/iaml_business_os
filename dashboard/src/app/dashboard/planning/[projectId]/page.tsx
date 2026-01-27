import { Suspense } from 'react';
import { ProjectSkeleton } from './project-skeleton';
import { ProjectContent } from './project-content';

export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectContent projectId={projectId} />
    </Suspense>
  );
}
