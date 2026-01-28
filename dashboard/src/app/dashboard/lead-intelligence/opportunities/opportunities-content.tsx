'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, LayoutGrid, Table } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/dashboard-kit/components/ui/tabs';
import { Button } from '@/dashboard-kit/components/ui/button';
import { cn } from '@/dashboard-kit/lib/utils';
import type { Opportunity } from '@/lib/api/lead-intelligence-opportunities-types';
import {
  IN_HOUSE_STAGES,
  IN_HOUSE_STAGE_LABELS,
  INDIVIDUAL_STAGES,
  INDIVIDUAL_STAGE_LABELS,
} from '@/lib/api/lead-intelligence-opportunities-types';
import { OpportunityKanban } from './components/opportunity-kanban';
import { OpportunityTable } from './components/opportunity-table';
import { CreateOpportunityModal } from './components/create-opportunity-modal';

type PipelineTab = 'in_house' | 'individual';
type ViewMode = 'kanban' | 'table';

export function OpportunitiesContent() {
  const [tab, setTab] = useState<PipelineTab>('in_house');
  const [view, setView] = useState<ViewMode>('kanban');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lead-intelligence/opportunities?type=${tab}&limit=200`);
      if (res.ok) {
        const json = await res.json();
        setOpportunities(json.data || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const stages = tab === 'in_house' ? IN_HOUSE_STAGES : INDIVIDUAL_STAGES;
  const stageLabels = tab === 'in_house' ? IN_HOUSE_STAGE_LABELS : INDIVIDUAL_STAGE_LABELS;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="badge-live">PIPELINE</span>
              <h1 className="text-display-sm text-foreground">Opportunities</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your pipeline and track deal progress
            </p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Opportunity
          </Button>
        </div>
      </header>

      {/* Tabs + View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as PipelineTab)}>
          <TabsList>
            <TabsTrigger value="in_house">In-House</TabsTrigger>
            <TabsTrigger value="individual">Individual</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1 border rounded-md p-0.5">
          <button
            className={cn(
              'p-1.5 rounded-sm transition-colors',
              view === 'kanban' ? 'bg-muted' : 'hover:bg-muted/50'
            )}
            onClick={() => setView('kanban')}
            title="Kanban view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            className={cn(
              'p-1.5 rounded-sm transition-colors',
              view === 'table' ? 'bg-muted' : 'hover:bg-muted/50'
            )}
            onClick={() => setView('table')}
            title="Table view"
          >
            <Table className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : view === 'kanban' ? (
        <OpportunityKanban
          opportunities={opportunities}
          stages={stages}
          stageLabels={stageLabels}
        />
      ) : (
        <OpportunityTable
          opportunities={opportunities}
          stageLabels={stageLabels}
          stages={stages}
        />
      )}

      <CreateOpportunityModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultType={tab}
        onCreated={fetchOpportunities}
      />
    </div>
  );
}
