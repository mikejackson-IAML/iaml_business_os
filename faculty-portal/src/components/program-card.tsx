'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ProgramBlockItem } from './program-block-item'
import type { Program } from '@/lib/types'

interface ProgramCardProps {
  program: Program
  selectedBlockIds: Set<string>
  onBlockSelectionChange: (blockId: string, selected: boolean) => void
  onSelectAllBlocks: (programId: string, selected: boolean) => void
}

export function ProgramCard({
  program,
  selectedBlockIds,
  onBlockSelectionChange,
  onSelectAllBlocks,
}: ProgramCardProps) {
  const allBlocksSelected =
    program.blocks.length > 0 &&
    program.blocks.every((b) => selectedBlockIds.has(b.block_id))
  const someBlocksSelected =
    program.blocks.some((b) => selectedBlockIds.has(b.block_id)) && !allBlocksSelected

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  }

  const location = [program.venue, program.city, program.state]
    .filter(Boolean)
    .join(', ')

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={allBlocksSelected}
            data-state={someBlocksSelected ? 'indeterminate' : undefined}
            onCheckedChange={(checked) =>
              onSelectAllBlocks(program.program_id, checked === true)
            }
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">{program.program_name}</h3>
              {program.program_type && (
                <Badge variant="secondary">{program.program_type}</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(program.program_start_date)}
                {program.program_end_date &&
                  program.program_end_date !== program.program_start_date &&
                  ` - ${formatDate(program.program_end_date)}`}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border-t pt-3 mt-2">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Available Blocks ({program.blocks.length})
          </div>
          <div className="space-y-1">
            {program.blocks.map((block) => (
              <ProgramBlockItem
                key={block.block_id}
                block={block}
                isSelected={selectedBlockIds.has(block.block_id)}
                onSelectionChange={(selected) =>
                  onBlockSelectionChange(block.block_id, selected)
                }
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
