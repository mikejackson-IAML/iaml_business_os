'use client';

import type { Company } from '@/lib/api/lead-intelligence-companies-types';

export function EnrichmentTab({ companyId, company }: { companyId: string; company: Company }) {
  return <div>Enrichment tab placeholder for {companyId} - {company.name}</div>;
}
