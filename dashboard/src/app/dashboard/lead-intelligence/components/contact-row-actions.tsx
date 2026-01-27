'use client';

import Link from 'next/link';
import { MoreHorizontal, User, Rocket, Sparkles, Clock, Users, Star, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/dashboard-kit/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/dashboard-kit/components/ui/tooltip';
import type { Contact } from '@/lib/api/lead-intelligence-contacts-types';

interface ContactRowActionsProps {
  contact: Contact;
  onAddToCampaign?: (contactId: string) => void;
}

function DisabledItem({
  icon: Icon,
  label,
  tooltip,
}: {
  icon: React.ElementType;
  label: string;
  tooltip: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground opacity-50 cursor-not-allowed">
            <Icon className="h-4 w-4" />
            {label}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ContactRowActions({ contact, onAddToCampaign }: ContactRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/lead-intelligence/contacts/${contact.id}`}>
            <User className="h-4 w-4 mr-2" />
            View Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onAddToCampaign?.(contact.id)}
        >
          <Rocket className="h-4 w-4 mr-2" />
          Add to Campaign
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            const promise = fetch(`/api/lead-intelligence/contacts/${contact.id}/enrich`, {
              method: 'POST',
            }).then(async (res) => {
              const data = await res.json();
              if (!res.ok || !data.success) throw new Error(data.error ?? 'No enrichment data found');
              return data;
            });
            toast.promise(promise, {
              loading: 'Enriching contact...',
              success: (data) =>
                data.updates_applied > 0
                  ? `Updated ${data.updates_applied} field${data.updates_applied !== 1 ? 's' : ''}`
                  : 'No new data to fill',
              error: (err) => err.message ?? 'Enrichment failed',
            });
          }}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Enrich Contact
        </DropdownMenuItem>
        <DisabledItem icon={Clock} label="Set Follow-up" tooltip="Coming in Phase 4" />
        <DisabledItem icon={Users} label="Find Colleagues" tooltip="Coming in Phase 4" />

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            // TODO: Implement VIP toggle
            console.log('Mark as VIP:', contact.id);
          }}
        >
          <Star className="h-4 w-4 mr-2" />
          Mark as VIP
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-destructive"
          onClick={() => {
            // TODO: Implement DNC toggle
            console.log('Mark Do Not Contact:', contact.id);
          }}
        >
          <Ban className="h-4 w-4 mr-2" />
          Mark Do Not Contact
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
