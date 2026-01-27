import { supabase } from './supabase'
import type { Instructor } from './types'

export async function validateToken(token: string): Promise<Instructor | null> {
  const { data, error } = await supabase
    .rpc('validate_magic_token', { p_token: token })

  if (error || !data || data.length === 0) {
    console.error('Token validation failed:', error)
    return null
  }

  // RPC returns an array, get first result
  const row = data[0]
  return {
    instructor_id: row.instructor_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    firm_state: row.firm_state,
    tier_designation: row.tier_designation,
  }
}
