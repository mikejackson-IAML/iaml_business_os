import { supabase } from './supabase'
import type { Program, ProgramBlock } from './types'

interface RawProgram {
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

export async function getAvailablePrograms(instructorId: string): Promise<Program[]> {
  const { data, error } = await supabase
    .rpc('get_available_programs', { p_instructor_id: instructorId })

  if (error) {
    console.error('Failed to fetch available programs:', error)
    throw new Error('Failed to load programs')
  }

  return (data as RawProgram[]).map(row => ({
    program_id: row.program_id,
    program_name: row.program_name,
    program_type: row.program_type,
    city: row.city,
    state: row.state,
    venue: row.venue,
    program_start_date: row.program_start_date,
    program_end_date: row.program_end_date,
    tier_status: row.tier_status,
    blocks: row.blocks || [],
  }))
}
