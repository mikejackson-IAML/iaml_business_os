export interface Instructor {
  instructor_id: string
  first_name: string
  last_name: string
  email: string
  firm_state: string | null
  tier_designation: number | null
}

export interface Program {
  program_id: string
  program_name: string
  program_type: string | null
  city: string | null
  state: string | null
  venue: string | null
  program_start_date: string
  program_end_date: string | null
  tier_status: 'tier_0' | 'tier_1' | 'tier_2'
  blocks: ProgramBlock[]
}

export interface ProgramBlock {
  block_id: string
  block_name: string
  sequence_order: number
  start_date: string
  end_date: string | null
  status: 'open' | 'claimed'
}

export interface ProgramFilters {
  programType?: string
  state?: string
  dateFrom?: string
  dateTo?: string
}

export function filterPrograms(programs: Program[], filters: ProgramFilters): Program[] {
  return programs.filter(program => {
    if (filters.programType && program.program_type !== filters.programType) {
      return false
    }
    if (filters.state && program.state !== filters.state) {
      return false
    }
    if (filters.dateFrom && program.program_start_date < filters.dateFrom) {
      return false
    }
    if (filters.dateTo && program.program_start_date > filters.dateTo) {
      return false
    }
    return true
  })
}
