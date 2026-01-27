'use client';

import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Button } from '@/dashboard-kit/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/dashboard-kit/components/ui/tooltip';
import type { Contact } from '@/lib/api/lead-intelligence-contacts-types';

interface EnrichmentTabProps {
  contactId: string;
  contact: Contact;
}

const enrichmentStatusColors: Record<string, string> = {
  enriched: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  not_enriched: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

interface EnrichmentField {
  label: string;
  value: string | null | undefined;
}

export function EnrichmentTab({ contact }: EnrichmentTabProps) {
  const [jsonExpanded, setJsonExpanded] = useState(false);

  const status = contact.enrichment_source ? 'enriched' : 'not_enriched';
  const statusLabel = status.replace('_', ' ');
  const statusColor = enrichmentStatusColors[status] ?? enrichmentStatusColors.not_enriched;

  const enrichmentFields: EnrichmentField[] = [
    { label: 'LinkedIn URL', value: contact.linkedin_url },
    { label: 'Title', value: contact.title },
    { label: 'Department', value: contact.department },
    { label: 'Seniority Level', value: contact.seniority_level },
    { label: 'Phone', value: contact.phone },
    { label: 'Email Status', value: contact.email_status },
  ];

  const populatedCount = enrichmentFields.filter((f) => f.value).length;

  return (
    <div className="space-y-6">
      {/* Enrichment Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Enrichment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Status</p>
              <Badge variant="outline" className={`border-0 capitalize ${statusColor}`}>
                {statusLabel}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Source</p>
              <p>{contact.enrichment_source ?? 'None'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Last Enriched</p>
              <p>
                {contact.enriched_at
                  ? new Date(contact.enriched_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Fields Populated</p>
              <p>
                {populatedCount}/{enrichmentFields.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enriched Fields Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Enriched Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium">Field</th>
                  <th className="text-left px-3 py-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {enrichmentFields.map((field) => (
                  <tr key={field.label} className="border-b last:border-b-0">
                    <td className="px-3 py-2 text-muted-foreground">{field.label}</td>
                    <td className="px-3 py-2">
                      {field.value ? (
                        field.label === 'LinkedIn URL' ? (
                          <a
                            href={field.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                          >
                            {field.value}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span>{field.value}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground/50 italic">Empty</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Raw JSON Viewer */}
      {contact.enrichment_data && (
        <Card>
          <CardHeader className="pb-3">
            <button
              onClick={() => setJsonExpanded(!jsonExpanded)}
              className="flex items-center gap-2 text-base font-semibold w-full text-left"
            >
              {jsonExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Raw Enrichment Data
            </button>
          </CardHeader>
          {jsonExpanded && (
            <CardContent>
              <pre className="bg-muted rounded-md p-3 overflow-x-auto text-xs">
                <code>{JSON.stringify(contact.enrichment_data, null, 2)}</code>
              </pre>
            </CardContent>
          )}
        </Card>
      )}

      {/* Enrich Now button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button disabled className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Enrich Now
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Coming in Phase 4</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
