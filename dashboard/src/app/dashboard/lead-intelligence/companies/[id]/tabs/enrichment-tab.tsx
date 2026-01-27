'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Button } from '@/dashboard-kit/components/ui/button';
import type { Company } from '@/lib/api/lead-intelligence-companies-types';

interface EnrichmentField {
  label: string;
  value: string | number | null | undefined;
}

export function EnrichmentTab({ companyId, company }: { companyId: string; company: Company }) {
  const [jsonExpanded, setJsonExpanded] = useState(false);

  const enrichmentStatus = company.enrichment_source ? 'enriched' : 'not_enriched';

  const fields: EnrichmentField[] = [
    { label: 'Industry', value: company.industry },
    { label: 'Employee Count', value: company.employee_count },
    { label: 'Revenue Range', value: company.revenue_range },
    { label: 'Website', value: company.website },
    { label: 'LinkedIn URL', value: company.linkedin_url },
    { label: 'City', value: company.city },
    { label: 'State', value: company.state },
    { label: 'Country', value: company.country },
  ];

  const populated = fields.filter((f) => f.value != null && f.value !== '').length;

  return (
    <div className="space-y-6">
      {/* Enrichment Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={
              enrichmentStatus === 'enriched'
                ? 'bg-green-100 text-green-800 border-0'
                : 'bg-gray-100 text-gray-800 border-0'
            }
          >
            {enrichmentStatus === 'enriched' ? 'Enriched' : 'Not Enriched'}
          </Badge>
          {company.enrichment_source && (
            <span className="text-sm text-muted-foreground">Source: {company.enrichment_source}</span>
          )}
          {company.enriched_at && (
            <span className="text-sm text-muted-foreground">
              Last enriched: {new Date(company.enriched_at).toLocaleDateString()}
            </span>
          )}
        </div>
        <Button size="sm" disabled>
          Enrich Company (Coming in Phase 4)
        </Button>
      </div>

      {/* Company Fields */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b bg-muted/50">
            <p className="text-sm font-medium">
              Company Data — {populated}/{fields.length} fields populated
            </p>
          </div>
          <div className="divide-y">
            {fields.map((field) => (
              <div key={field.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">{field.label}</span>
                <span className={`text-sm ${field.value != null && field.value !== '' ? '' : 'text-muted-foreground italic'}`}>
                  {field.value != null && field.value !== '' ? String(field.value) : 'Empty'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Raw Enrichment Data */}
      {company.enrichment_data && Object.keys(company.enrichment_data).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <button
              onClick={() => setJsonExpanded(!jsonExpanded)}
              className="text-sm font-medium hover:underline"
            >
              {jsonExpanded ? 'Hide' : 'Show'} Raw Enrichment Data
            </button>
            {jsonExpanded && (
              <pre className="mt-3 rounded-md bg-muted p-4 text-xs overflow-auto max-h-96">
                {JSON.stringify(company.enrichment_data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
