import { supabase } from './supabase'

export interface ClaimResult {
  blockId: string
  success: boolean
  claimId?: string
  error?: string
}

export async function claimBlocks(
  instructorId: string,
  blockIds: string[]
): Promise<ClaimResult[]> {
  const results: ClaimResult[] = []

  // Claim blocks sequentially to handle race conditions gracefully
  for (const blockId of blockIds) {
    try {
      const { data, error } = await supabase.rpc('claim_block', {
        p_instructor_id: instructorId,
        p_block_id: blockId,
      })

      if (error) {
        results.push({
          blockId,
          success: false,
          error: error.message.includes('not available')
            ? 'This block was claimed by another instructor'
            : error.message.includes('not eligible')
            ? 'You are not eligible for this block'
            : 'Failed to claim block',
        })
      } else {
        results.push({
          blockId,
          success: true,
          claimId: data as string,
        })
      }
    } catch (e) {
      results.push({
        blockId,
        success: false,
        error: 'Network error. Please try again.',
      })
    }
  }

  return results
}
