'use client';

import { Mail, Phone, ExternalLink, User } from 'lucide-react';
import type { RegistrationRosterItem } from '@/lib/api/programs-queries';

interface PersonHeroProps {
  registration: RegistrationRosterItem;
}

/**
 * Person Hero section for Contact Panel
 * Displays contact photo/avatar, name, title, company, and contact info
 */
export function PersonHero({ registration }: PersonHeroProps) {
  // Generate initials for fallback avatar
  const initials = [
    registration.first_name?.[0] || '',
    registration.last_name?.[0] || '',
  ]
    .join('')
    .toUpperCase();

  // Get LinkedIn URL from registration if enriched (will be added by Apollo)
  // For now, check if there's a linkedin_url field
  const linkedinUrl = (registration as Record<string, unknown>).linkedin_url as string | null;
  const photoUrl = (registration as Record<string, unknown>).linkedin_photo_url as string | null;

  return (
    <div className="space-y-4">
      {/* Main hero row: Photo + Name/Title/Company */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Profile photo or initials avatar */}
        <div className="flex-shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={registration.full_name}
              className="w-20 h-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
              {initials ? (
                <span className="text-xl font-semibold text-muted-foreground">
                  {initials}
                </span>
              ) : (
                <User className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {/* Name, title, company */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-foreground truncate">
            {registration.full_name}
          </h2>
          {registration.job_title && (
            <p className="text-sm text-muted-foreground truncate">
              {registration.job_title}
            </p>
          )}
          {registration.company_name && (
            <p className="text-sm text-muted-foreground truncate">
              {registration.company_name}
            </p>
          )}
        </div>
      </div>

      {/* Contact info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Email - always shown */}
        <a
          href={`mailto:${registration.email}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <Mail className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          <span className="truncate">{registration.email}</span>
        </a>

        {/* Phone - only if available */}
        {registration.phone && (
          <a
            href={`tel:${registration.phone}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <Phone className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            <span>{registration.phone}</span>
          </a>
        )}

        {/* LinkedIn - only if available from enrichment */}
        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            <span>LinkedIn Profile</span>
          </a>
        )}
      </div>
    </div>
  );
}
