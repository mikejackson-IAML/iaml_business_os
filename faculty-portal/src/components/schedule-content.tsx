'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useInstructor } from './instructor-provider'
import { ProgramFiltersBar } from './program-filters'
import { ProgramCard } from './program-card'
import { ClaimDialog } from './claim-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getAvailablePrograms } from '@/lib/programs'
import { filterPrograms } from '@/lib/types'
import type { Program, ProgramFilters } from '@/lib/types'
import type { ClaimResult } from '@/lib/claims'

export function ScheduleContent() {
  const { instructor } = useInstructor()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ProgramFilters>({})
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)

  useEffect(() => {
    async function loadPrograms() {
      try {
        const data = await getAvailablePrograms(instructor.instructor_id)
        setPrograms(data)
      } catch (e) {
        setError('Failed to load programs. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadPrograms()
  }, [instructor.instructor_id])

  const filteredPrograms = useMemo(
    () => filterPrograms(programs, filters),
    [programs, filters]
  )

  // Extract unique filter options
  const programTypes = useMemo(
    () => [...new Set(programs.map((p) => p.program_type).filter(Boolean))] as string[],
    [programs]
  )
  const states = useMemo(
    () => [...new Set(programs.map((p) => p.state).filter(Boolean))] as string[],
    [programs]
  )

  const handleBlockSelectionChange = (blockId: string, selected: boolean) => {
    setSelectedBlockIds((prev) => {
      const next = new Set(prev)
      if (selected) {
        next.add(blockId)
      } else {
        next.delete(blockId)
      }
      return next
    })
  }

  const handleSelectAllBlocks = (programId: string, selected: boolean) => {
    const program = programs.find((p) => p.program_id === programId)
    if (!program) return

    setSelectedBlockIds((prev) => {
      const next = new Set(prev)
      program.blocks.forEach((block) => {
        if (selected) {
          next.add(block.block_id)
        } else {
          next.delete(block.block_id)
        }
      })
      return next
    })
  }

  const handleClaimComplete = (results: ClaimResult[]) => {
    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    // Show toast notifications
    if (successCount > 0) {
      toast.success(
        `Successfully claimed ${successCount} block${successCount !== 1 ? 's' : ''}!`,
        {
          description: 'Confirmation email will be sent shortly.',
        }
      )
    }

    if (failCount > 0) {
      toast.error(
        `Failed to claim ${failCount} block${failCount !== 1 ? 's' : ''}`,
        {
          description: 'Someone may have claimed them first.',
        }
      )
    }

    // Remove successfully claimed blocks from selection
    const successIds = new Set(results.filter((r) => r.success).map((r) => r.blockId))

    setSelectedBlockIds((prev) => {
      const next = new Set(prev)
      successIds.forEach((id) => next.delete(id))
      return next
    })

    // Remove claimed blocks from programs (they're no longer available)
    setPrograms((prev) =>
      prev.map((program) => ({
        ...program,
        blocks: program.blocks.filter((block) => !successIds.has(block.block_id)),
      })).filter((program) => program.blocks.length > 0)
    )

    setClaimDialogOpen(false)
  }

  const selectedCount = selectedBlockIds.size

  if (loading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className={`container mx-auto py-10 space-y-6 ${selectedCount > 0 ? 'pb-24' : ''}`}>
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {instructor.first_name}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {programs.length === 0
            ? 'No programs are currently available for you.'
            : `${filteredPrograms.length} program${filteredPrograms.length !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {programs.length > 0 && (
        <>
          <ProgramFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            programTypes={programTypes}
            states={states}
          />

          <div className="space-y-4">
            {filteredPrograms.map((program) => (
              <ProgramCard
                key={program.program_id}
                program={program}
                selectedBlockIds={selectedBlockIds}
                onBlockSelectionChange={handleBlockSelectionChange}
                onSelectAllBlocks={handleSelectAllBlocks}
              />
            ))}
          </div>

          {filteredPrograms.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No programs match your filters.
            </div>
          )}
        </>
      )}

      {/* Selection summary */}
      {selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <span className="font-medium">
              {selectedCount} block{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <Button onClick={() => setClaimDialogOpen(true)}>
              Claim Selected ({selectedCount})
            </Button>
          </div>
        </div>
      )}

      {/* Claim dialog */}
      <ClaimDialog
        open={claimDialogOpen}
        onOpenChange={setClaimDialogOpen}
        programs={filteredPrograms}
        selectedBlockIds={selectedBlockIds}
        instructorId={instructor.instructor_id}
        onClaimComplete={handleClaimComplete}
      />
    </div>
  )
}
