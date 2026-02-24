/**
 * Error learning for n8n-brain
 * Stores and retrieves error→fix mappings
 */

import { supabase } from "./supabase.js";

/**
 * Normalize an error message for dedup matching.
 * Strips IPs, ports, timestamps, UUIDs, and lowercases.
 */
function normalizeErrorMessage(msg) {
  return msg
    .toLowerCase()
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+\b/g, "<ip>:<port>")
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "<ip>")
    .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.\dZ]*/g, "<timestamp>")
    .replace(/\b\d{10,13}\b/g, "<timestamp>")
    .replace(/:\d{2,5}\b/g, ":<port>")
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "<uuid>"
    );
}

/**
 * Categorize an error message based on keywords.
 */
function categorizeError(msg) {
  const lower = msg.toLowerCase();
  if (/econnrefused|etimedout|enotfound|connection|connect |socket|dns/.test(lower))
    return "connection";
  if (/401|403|unauthorized|forbidden|auth|credential|token|api.?key|permission/.test(lower))
    return "authentication";
  if (/cannot read prop|undefined|null|typeerror|referenceerror|syntax/.test(lower))
    return "data_format";
  if (/timeout|timed out|deadline|too long/.test(lower))
    return "timeout";
  if (/config|parameter|missing|required|invalid|schema|validation/.test(lower))
    return "node_config";
  if (/rate.?limit|429|throttl|too many/.test(lower))
    return "rate_limit";
  if (/500|502|503|504|server error|internal error|bad gateway/.test(lower))
    return "server_error";
  return "unknown";
}

/**
 * Store a new error fix. Upserts on normalized_error + node_type.
 */
export async function storeErrorFix({
  error_message,
  error_code = null,
  node_type = null,
  operation = null,
  fix_description,
  fix_example = null,
  error_category = null,
}) {
  const normalized = normalizeErrorMessage(error_message);
  const category = error_category || categorizeError(error_message);

  // Check if similar normalized error already exists for this node_type
  let query = supabase
    .from("error_fixes")
    .select("id, times_applied, times_succeeded")
    .eq("normalized_error", normalized);

  if (node_type) {
    query = query.eq("node_type", node_type);
  } else {
    query = query.is("node_type", null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    // Update existing fix — merge counts
    const { error } = await supabase
      .from("error_fixes")
      .update({
        fix_description,
        fix_example,
        error_category: category,
        times_applied: existing.times_applied + 1,
        times_succeeded: existing.times_succeeded + 1,
      })
      .eq("id", existing.id);

    if (error) throw error;
    return { error_fix_id: existing.id, updated: true, error_category: category };
  }

  // Insert new fix (trigger auto-populates normalized_error, search_vector, error_category)
  const { data, error } = await supabase
    .from("error_fixes")
    .insert({
      error_message,
      error_code,
      node_type,
      operation,
      fix_description,
      fix_example,
      error_category: category,
      normalized_error: normalized,
      times_applied: 1,
      times_succeeded: 1,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { error_fix_id: data.id, updated: false, error_category: category };
}

/**
 * Look up fixes for an error using Postgres full-text search.
 * Falls back to category + node_type if no text hits.
 */
export async function lookupErrorFix({
  error_message,
  node_type = null,
  error_category = null,
}) {
  const category = error_category || categorizeError(error_message);

  // Use the Postgres RPC for full-text search with fallback
  const { data, error } = await supabase.rpc("search_error_fixes", {
    p_error_message: error_message,
    p_node_type: node_type || null,
    p_error_category: category,
    p_limit: 5,
  });

  if (error) throw error;

  if (data && data.length > 0) {
    return data.map((fix) => ({
      error_fix_id: fix.id,
      error_message: fix.error_message,
      error_category: fix.error_category,
      node_type: fix.node_type,
      fix_description: fix.fix_description,
      fix_example: fix.fix_example,
      times_applied: fix.times_applied,
      times_succeeded: fix.times_succeeded,
      success_rate:
        fix.times_applied > 0
          ? Math.round((fix.times_succeeded / fix.times_applied) * 100) / 100
          : 0,
      relevance: Math.round(fix.relevance * 100) / 100,
    }));
  }

  return [];
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
