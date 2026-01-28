'use client';

import { useState } from 'react';
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
import { FollowUpForm } from './follow-up-form';
import { FindColleaguesModal } from './find-colleagues-modal';
import type { Contact } from '@/lib/api/lead-intelligence-contacts-types';

interface ContactRowActionsProps {
  contact: Contact;
  onAddToCampaign?: (contactId: string) => void;
  onContactsChanged?: () => void;
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

export function ContactRowActions({ contact, onAddToCampaign, onContactsChanged }: ContactRowActionsProps) {
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [colleaguesOpen, setColleaguesOpen] = useState(false);

  return (
    <>
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

          <DropdownMenuItem onClick={() => setFollowUpOpen(true)}>
            <Clock className="h-4 w-4 mr-2" />
            Set Follow-up
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setColleaguesOpen(true)}
            disabled={!contact.company_id}
          >
            <Users className="h-4 w-4 mr-2" />
            Find Colleagues
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={async () => {
              const newVip = !contact.is_vip;
              const promise = fetch(`/api/lead-intelligence/contacts/${contact.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_vip: newVip }),
              }).then(async (res) => {
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error ?? 'Failed to update VIP status');
                }
                return res.json();
              });
              toast.promise(promise, {
                loading: newVip ? 'Marking as VIP...' : 'Removing VIP status...',
                success: () => {
                  onContactsChanged?.();
                  return newVip ? 'Marked as VIP' : 'VIP status removed';
                },
                error: (err) => err.message ?? 'Failed to update VIP status',
              });
            }}
          >
            <Star className="h-4 w-4 mr-2" />
            {contact.is_vip ? 'Remove VIP' : 'Mark as VIP'}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-destructive"
            onClick={async () => {
              if (!window.confirm('Mark as Do Not Contact? This will change their status.')) {
                return;
              }
              const promise = fetch(`/api/lead-intelligence/contacts/${contact.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'do_not_contact' }),
              }).then(async (res) => {
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error ?? 'Failed to update status');
                }
                return res.json();
              });
              toast.promise(promise, {
                loading: 'Marking as Do Not Contact...',
                success: () => {
                  onContactsChanged?.();
                  return 'Marked as Do Not Contact';
                },
                error: (err) => err.message ?? 'Failed to update status',
              });
            }}
          >
            <Ban className="h-4 w-4 mr-2" />
            Mark Do Not Contact
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FollowUpForm
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        contactIds={[contact.id]}
        onSuccess={() => onContactsChanged?.()}
      />

      {contact.company_id && (
        <FindColleaguesModal
          open={colleaguesOpen}
          onOpenChange={setColleaguesOpen}
          companyId={contact.company_id}
          companyName="Company"
          onContactsAdded={() => onContactsChanged?.()}
        />
      )}
    </>
  );
}
