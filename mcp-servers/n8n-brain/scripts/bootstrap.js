#!/usr/bin/env node

/**
 * Bootstrap script for n8n-brain
 *
 * Imports:
 * 1. HeyReach Activity Receiver workflow as a pattern
 * 2. Error fixes from n8n-lessons-learned.md
 * 3. Known credentials
 * 4. Default preferences
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..", "..");

// Supabase setup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY required");
  console.error("Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/bootstrap.js");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: { schema: "n8n_brain" },
});

// ============================================
// BOOTSTRAP DATA
// ============================================

// HeyReach Activity Receiver pattern
function getHeyReachPattern() {
  try {
    const workflowPath = join(PROJECT_ROOT, "n8n-workflows", "heyreach-activity-receiver.json");
    const workflowJson = JSON.parse(readFileSync(workflowPath, "utf-8"));

    return {
      name: "HeyReach Activity Receiver",
      description:
        "Webhook receives LinkedIn automation events from HeyReach, normalizes data, checks for duplicates, creates/updates contacts in Supabase, logs campaign activity, classifies replies with Gemini AI, and routes qualified leads to GHL branches.",
      workflow_json: workflowJson,
      tags: [
        "linkedin",
        "campaign-tracking",
        "ai-classification",
        "crm-integration",
        "webhook",
        "heyreach",
        "ghl",
      ],
      services: ["supabase", "ghl", "gemini", "heyreach"],
      node_types: [
        "n8n-nodes-base.webhook",
        "n8n-nodes-base.set",
        "n8n-nodes-base.code",
        "n8n-nodes-base.if",
        "n8n-nodes-base.postgres",
        "n8n-nodes-base.httpRequest",
        "n8n-nodes-base.noOp",
      ],
      trigger_type: "webhook",
      source_workflow_id: "9bt5BdyoosqB8ChU",
      source_workflow_name: "HeyReach Activity Receiver",
      notes:
        "Complex webhook receiver with AI classification. Key patterns: LinkedIn URL normalization, duplicate checking via metadata JSONB, AI reply classification with Gemini, GHL branch routing. Uses alwaysOutputData on all Postgres nodes.",
      success_count: 1,
    };
  } catch (e) {
    console.error("Could not load HeyReach workflow:", e.message);
    return null;
  }
}

// Error fixes from lessons-learned.md
const ERROR_FIXES = [
  {
    error_message:
      "Node outputs nothing when query returns no rows, downstream nodes never execute",
    error_code: null,
    node_type: "n8n-nodes-base.postgres",
    operation: "executeQuery",
    fix_description:
      "Enable 'Always Output Data' setting on Postgres nodes. Go to node Settings → enable 'Always Output Data'. This ensures the workflow continues even with empty results.",
    fix_example: { alwaysOutputData: true },
  },
  {
    error_message:
      "Cannot read properties of undefined (reading 'json') when Code node receives data from multiple paths",
    error_code: null,
    node_type: "n8n-nodes-base.code",
    operation: null,
    fix_description:
      "Use $input.first().json instead of referencing specific node names like $('Node Name').first().json. This handles data from any path that arrives at the node.",
    fix_example: { pattern: "const data = $input.first().json" },
  },
  {
    error_message:
      "API key treated as expression variable, not literal string",
    error_code: null,
    node_type: "n8n-nodes-base.httpRequest",
    operation: null,
    fix_description:
      "Don't wrap API keys in {{ }} expression syntax. Pasting 'key={{ API_KEY }}' treats it as an n8n expression. Instead, paste the key directly as a literal string.",
    fix_example: {
      wrong: "key={{ YOUR_API_KEY }}",
      correct: "key=AIzaSyD5wxlicI_actual_key_here",
    },
  },
  {
    error_message: "Rate limit exceeded for Gemini API",
    error_code: "429",
    node_type: "n8n-nodes-base.httpRequest",
    operation: "gemini-api",
    fix_description:
      "Gemini free tier allows ~2 requests/minute, 50/day. Space out test requests by 60+ seconds, or enable billing on Google Cloud (still uses free tier quota but removes strict limits).",
    fix_example: null,
  },
  {
    error_message: "Complex CTE query with multiple INSERTs fails silently",
    error_code: null,
    node_type: "n8n-nodes-base.postgres",
    operation: "executeQuery",
    fix_description:
      "Use simpler queries with ON CONFLICT DO UPDATE pattern instead of complex CTEs with multiple INSERTs. Simpler queries are more reliable and easier to debug.",
    fix_example: {
      pattern:
        "INSERT INTO table (col1, col2) VALUES ('val1', 'val2') ON CONFLICT (unique_col) DO UPDATE SET updated_at = NOW() RETURNING id",
    },
  },
  {
    error_message: "Webhook test fails with CORS or malformed request",
    error_code: null,
    node_type: "n8n-nodes-base.webhook",
    operation: null,
    fix_description:
      "Use curl instead of browser-based tools like Hoppscotch for webhook testing. Browser tools can have CORS issues. Also use /webhook-test/ URLs during development (works when workflow inactive) vs /webhook/ for production.",
    fix_example: {
      test_command:
        'curl -X POST "https://your-n8n.com/webhook-test/endpoint" -H "Content-Type: application/json" -d \'{"key": "value"}\'',
    },
  },
];

// Known credentials
const CREDENTIALS = [
  {
    service_name: "supabase",
    credential_id: "EgmvZHbvINHsh6PR",
    credential_name: "Supabase Postgres",
    credential_type: "postgres",
    notes: "Main Supabase database for IAML Business OS",
  },
];

// Default preferences
const PREFERENCES = [
  { category: "postgres", key: "always_output_data", value: true },
  { category: "error_handling", key: "continue_on_error", value: true },
  { category: "naming", key: "workflow_prefix", value: "" },
  { category: "style", key: "node_spacing", value: 200 },
];

// ============================================
// BOOTSTRAP FUNCTIONS
// ============================================

async function bootstrapPattern() {
  console.log("\n📦 Bootstrapping pattern...");

  const pattern = getHeyReachPattern();
  if (!pattern) {
    console.log("  ⚠️  Skipping pattern (workflow file not found)");
    return;
  }

  // Check if already exists
  const { data: existing } = await supabase
    .from("patterns")
    .select("id")
    .eq("source_workflow_id", pattern.source_workflow_id)
    .maybeSingle();

  if (existing) {
    console.log("  ✓ Pattern already exists, skipping");
    return;
  }

  const { error } = await supabase.from("patterns").insert(pattern);

  if (error) {
    console.error("  ✗ Failed to insert pattern:", error.message);
  } else {
    console.log("  ✓ Inserted: HeyReach Activity Receiver");
  }
}

async function bootstrapErrorFixes() {
  console.log("\n🔧 Bootstrapping error fixes...");

  for (const fix of ERROR_FIXES) {
    // Check if similar fix exists
    const { data: existing } = await supabase
      .from("error_fixes")
      .select("id")
      .eq("node_type", fix.node_type)
      .ilike("error_message", `%${fix.error_message.substring(0, 50)}%`)
      .maybeSingle();

    if (existing) {
      console.log(`  ✓ Already exists: ${fix.error_message.substring(0, 40)}...`);
      continue;
    }

    const { error } = await supabase.from("error_fixes").insert(fix);

    if (error) {
      console.error(`  ✗ Failed: ${error.message}`);
    } else {
      console.log(`  ✓ Inserted: ${fix.error_message.substring(0, 40)}...`);
    }
  }
}

async function bootstrapCredentials() {
  console.log("\n🔑 Bootstrapping credentials...");

  for (const cred of CREDENTIALS) {
    const { data: existing } = await supabase
      .from("credentials")
      .select("id")
      .eq("service_name", cred.service_name)
      .maybeSingle();

    if (existing) {
      console.log(`  ✓ Already exists: ${cred.service_name}`);
      continue;
    }

    const { error } = await supabase.from("credentials").insert(cred);

    if (error) {
      console.error(`  ✗ Failed: ${error.message}`);
    } else {
      console.log(`  ✓ Registered: ${cred.service_name} → ${cred.credential_id}`);
    }
  }
}

async function bootstrapPreferences() {
  console.log("\n⚙️  Bootstrapping preferences...");

  for (const pref of PREFERENCES) {
    const { data: existing } = await supabase
      .from("preferences")
      .select("id")
      .eq("category", pref.category)
      .eq("key", pref.key)
      .maybeSingle();

    if (existing) {
      console.log(`  ✓ Already exists: ${pref.category}.${pref.key}`);
      continue;
    }

    const { error } = await supabase.from("preferences").insert({
      category: pref.category,
      key: pref.key,
      value: { value: pref.value },
    });

    if (error) {
      console.error(`  ✗ Failed: ${error.message}`);
    } else {
      console.log(`  ✓ Set: ${pref.category}.${pref.key} = ${JSON.stringify(pref.value)}`);
    }
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("🧠 n8n-brain Bootstrap");
  console.log("=".repeat(50));

  try {
    // Test connection
    const { data, error } = await supabase.from("patterns").select("count").limit(1);
    if (error) throw error;
    console.log("✓ Connected to Supabase n8n_brain schema");
  } catch (e) {
    console.error("✗ Failed to connect to Supabase:", e.message);
    console.error("\nMake sure you have:");
    console.error("1. Run the migration to create the n8n_brain schema");
    console.error("2. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables");
    process.exit(1);
  }

  await bootstrapPattern();
  await bootstrapErrorFixes();
  await bootstrapCredentials();
  await bootstrapPreferences();

  console.log("\n" + "=".repeat(50));
  console.log("✓ Bootstrap complete!");
  console.log("\nNext steps:");
  console.log("1. Add n8n-brain to your Claude Code MCP config");
  console.log("2. Install dependencies: cd mcp-servers/n8n-brain && npm install");
  console.log("3. Test: Ask Claude to calculate_confidence for a workflow task");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
