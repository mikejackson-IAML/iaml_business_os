import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getContactById } from '@/lib/api/lead-intelligence-contacts-queries';
import { ContactProfileContent } from './contact-profile-content';
import { ContactProfileSkeleton } from './contact-profile-skeleton';

interface ContactProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactProfilePage({ params }: ContactProfilePageProps) {
  const { id } = await params;
  const contact = await getContactById(id);

  if (!contact) {
    notFound();
  }

  return (
    <Suspense fallback={<ContactProfileSkeleton />}>
      <ContactProfileContent contact={contact} />
    </Suspense>
  );
}
