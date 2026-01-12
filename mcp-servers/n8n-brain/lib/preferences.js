/**
 * Preferences management for n8n-brain
 * Stores user preferences for workflow building
 */

import { supabase } from "./supabase.js";

/**
 * Set a preference
 */
export async function setPreference({ category, key, value }) {
  const { data, error } = await supabase
    .from("preferences")
    .upsert(
      {
        category,
        key,
        value: typeof value === "object" ? value : { value },
      },
      { onConflict: "category,key" }
    )
    .select("id")
    .single();

  if (error) throw error;
  return { success: true, preference_id: data.id };
}

/**
 * Get a specific preference
 */
export async function getPreference({ category, key }) {
  const { data, error } = await supabase
    .from("preferences")
    .select("value")
    .eq("category", category)
    .eq("key", key)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return null;
  }

  // Unwrap single values
  if (data.value && typeof data.value === "object" && "value" in data.value) {
    return data.value.value;
  }
  return data.value;
}

/**
 * Get all preferences, optionally filtered by category
 */
export async function getAllPreferences({ category = null } = {}) {
  let query = supabase.from("preferences").select("category, key, value");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query.order("category").order("key");
  if (error) throw error;

  // Transform into nested object
  const result = {};
  for (const pref of data) {
    if (!result[pref.category]) {
      result[pref.category] = {};
    }
    // Unwrap single values
    if (pref.value && typeof pref.value === "object" && "value" in pref.value) {
      result[pref.category][pref.key] = pref.value.value;
    } else {
      result[pref.category][pref.key] = pref.value;
    }
  }

  return result;
}

/**
 * Delete a preference
 */
export async function deletePreference({ category, key }) {
  const { error } = await supabase
    .from("preferences")
    .delete()
    .eq("category", category)
    .eq("key", key);

  if (error) throw error;
  return { success: true };
}

// Common preference categories and their defaults
export const DEFAULT_PREFERENCES = {
  naming: {
    workflow_prefix: "",
    use_timestamps: false,
    naming_style: "descriptive", // 'descriptive', 'short', 'camelCase'
  },
  error_handling: {
    always_add_error_node: false,
    continue_on_error: true,
    log_errors_to_db: true,
  },
  style: {
    node_spacing: 200,
    vertical_spacing: 150,
    align_nodes: true,
  },
  postgres: {
    always_output_data: true,
    default_credentials: null,
  },
};

/**
 * Initialize default preferences if not set
 */
export async function initializeDefaults() {
  for (const [category, prefs] of Object.entries(DEFAULT_PREFERENCES)) {
    for (const [key, value] of Object.entries(prefs)) {
      const existing = await getPreference({ category, key });
      if (existing === null) {
        await setPreference({ category, key, value });
      }
    }
  }
  return { success: true, message: "Defaults initialized" };
}
