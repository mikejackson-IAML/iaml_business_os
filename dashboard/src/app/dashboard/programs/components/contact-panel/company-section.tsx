'use client';

import { useState } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type {
  RegistrationRosterItem,
  CompanyRegistrationHistoryItem,
} from '@/lib/api/programs-queries';
import { formatDateShort, cn } from '@/dashboard-kit/lib/utils';

interface CompanySectionProps {
  registration: RegistrationRosterItem;
  companyHistory: CompanyRegistrationHistoryItem[];
  isLoading?: boolean;
}

/**
 * Company Section for Contact Panel
 * Displays enriched company data and historical registrants from same company
 */
export function CompanySection({
  registration,
  companyHistory,
  isLoading = false,
}: CompanySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Company name from registration
  const companyName = registration.company_name;

  // Get Apollo enrichment data if available
  const enrichedData = registration as Record<string, unknown>;
  const industry = enrichedData.company_industry as string | null;
  const employeeCount = enrichedData.company_employee_count as number | null;
  const growth30d = enrichedData.company_growth_30d as number | null;
  const growth60d = enrichedData.company_growth_60d as number | null;
  const growth90d = enrichedData.company_growth_90d as number | null;

  const hasEnrichedData = industry || employeeCount || growth30d || growth60d || growth90d;

  // Calculate colleague count (excluding current registrant)
  const colleagueCount = companyHistory.filter((h) => h.id !== registration.id).length;

  // Display up to 10, with "View all" if more
  const displayLimit = 10;
  const displayHistory = companyHistory.slice(0, displayLimit);
  const hasMore = companyHistory.length > displayLimit;

  if (!companyName) {
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">No company information</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Company</h3>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        {/* Company Name Header */}
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">{companyName}</span>
        </div>

        {/* Enriched Company Data */}
        {hasEnrichedData ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {industry && (
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                  Industry
                </dt>
                <dd className="font-medium mt-0.5">{industry}</dd>
              </div>
            )}

            {employeeCount && (
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">
                  Employees
                </dt>
                <dd className="font-medium mt-0.5">
                  {employeeCount.toLocaleString()}
                </dd>
              </div>
            )}

            {/* Growth rates */}
            {(growth30d || growth60d || growth90d) && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Growth
                </dt>
                <dd className="flex gap-3">
                  {growth30d !== null && (
                    <span className={getGrowthColor(growth30d)}>
                      30d: {growth30d > 0 ? '+' : ''}{growth30d}%
                    </span>
                  )}
                  {growth60d !== null && (
                    <span className={getGrowthColor(growth60d)}>
                      60d: {growth60d > 0 ? '+' : ''}{growth60d}%
                    </span>
                  )}
                  {growth90d !== null && (
                    <span className={getGrowthColor(growth90d)}>
                      90d: {growth90d > 0 ? '+' : ''}{growth90d}%
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Not enriched - Apollo data not available
          </p>
        )}

        {/* Historical Registrants */}
        <div className="pt-3 border-t">
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-48" />
              <div className="h-3 bg-muted rounded w-32" />
            </div>
          ) : colleagueCount > 0 ? (
            <>
              {/* Expandable header */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-left group"
              >
                <span className="text-sm font-medium">
                  {colleagueCount} colleague{colleagueCount !== 1 ? 's' : ''} from{' '}
                  {companyName} have registered
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>

              {/* Expanded table */}
              {isExpanded && (
                <div className="mt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-left">
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2 font-medium">Program</th>
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayHistory.map((item) => (
                        <tr
                          key={item.id}
                          className={cn(
                            'border-b last:border-0',
                            item.id === registration.id && 'bg-muted/50'
                          )}
                        >
                          <td className="py-2 font-medium">
                            {item.full_name}
                            {item.id === registration.id && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (current)
                              </span>
                            )}
                          </td>
                          <td className="py-2 truncate max-w-[150px]" title={item.program_name}>
                            {item.program_name}
                          </td>
                          <td className="py-2">
                            {formatDateShort(item.registration_date)}
                          </td>
                          <td className="py-2">
                            <Badge
                              variant={
                                item.payment_status === 'paid'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {item.payment_status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {hasMore && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing {displayLimit} of {companyHistory.length} registrations
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              First registration from this company
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Get text color for growth percentage
 */
function getGrowthColor(growth: number): string {
  if (growth > 0) return 'text-emerald-600';
  if (growth < 0) return 'text-red-500';
  return 'text-muted-foreground';
}
