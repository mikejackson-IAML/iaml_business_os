'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { format, parseISO } from 'date-fns'
import type { ProgramBlock } from '@/lib/types'

interface ProgramBlockItemProps {
  block: ProgramBlock
  isSelected: boolean
  onSelectionChange: (selected: boolean) => void
}

export function ProgramBlockItem({
  block,
  isSelected,
  onSelectionChange,
}: ProgramBlockItemProps) {
  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  }

  const dateRange = block.end_date
    ? `${formatDate(block.start_date)} - ${formatDate(block.end_date)}`
    : formatDate(block.start_date)

  return (
    <label className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 cursor-pointer">
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onSelectionChange(checked === true)}
      />
      <div className="flex-1">
        <div className="font-medium">{block.block_name}</div>
        <div className="text-sm text-muted-foreground">{dateRange}</div>
      </div>
    </label>
  )
}
