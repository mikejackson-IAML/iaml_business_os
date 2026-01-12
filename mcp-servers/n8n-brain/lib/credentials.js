/**
 * Credential registry for n8n-brain
 * Maps service names to n8n credential IDs (NO SECRETS STORED)
 */

import { supabase } from "./supabase.js";

/**
 * Register a credential mapping
 */
export async function registerCredential({
  service_name,
  credential_id,
  credential_name = null,
  credential_type = null,
  notes = null,
}) {
  // Normalize service name (lowercase, no spaces)
  const normalizedService = service_name.toLowerCase().trim().replace(/\s+/g, "_");

  // Upsert (update if exists, insert if not)
  const { data, error } = await supabase
    .from("credentials")
    .upsert(
      {
        service_name: normalizedService,
        credential_id,
        credential_name,
        credential_type,
        notes,
      },
      { onConflict: "service_name" }
    )
    .select("id, service_name, credential_id")
    .single();

  if (error) throw error;
  return { success: true, ...data };
}

/**
 * Get credential for a service
 */
export async function getCredential(service_name) {
  const normalizedService = service_name.toLowerCase().trim().replace(/\s+/g, "_");

  const { data, error } = await supabase
    .from("credentials")
    .select("*")
    .eq("service_name", normalizedService)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return null;
  }

  return {
    service_name: data.service_name,
    credential_id: data.credential_id,
    credential_name: data.credential_name,
    credential_type: data.credential_type,
    notes: data.notes,
  };
}

/**
 * List all credential mappings
 */
export async function listCredentials() {
  const { data, error } = await supabase
    .from("credentials")
    .select("service_name, credential_id, credential_name, credential_type, notes")
    .order("service_name");

  if (error) throw error;
  return data;
}

/**
 * Remove a credential mapping
 */
export async function removeCredential(service_name) {
  const normalizedService = service_name.toLowerCase().trim().replace(/\s+/g, "_");

  const { error } = await supabase
    .from("credentials")
    .delete()
    .eq("service_name", normalizedService);

  if (error) throw error;
  return { success: true };
}

/**
 * Check if all services have credentials mapped
 */
export async function checkCredentials(services) {
  const results = [];
  for (const service of services) {
    const cred = await getCredential(service);
    results.push({
      service,
      mapped: cred !== null,
      credential_id: cred?.credential_id || null,
    });
  }
  return results;
}
