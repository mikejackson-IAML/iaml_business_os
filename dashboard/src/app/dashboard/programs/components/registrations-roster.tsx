'use client';

import { Check, X, Ban } from 'lucide-react';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { cn } from '@/dashboard-kit/lib/utils';
import type { RegistrationRosterItem, ProgramBlock } from '@/lib/api/programs-queries';

interface RegistrationsRosterProps {
  registrations: RegistrationRosterItem[];
  blocks: ProgramBlock[];
  onRowClick: (registration: RegistrationRosterItem) => void;
  isVirtualCertificate?: boolean;
}

// Payment status badge variants
const paymentVariants: Record<string, 'healthy' | 'warning' | 'critical' | 'secondary'> = {
  Paid: 'healthy',
  Pending: 'warning',
  'Past Due': 'critical',
  Refunded: 'secondary',
};

// Registration source abbreviations
const sourceAbbrev: Record<string, string> = {
  Website: 'Web',
  Phone: 'Phone',
  Email: 'Email',
  'Colleague Outreach': 'Outreach',
  'Repeat Customer': 'Repeat',
  Referral: 'Referral',
};

export function RegistrationsRoster({
  registrations,
  blocks,
  onRowClick,
  isVirtualCertificate = false,
}: RegistrationsRosterProps) {
  // Check if a registrant has a specific block selected
  function isBlockSelected(selectedBlocks: string[] | null, blockId: string, blockName: string): boolean {
    if (!selectedBlocks) return false;
    // Full program = all blocks
    if (selectedBlocks.includes('Full') || selectedBlocks.includes('full')) return true;
    // Check by block name (case-insensitive contains)
    return selectedBlocks.some(b =>
      b.toLowerCase().includes(blockName.toLowerCase()) ||
      b.toLowerCase().includes(blockId.toLowerCase())
    );
  }

  // Determine registration type label
  function getRegistrationType(reg: RegistrationRosterItem): string {
    if (reg.attendance_type === 'Full') return 'Full Program';
    const count = reg.selected_blocks?.length || 0;
    return `${count} Block${count !== 1 ? 's' : ''}`;
  }

  // Check if this is a cancelled registration
  function isCancelled(reg: RegistrationRosterItem): boolean {
    return reg.registration_status === 'Cancelled' || reg.cancelled_at !== null;
  }

  // Check if registrant is certificate registrant vs block-only
  function isCertificateRegistrant(reg: RegistrationRosterItem): boolean {
    // Certificate registrants have "Full" attendance type or are explicitly marked
    return reg.attendance_type === 'Full';
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Name
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Company
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Email
            </th>
            {/* Dynamic block columns - only show if program has blocks */}
            {blocks.map((block) => (
              <th
                key={block.id}
                className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                title={block.name}
              >
                {block.shortName}
              </th>
            ))}
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Type
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Source
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Payment
            </th>
          </tr>
        </thead>
        <tbody>
          {registrations.length === 0 ? (
            <tr>
              <td colSpan={7 + blocks.length} className="text-center py-12 text-muted-foreground">
                No registrations yet. First registration typically comes 60-90 days before program start.
              </td>
            </tr>
          ) : (
            registrations.map((reg) => {
              const cancelled = isCancelled(reg);
              const isCertReg = isCertificateRegistrant(reg);

              return (
                <tr
                  key={reg.id}
                  className={cn(
                    'border-b border-border/50 transition-colors cursor-pointer',
                    cancelled
                      ? 'bg-muted/30 hover:bg-muted/50'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => onRowClick(reg)}
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className={cn(cancelled && 'line-through text-muted-foreground')}>
                      <span className="font-medium">{reg.full_name}</span>
                      {reg.job_title && (
                        <span className="block text-xs text-muted-foreground">{reg.job_title}</span>
                      )}
                    </div>
                    {/* Certificate vs Block-only indicator for virtual certificates */}
                    {isVirtualCertificate && (
                      <Badge
                        variant={isCertReg ? 'info' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {isCertReg ? 'Certificate' : 'Block-only'}
                      </Badge>
                    )}
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {reg.company_name || '-'}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-sm">
                    <span className={cn(cancelled && 'line-through text-muted-foreground')}>
                      {reg.email}
                    </span>
                  </td>

                  {/* Block columns with check/x */}
                  {blocks.map((block) => (
                    <td key={block.id} className="px-3 py-3 text-center">
                      {isBlockSelected(reg.selected_blocks, block.id, block.name) ? (
                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  ))}

                  {/* Registration Type */}
                  <td className="px-4 py-3 text-sm">
                    {getRegistrationType(reg)}
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {reg.registration_source
                      ? sourceAbbrev[reg.registration_source] || reg.registration_source
                      : '-'}
                  </td>

                  {/* Payment with cancellation indicator */}
                  <td className="px-4 py-3">
                    {cancelled ? (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="critical" className="flex items-center gap-1">
                          <Ban className="h-3 w-3" />
                          Cancelled
                        </Badge>
                        {reg.refund_status && reg.refund_status !== 'not_applicable' && (
                          <span className="text-xs text-muted-foreground">
                            ({reg.refund_status})
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge variant={paymentVariants[reg.payment_status] || 'secondary'}>
                        {reg.payment_status}
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
