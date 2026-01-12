#!/usr/bin/env node

/**
 * n8n-brain MCP Server
 *
 * Learning layer for n8n workflow building that provides:
 * - Pattern storage and retrieval
 * - Error→fix mappings
 * - Credential registry
 * - Confidence scoring for progressive autonomy
 * - User preferences
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import library functions
import {
  storePattern,
  findSimilarPatterns,
  getPattern,
  updatePatternSuccess,
  listPatterns,
} from "./lib/patterns.js";

import {
  storeErrorFix,
  lookupErrorFix,
  reportFixResult,
} from "./lib/errors.js";

import {
  registerCredential,
  getCredential,
  listCredentials,
} from "./lib/credentials.js";

import { calculateConfidence, recordAction } from "./lib/confidence.js";

import {
  setPreference,
  getPreference,
  getAllPreferences,
} from "./lib/preferences.js";

// Create server instance
const server = new Server(
  {
    name: "n8n-brain",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ============================================
      // PATTERN TOOLS
      // ============================================
      {
        name: "store_pattern",
        description:
          "Store a successful workflow as a reusable pattern. Use after a workflow is built and tested successfully.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the pattern (e.g., 'Airtable to Slack notification')",
            },
            description: {
              type: "string",
              description: "Description of what the pattern does",
            },
            workflow_json: {
              type: "object",
              description: "The complete n8n workflow JSON",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags for searchability (e.g., ['notification', 'slack', 'trigger'])",
            },
            services: {
              type: "array",
              items: { type: "string" },
              description: "Services used (e.g., ['airtable', 'slack'])",
            },
            node_types: {
              type: "array",
              items: { type: "string" },
              description: "Node types used (e.g., ['webhook', 'httpRequest', 'code'])",
            },
            trigger_type: {
              type: "string",
              description: "Type of trigger (webhook, schedule, manual, etc.)",
            },
            source_workflow_id: {
              type: "string",
              description: "Original workflow ID from n8n (if imported)",
            },
            notes: {
              type: "string",
              description: "Any notes or learnings about this pattern",
            },
          },
          required: ["name", "description", "workflow_json", "services", "node_types"],
        },
      },
      {
        name: "find_similar_patterns",
        description:
          "Find patterns similar to a task description. Use before building a workflow to check for existing patterns.",
        inputSchema: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description: "Description of what you want to build",
            },
            services: {
              type: "array",
              items: { type: "string" },
              description: "Services that will be used",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags to filter by",
            },
            limit: {
              type: "number",
              description: "Maximum patterns to return (default: 5)",
            },
          },
          required: ["description"],
        },
      },
      {
        name: "get_pattern",
        description: "Get a specific pattern by ID to use as a template.",
        inputSchema: {
          type: "object",
          properties: {
            pattern_id: {
              type: "string",
              description: "The pattern ID (UUID)",
            },
          },
          required: ["pattern_id"],
        },
      },
      {
        name: "update_pattern_success",
        description:
          "Increment success count when a pattern is reused successfully. Call after using a pattern.",
        inputSchema: {
          type: "object",
          properties: {
            pattern_id: {
              type: "string",
              description: "The pattern ID that was used",
            },
          },
          required: ["pattern_id"],
        },
      },

      // ============================================
      // ERROR LEARNING TOOLS
      // ============================================
      {
        name: "store_error_fix",
        description:
          "Store an error→fix mapping after successfully debugging an issue. Helps avoid the same mistake twice.",
        inputSchema: {
          type: "object",
          properties: {
            error_message: {
              type: "string",
              description: "The error message that occurred",
            },
            error_code: {
              type: "string",
              description: "Error code if available",
            },
            node_type: {
              type: "string",
              description: "The n8n node type that errored (e.g., 'n8n-nodes-base.postgres')",
            },
            operation: {
              type: "string",
              description: "The operation being performed (e.g., 'executeQuery')",
            },
            fix_description: {
              type: "string",
              description: "Description of what fixed the error",
            },
            fix_example: {
              type: "object",
              description: "Example of the correct configuration",
            },
          },
          required: ["error_message", "fix_description"],
        },
      },
      {
        name: "lookup_error_fix",
        description:
          "Look up known fixes for an error message. Use when encountering an error during workflow building.",
        inputSchema: {
          type: "object",
          properties: {
            error_message: {
              type: "string",
              description: "The error message to look up",
            },
            node_type: {
              type: "string",
              description: "The node type to narrow results",
            },
          },
          required: ["error_message"],
        },
      },
      {
        name: "report_fix_result",
        description:
          "Report whether a suggested fix worked. Helps improve fix recommendations over time.",
        inputSchema: {
          type: "object",
          properties: {
            error_fix_id: {
              type: "string",
              description: "The error fix ID that was tried",
            },
            worked: {
              type: "boolean",
              description: "Whether the fix resolved the issue",
            },
          },
          required: ["error_fix_id", "worked"],
        },
      },

      // ============================================
      // CREDENTIAL TOOLS
      // ============================================
      {
        name: "register_credential",
        description:
          "Register a credential mapping (service name → n8n credential ID). No secrets are stored, just the mapping.",
        inputSchema: {
          type: "object",
          properties: {
            service_name: {
              type: "string",
              description: "Service name (e.g., 'supabase', 'slack', 'airtable')",
            },
            credential_id: {
              type: "string",
              description: "The n8n credential ID",
            },
            credential_name: {
              type: "string",
              description: "Human-readable name from n8n",
            },
            credential_type: {
              type: "string",
              description: "Type of credential (e.g., 'postgres', 'oAuth2')",
            },
            notes: {
              type: "string",
              description: "Any notes about this credential",
            },
          },
          required: ["service_name", "credential_id"],
        },
      },
      {
        name: "get_credential",
        description:
          "Get the credential ID for a service. Use when building workflows to get the correct credential.",
        inputSchema: {
          type: "object",
          properties: {
            service_name: {
              type: "string",
              description: "Service name to look up",
            },
          },
          required: ["service_name"],
        },
      },
      {
        name: "list_credentials",
        description: "List all registered credential mappings.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },

      // ============================================
      // CONFIDENCE TOOLS
      // ============================================
      {
        name: "calculate_confidence",
        description:
          "Calculate confidence score for a task. Determines whether to ask first (0-39), do and verify (40-79), or act autonomously (80-100).",
        inputSchema: {
          type: "object",
          properties: {
            task_description: {
              type: "string",
              description: "Description of what you want to build",
            },
            services: {
              type: "array",
              items: { type: "string" },
              description: "Services that will be used",
            },
            node_types: {
              type: "array",
              items: { type: "string" },
              description: "Node types that will be used",
            },
          },
          required: ["task_description"],
        },
      },
      {
        name: "record_action",
        description:
          "Record an autonomous action and its outcome. Used to calibrate confidence scoring over time.",
        inputSchema: {
          type: "object",
          properties: {
            task_description: {
              type: "string",
              description: "What was attempted",
            },
            services_involved: {
              type: "array",
              items: { type: "string" },
              description: "Services used",
            },
            node_types_involved: {
              type: "array",
              items: { type: "string" },
              description: "Node types used",
            },
            confidence_score: {
              type: "number",
              description: "Confidence score at time of action",
            },
            confidence_factors: {
              type: "object",
              description: "Breakdown of confidence factors",
            },
            recommendation: {
              type: "string",
              description: "The recommendation given (ask_first, do_and_verify, autonomous)",
            },
            action_taken: {
              type: "string",
              description: "What action was taken",
            },
            outcome: {
              type: "string",
              enum: ["success", "failure", "partial"],
              description: "The outcome of the action",
            },
            outcome_notes: {
              type: "string",
              description: "Notes about the outcome",
            },
            pattern_id: {
              type: "string",
              description: "Pattern ID if a pattern was stored/used",
            },
          },
          required: ["task_description", "action_taken", "outcome"],
        },
      },

      // ============================================
      // PREFERENCE TOOLS
      // ============================================
      {
        name: "set_preference",
        description:
          "Set a user preference for workflow building (naming conventions, error handling, style).",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Category (naming, error_handling, style, postgres)",
            },
            key: {
              type: "string",
              description: "Preference key",
            },
            value: {
              description: "Preference value (can be any JSON type)",
            },
          },
          required: ["category", "key", "value"],
        },
      },
      {
        name: "get_preferences",
        description: "Get all preferences, optionally filtered by category.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Category to filter by (optional)",
            },
          },
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      // Pattern tools
      case "store_pattern":
        result = await storePattern(args);
        break;
      case "find_similar_patterns":
        result = await findSimilarPatterns(args);
        break;
      case "get_pattern":
        result = await getPattern(args.pattern_id);
        break;
      case "update_pattern_success":
        result = await updatePatternSuccess(args.pattern_id);
        break;

      // Error learning tools
      case "store_error_fix":
        result = await storeErrorFix(args);
        break;
      case "lookup_error_fix":
        result = await lookupErrorFix(args);
        break;
      case "report_fix_result":
        result = await reportFixResult(args);
        break;

      // Credential tools
      case "register_credential":
        result = await registerCredential(args);
        break;
      case "get_credential":
        result = await getCredential(args.service_name);
        if (result === null) {
          result = { found: false, message: `No credential mapped for '${args.service_name}'` };
        } else {
          result = { found: true, ...result };
        }
        break;
      case "list_credentials":
        result = await listCredentials();
        break;

      // Confidence tools
      case "calculate_confidence":
        result = await calculateConfidence({
          task_description: args.task_description,
          services: args.services || [],
          node_types: args.node_types || [],
        });
        break;
      case "record_action":
        result = await recordAction(args);
        break;

      // Preference tools
      case "set_preference":
        result = await setPreference(args);
        break;
      case "get_preferences":
        result = await getAllPreferences(args);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: true,
              message: error.message,
              tool: name,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("n8n-brain MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
