'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProgramFilters } from '@/lib/types'

interface ProgramFiltersProps {
  filters: ProgramFilters
  onFiltersChange: (filters: ProgramFilters) => void
  programTypes: string[]
  states: string[]
}

export function ProgramFiltersBar({
  filters,
  onFiltersChange,
  programTypes,
  states,
}: ProgramFiltersProps) {
  const updateFilter = (key: keyof ProgramFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value || undefined })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="program-type">Program Type</Label>
          <Select
            value={filters.programType || ''}
            onValueChange={(v) => updateFilter('programType', v)}
          >
            <SelectTrigger id="program-type" className="w-[180px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {programTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Select
            value={filters.state || ''}
            onValueChange={(v) => updateFilter('state', v)}
          >
            <SelectTrigger id="state" className="w-[180px]">
              <SelectValue placeholder="All states" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date-from">From</Label>
          <Input
            id="date-from"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            className="w-[160px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date-to">To</Label>
          <Input
            id="date-to"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            className="w-[160px]"
          />
        </div>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
