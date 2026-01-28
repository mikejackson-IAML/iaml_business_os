import { createClient } from '@supabase/supabase-js';

// Test data prefix for easy identification and cleanup
export const TEST_PREFIX = '[E2E]';

// Create a test project directly in database (for setup)
export async function createTestProject(name: string, status: string = 'idea', phase: string = 'capture') {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('projects')
    .insert({
      title: `${TEST_PREFIX} ${name}`,
      one_liner: `Test project created for E2E testing`,
      status,
      current_phase: phase,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Clean up test data
export async function cleanupTestData() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Delete all projects with test prefix
  const { error } = await supabase
    .schema('planning_studio')
    .from('projects')
    .delete()
    .like('title', `${TEST_PREFIX}%`);

  if (error) console.warn('Cleanup warning:', error.message);
}

// Generate unique test names
export function uniqueTestName(base: string): string {
  return `${TEST_PREFIX} ${base} ${Date.now()}`;
}
