'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { claimBlocks, ClaimResult } from '@/lib/claims'
import type { Program, ProgramBlock } from '@/lib/types'

interface ClaimDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  programs: Program[]
  selectedBlockIds: Set<string>
  instructorId: string
  onClaimComplete: (results: ClaimResult[]) => void
}

interface SelectedBlock extends ProgramBlock {
  programName: string
  programId: string
}

export function ClaimDialog({
  open,
  onOpenChange,
  programs,
  selectedBlockIds,
  instructorId,
  onClaimComplete,
}: ClaimDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<ClaimResult[] | null>(null)

  // Gather selected blocks with program context
  const selectedBlocks: SelectedBlock[] = []
  programs.forEach((program) => {
    program.blocks.forEach((block) => {
      if (selectedBlockIds.has(block.block_id)) {
        selectedBlocks.push({
          ...block,
          programName: program.program_name,
          programId: program.program_id,
        })
      }
    })
  })

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const blockIds = selectedBlocks.map((b) => b.block_id)
    const claimResults = await claimBlocks(instructorId, blockIds)
    setResults(claimResults)
    setSubmitting(false)

    // Notify parent of results after a brief pause to show results
    setTimeout(() => {
      onClaimComplete(claimResults)
      setResults(null)
    }, 2000)
  }

  const handleClose = () => {
    if (!submitting) {
      setResults(null)
      onOpenChange(false)
    }
  }

  const successCount = results?.filter((r) => r.success).length ?? 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {results ? 'Claim Results' : 'Confirm Your Selection'}
          </DialogTitle>
          <DialogDescription>
            {results
              ? `${successCount} of ${results.length} blocks claimed successfully`
              : `You are about to claim ${selectedBlocks.length} teaching block${selectedBlocks.length !== 1 ? 's' : ''}.`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {selectedBlocks.map((block) => {
              const result = results?.find((r) => r.blockId === block.block_id)

              return (
                <div
                  key={block.block_id}
                  className={`p-3 rounded-lg border ${
                    result
                      ? result.success
                        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{block.programName}</div>
                      <div className="text-sm text-muted-foreground">
                        {block.block_name} · {formatDate(block.start_date)}
                        {block.end_date &&
                          block.end_date !== block.start_date &&
                          ` - ${formatDate(block.end_date)}`}
                      </div>
                    </div>
                    {result && (
                      <div>
                        {result.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <div className="text-right">
                            <XCircle className="h-5 w-5 text-red-600 inline" />
                            <div className="text-xs text-red-600 mt-1">
                              {result.error}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          {!results && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  `Claim ${selectedBlocks.length} Block${selectedBlocks.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </>
          )}
          {results && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
