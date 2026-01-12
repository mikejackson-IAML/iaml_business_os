/**
 * Error learning for n8n-brain
 * Stores and retrieves error→fix mappings
 */

import { supabase } from "./supabase.js";

/**
 * Store a new error fix
 */
export async function storeErrorFix({
  error_message,
  error_code = null,
  node_type = null,
  operation = null,
  fix_description,
  fix_example = null,
}) {
  // Check if similar error fix already exists
  const { data: existing } = await supabase
    .from("error_fixes")
    .select("id, times_applied, times_succeeded")
    .eq("error_message", error_message)
    .eq("node_type", node_type)
    .maybeSingle();

  if (existing) {
    // Update existing fix
    const { error } = await supabase
      .from("error_fixes")
      .update({
        fix_description,
        fix_example,
        times_applied: existing.times_applied + 1,
        times_succeeded: existing.times_succeeded + 1,
      })
      .eq("id", existing.id);

    if (error) throw error;
    return { error_fix_id: existing.id, updated: true };
  }

  // Insert new fix
  const { data, error } = await supabase
    .from("error_fixes")
    .insert({
      error_message,
      error_code,
      node_type,
      operation,
      fix_description,
      fix_example,
      times_applied: 1,
      times_succeeded: 1,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { error_fix_id: data.id, updated: false };
}

/**
 * Look up fixes for an error
 */
export async function lookupErrorFix({ error_message, node_type = null }) {
  // Use text search for fuzzy matching
  let query = supabase.from("error_fixes").select("*");

  // If node_type provided, prioritize those
  if (node_type) {
    query = query.or(`node_type.eq.${node_type},node_type.is.null`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Score results by relevance
  const errorWords = error_message.toLowerCase().split(/\s+/);

  const scored = data.map((fix) => {
    const fixWords = fix.error_message.toLowerCase().split(/\s+/);

    // Calculate word overlap
    const overlap = errorWords.filter((w) =>
      fixWords.some((fw) => fw.includes(w) || w.includes(fw))
    ).length;
    const relevance = overlap / Math.max(errorWords.length, 1);

    // Boost if node_type matches
    const nodeBoost = fix.node_type === node_type ? 0.3 : 0;

    // Calculate success rate
    const successRate =
      fix.times_applied > 0 ? fix.times_succeeded / fix.times_applied : 0;

    return {
      error_fix_id: fix.id,
      error_message: fix.error_message,
      node_type: fix.node_type,
      operation: fix.operation,
      fix_description: fix.fix_description,
      fix_example: fix.fix_example,
      times_applied: fix.times_applied,
      times_succeeded: fix.times_succeeded,
      success_rate: Math.round(successRate * 100) / 100,
      relevance: Math.round((relevance + nodeBoost) * 100) / 100,
    };
  });

  // Filter by minimum relevance and sort
  return scored
    .filter((s) => s.relevance > 0.1)
    .sort((a, b) => b.relevance - a.relevance || b.success_rate - a.success_rate)
    .slice(0, 5);
}

/**
 * Report whether a fix worked
 */
export async function reportFixResult({ error_fix_id, worked }) {
  const { data: fix, error: fetchError } = await supabase
    .from("error_fixes")
    .select("times_applied, times_succeeded")
    .eq("id", error_fix_id)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from("error_fixes")
    .update({
      times_applied: fix.times_applied + 1,
      times_succeeded: worked ? fix.times_succeeded + 1 : fix.times_succeeded,
    })
    .eq("id", error_fix_id);

  if (error) throw error;

  const newSuccessRate =
    (worked ? fix.times_succeeded + 1 : fix.times_succeeded) /
    (fix.times_applied + 1);

  return {
    success: true,
    new_success_rate: Math.round(newSuccessRate * 100) / 100,
  };
}

/**
 * Check if we have error knowledge for a node type
 */
export async function hasErrorKnowledge(node_type) {
  const { count, error } = await supabase
    .from("error_fixes")
    .select("*", { count: "exact", head: true })
    .eq("node_type", node_type);

  if (error) throw error;
  return count > 0;
}

/**
 * Get error fix count for a node type
 */
export async function getErrorFixCount(node_type) {
  const { count, error } = await supabase
    .from("error_fixes")
    .select("*", { count: "exact", head: true })
    .eq("node_type", node_type);

  if (error) throw error;
  return count || 0;
}
