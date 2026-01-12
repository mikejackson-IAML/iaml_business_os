/**
 * Pattern management for n8n-brain
 * Stores and retrieves successful workflow patterns
 */

import { supabase } from "./supabase.js";

/**
 * Store a new pattern
 */
export async function storePattern({
  name,
  description,
  workflow_json,
  tags = [],
  services = [],
  node_types = [],
  trigger_type = null,
  source_workflow_id = null,
  source_workflow_name = null,
  notes = null,
}) {
  const { data, error } = await supabase
    .from("patterns")
    .insert({
      name,
      description,
      workflow_json,
      tags,
      services,
      node_types,
      trigger_type,
      source_workflow_id,
      source_workflow_name,
      notes,
      success_count: 1,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { pattern_id: data.id };
}

/**
 * Find similar patterns based on description and services
 */
export async function findSimilarPatterns({
  description,
  services = [],
  tags = [],
  limit = 5,
}) {
  // Start with a base query
  let query = supabase.from("patterns").select("*");

  // Filter by services if provided (patterns that have ANY of the requested services)
  if (services.length > 0) {
    query = query.overlaps("services", services);
  }

  // Filter by tags if provided
  if (tags.length > 0) {
    query = query.overlaps("tags", tags);
  }

  // Order by success_count descending and limit
  query = query.order("success_count", { ascending: false }).limit(limit);

  const { data, error } = await query;
  if (error) throw error;

  // Calculate similarity scores
  const patterns = data.map((pattern) => {
    let similarity = 0;

    // Service overlap (0-0.5)
    if (services.length > 0) {
      const serviceOverlap = pattern.services.filter((s) =>
        services.includes(s)
      ).length;
      similarity += (serviceOverlap / services.length) * 0.5;
    }

    // Tag overlap (0-0.3)
    if (tags.length > 0) {
      const tagOverlap = pattern.tags.filter((t) => tags.includes(t)).length;
      similarity += (tagOverlap / tags.length) * 0.3;
    }

    // Success count bonus (0-0.2)
    const successBonus = Math.min(pattern.success_count / 10, 1) * 0.2;
    similarity += successBonus;

    return {
      pattern_id: pattern.id,
      name: pattern.name,
      description: pattern.description,
      similarity_score: Math.round(similarity * 100) / 100,
      services: pattern.services,
      node_types: pattern.node_types,
      trigger_type: pattern.trigger_type,
      success_count: pattern.success_count,
      notes: pattern.notes,
    };
  });

  // Sort by similarity score
  patterns.sort((a, b) => b.similarity_score - a.similarity_score);

  return patterns;
}

/**
 * Get a pattern by ID
 */
export async function getPattern(pattern_id) {
  const { data, error } = await supabase
    .from("patterns")
    .select("*")
    .eq("id", pattern_id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update pattern success count (when reused successfully)
 */
export async function updatePatternSuccess(pattern_id) {
  const { data, error } = await supabase
    .from("patterns")
    .update({
      success_count: supabase.sql`success_count + 1`,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", pattern_id)
    .select("success_count")
    .single();

  if (error) {
    // Fallback: fetch, increment, update
    const { data: pattern } = await supabase
      .from("patterns")
      .select("success_count")
      .eq("id", pattern_id)
      .single();

    if (pattern) {
      const { error: updateError } = await supabase
        .from("patterns")
        .update({
          success_count: pattern.success_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", pattern_id);

      if (updateError) throw updateError;
      return { success_count: pattern.success_count + 1 };
    }
    throw error;
  }

  return { success_count: data.success_count };
}

/**
 * List all patterns (for reference)
 */
export async function listPatterns({ limit = 20, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from("patterns")
    .select("id, name, description, services, tags, trigger_type, success_count, created_at")
    .order("success_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}
