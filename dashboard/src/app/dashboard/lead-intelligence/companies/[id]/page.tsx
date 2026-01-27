import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCompanyById } from '@/lib/api/lead-intelligence-companies-queries';
import { CompanyProfileContent } from './company-profile-content';
import { CompanyProfileSkeleton } from './company-profile-skeleton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyProfilePage({ params }: PageProps) {
  const { id } = await params;
  const company = await getCompanyById(id);

  if (!company) {
    notFound();
  }

  return (
    <Suspense fallback={<CompanyProfileSkeleton />}>
      <CompanyProfileContent company={company} />
    </Suspense>
  );
}
