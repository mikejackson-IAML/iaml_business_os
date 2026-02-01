'use client';

import { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProgramDetail, ProgramLogistics } from '@/lib/api/programs-queries';

// Import all card components
import { InstructorCard } from './instructor-card';
import { MyHotelCard } from './my-hotel-card';
import { InstructorHotelCard } from './instructor-hotel-card';
import { RoomBlockCard } from './room-block-card';
import { VenueCard } from './venue-card';
import { BEOCard } from './beo-card';
import { MaterialsCard } from './materials-card';
import { AVCard } from './av-card';
import { PlatformReadyCard, CalendarInvitesCard, ReminderEmailsCard } from './virtual-setup-cards';
import { ExpensesSection } from './expenses-section';

interface LogisticsTabProps {
  program: ProgramDetail;
}

/**
 * Main Logistics Tab Container
 * PROG-33: Display logistics as checklist cards
 * PROG-43: Cards are expandable for editing
 * PROG-44: Virtual programs hide hotel/venue/AV cards
 */
export function LogisticsTab({ program }: LogisticsTabProps) {
  const [logistics, setLogistics] = useState<ProgramLogistics | null>(null);
  const [loading, setLoading] = useState(true);

  const isVirtual = program.format === 'virtual';

  // Load logistics data
  useEffect(() => {
    loadLogistics();
  }, [program.id]);

  async function loadLogistics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/programs/${program.id}/logistics`);
      const data = await res.json();
      if (data.success) {
        setLogistics(data.data);
      }
    } catch (error) {
      console.error('Failed to load logistics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!logistics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load logistics data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Virtual Program Badge - PROG-44 */}
      {isVirtual && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
          <Monitor className="h-4 w-4" />
          <span>Virtual Program - Showing applicable logistics only</span>
        </div>
      )}

      {/* People Section - Always shown */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">People</h3>
        <div className="space-y-2">
          <InstructorCard
            programId={program.id}
            logistics={logistics}
            onUpdate={loadLogistics}
          />
        </div>
      </section>

      {/* Accommodations - In-person only (PROG-35, PROG-36, PROG-37) */}
      {!isVirtual && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Accommodations</h3>
          <div className="space-y-2">
            <MyHotelCard
              programId={program.id}
              logistics={logistics}
              onUpdate={loadLogistics}
            />
            <InstructorHotelCard
              programId={program.id}
              logistics={logistics}
              onUpdate={loadLogistics}
            />
            <RoomBlockCard
              programId={program.id}
              program={program}
              logistics={logistics}
              onUpdate={loadLogistics}
            />
          </div>
        </section>
      )}

      {/* Venue - In-person only (PROG-38, PROG-39) */}
      {!isVirtual && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Venue</h3>
          <div className="space-y-2">
            <VenueCard
              programId={program.id}
              program={program}
              logistics={logistics}
              onUpdate={loadLogistics}
            />
            <BEOCard
              programId={program.id}
              logistics={logistics}
              onUpdate={loadLogistics}
            />
          </div>
        </section>
      )}

      {/* Virtual-specific - Virtual only */}
      {isVirtual && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Virtual Setup</h3>
          <div className="space-y-2">
            <PlatformReadyCard
              programId={program.id}
              logistics={logistics}
              onUpdate={loadLogistics}
            />
            <CalendarInvitesCard
              programId={program.id}
              logistics={logistics}
              onUpdate={loadLogistics}
            />
            <ReminderEmailsCard
              programId={program.id}
              logistics={logistics}
              onUpdate={loadLogistics}
            />
          </div>
        </section>
      )}

      {/* Materials - Both (PROG-40) */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Materials</h3>
        <div className="space-y-2">
          <MaterialsCard
            programId={program.id}
            logistics={logistics}
            isVirtual={isVirtual}
            onUpdate={loadLogistics}
          />
        </div>
      </section>

      {/* Equipment - In-person only (PROG-41) */}
      {!isVirtual && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Equipment</h3>
          <div className="space-y-2">
            <AVCard
              programId={program.id}
              logistics={logistics}
              onUpdate={loadLogistics}
            />
          </div>
        </section>
      )}

      {/* Expenses - Both (PROG-42) */}
      <ExpensesSection programId={program.id} />
    </div>
  );
}
