import { OpportunityDetail } from '../components/opportunity-detail';

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({ params }: OpportunityDetailPageProps) {
  const { id } = await params;

  return <OpportunityDetail opportunityId={id} />;
}
