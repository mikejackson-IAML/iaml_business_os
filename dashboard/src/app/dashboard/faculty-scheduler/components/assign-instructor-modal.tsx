'use client';

import { useState, useEffect, useTransition } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { assignInstructor } from '../actions';
import {
  getEligibleInstructorsWithHistory,
  getProgramBlocks,
  type EligibleInstructorWithHistory,
  type ProgramBlock,
} from '@/lib/api/faculty-scheduler-queries';

interface AssignInstructorModalProps {
  programId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AssignInstructorModal({ programId, isOpen, onClose }: AssignInstructorModalProps) {
  const [isPending, startTransition] = useTransition();
  const [instructors, setInstructors] = useState<EligibleInstructorWithHistory[]>([]);
  const [blocks, setBlocks] = useState<ProgramBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [instructorData, blockData] = await Promise.all([
          getEligibleInstructorsWithHistory(programId),
          getProgramBlocks(programId),
        ]);
        setInstructors(instructorData);
        setBlocks(blockData);
        // Pre-select first open block
        const openBlock = blockData.find(b => b.status === 'open');
        if (openBlock) setSelectedBlock(openBlock.id);
      } catch (err) {
        console.error('Error loading modal data:', err);
        setError('Failed to load data');
      }
      setLoading(false);
    }
    if (isOpen) loadData();
  }, [isOpen, programId]);

  const handleAssign = async () => {
    if (!selectedBlock || !selectedInstructor) return;

    setError(null);
    startTransition(async () => {
      const result = await assignInstructor(selectedBlock, selectedInstructor);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to assign instructor');
      }
    });
  };

  const filteredInstructors = instructors.filter(i =>
    i.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openBlocks = blocks.filter(b => b.status === 'open');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden bg-background">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          <CardTitle>Assign Instructor</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto p-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Block Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Block
                </label>
                {openBlocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open blocks available</p>
                ) : (
                  <div className="space-y-2">
                    {openBlocks.map(block => (
                      <button
                        key={block.id}
                        onClick={() => setSelectedBlock(block.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedBlock === block.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium">{block.block_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(block.start_date).toLocaleDateString()}
                          {block.end_date && ` - ${new Date(block.end_date).toLocaleDateString()}`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructor Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Instructor
                </label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {filteredInstructors.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No eligible instructors found
                    </p>
                  ) : (
                    filteredInstructors.map(instructor => (
                      <button
                        key={instructor.instructor_id}
                        onClick={() => setSelectedInstructor(instructor.instructor_id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedInstructor === instructor.instructor_id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{instructor.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {instructor.email}
                            </div>
                            {instructor.history && instructor.history.total_programs > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {instructor.history.completed_count} program{instructor.history.completed_count !== 1 ? 's' : ''} completed
                                {instructor.history.pending_count > 0 && `, ${instructor.history.pending_count} scheduled`}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {instructor.reason}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedBlock || !selectedInstructor || isPending}
                >
                  {isPending ? 'Assigning...' : 'Assign Instructor'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
