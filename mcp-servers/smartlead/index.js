#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_KEY = process.env.SMARTLEAD_API_KEY;
const BASE_URL = "https://server.smartlead.ai/api/v1";

if (!API_KEY) {
  console.error("Error: SMARTLEAD_API_KEY environment variable is required");
  process.exit(1);
}

// ---------- Rate Limiter (token-bucket: 10 req / 2 sec) ----------

const BUCKET_MAX = 10;
const BUCKET_REFILL_MS = 2000;
let tokens = BUCKET_MAX;
let lastRefill = Date.now();

function waitForToken() {
  return new Promise((resolve) => {
    const now = Date.now();
    const elapsed = now - lastRefill;
    if (elapsed >= BUCKET_REFILL_MS) {
      tokens = BUCKET_MAX;
      lastRefill = now;
    }
    if (tokens > 0) {
      tokens--;
      return resolve();
    }
    const wait = BUCKET_REFILL_MS - elapsed;
    setTimeout(() => {
      tokens = BUCKET_MAX - 1;
      lastRefill = Date.now();
      resolve();
    }, wait);
  });
}

// ---------- API Helper ----------

async function apiRequest(endpoint, method = "GET", body = null, queryParams = {}) {
  await waitForToken();

  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", API_KEY);

  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  }

  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SmartLead API ${response.status}: ${text}`);
  }

  const text = await response.text();
  if (!text) return {};
  return JSON.parse(text);
}

// ---------- Tool Definitions ----------

const TOOLS = [
  // ── Campaign Management ──
  {
    name: "create_campaign",
    description: "Create a new SmartLead campaign. Returns the campaign ID.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Campaign name" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_campaigns",
    description: "List all campaigns. Supports pagination.",
    inputSchema: {
      type: "object",
      properties: {
        offset: { type: "number", description: "Pagination offset (default: 0)", default: 0 },
        limit: { type: "number", description: "Results per page (default: 100)", default: 100 },
      },
    },
  },
  {
    name: "get_campaign",
    description: "Get details of a specific campaign by ID.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "update_campaign_settings",
    description: "Update campaign settings like daily send limits, tracking domain, stop on reply, etc.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
        settings: {
          type: "object",
          description: "Settings object — keys include: max_daily_count, track_settings, stop_message_on_reply, send_as_plain_text, follow_up_percentage, add_unsubscribe_tag, etc.",
        },
      },
      required: ["campaign_id", "settings"],
    },
  },
  {
    name: "update_campaign_status",
    description: "Set campaign status to STARTED, PAUSED, or STOPPED.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
        status: {
          type: "string",
          enum: ["STARTED", "PAUSED", "STOPPED"],
          description: "New campaign status",
        },
      },
      required: ["campaign_id", "status"],
    },
  },
  {
    name: "save_campaign_sequence",
    description: "Save email sequence steps for a campaign. Each step has subject, body, and wait days.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
        sequences: {
          type: "array",
          description: "Array of sequence steps",
          items: {
            type: "object",
            properties: {
              seq_number: { type: "number", description: "Step number (1-based)" },
              seq_delay_details: {
                type: "object",
                properties: {
                  delay_in_days: { type: "number", description: "Days to wait before sending this step" },
                },
              },
              subject: { type: "string", description: "Email subject line (use {{variable}} for merge tags)" },
              email_body: { type: "string", description: "HTML email body (use {{variable}} for merge tags)" },
              variant_label: { type: "string", description: "A/B variant label (e.g. 'A', 'B')" },
            },
          },
        },
      },
      required: ["campaign_id", "sequences"],
    },
  },
  {
    name: "get_campaign_sequence",
    description: "Get the current email sequence for a campaign.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "delete_campaign",
    description: "Delete a campaign by ID.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
      },
      required: ["campaign_id"],
    },
  },

  // ── Lead Management ──
  {
    name: "add_leads_to_campaign",
    description: "Bulk add leads to a campaign. Each lead needs at minimum an email address.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
        lead_list: {
          type: "array",
          description: "Array of lead objects",
          items: {
            type: "object",
            properties: {
              email: { type: "string", description: "Lead email address" },
              first_name: { type: "string" },
              last_name: { type: "string" },
              company_name: { type: "string" },
              company_url: { type: "string" },
              linkedin_profile: { type: "string" },
              phone_number: { type: "string" },
              custom_fields: {
                type: "object",
                description: "Key-value pairs for custom merge fields",
              },
            },
            required: ["email"],
          },
        },
        settings: {
          type: "object",
          description: "Optional settings: ignore_global_block_list, ignore_unsubscribe_list, ignore_community_bounce_list",
        },
      },
      required: ["campaign_id", "lead_list"],
    },
  },
  {
    name: "list_campaign_leads",
    description: "List leads in a campaign with pagination.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
        offset: { type: "number", description: "Pagination offset (default: 0)", default: 0 },
        limit: { type: "number", description: "Results per page (default: 100)", default: 100 },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "get_lead_by_email",
    description: "Look up a lead by email address across all campaigns.",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Lead email address" },
      },
      required: ["email"],
    },
  },
  {
    name: "update_lead",
    description: "Update lead fields like name, company, or custom fields.",
    inputSchema: {
      type: "object",
      properties: {
        lead_id: { type: "number", description: "Lead ID" },
        fields: {
          type: "object",
          description: "Fields to update (first_name, last_name, company_name, etc.)",
        },
      },
      required: ["lead_id", "fields"],
    },
  },
  {
    name: "unsubscribe_lead",
    description: "Unsubscribe a lead from a specific campaign.",
    inputSchema: {
      type: "object",
      properties: {
        lead_id: { type: "number", description: "Lead ID" },
        campaign_id: { type: "number", description: "Campaign ID to unsubscribe from" },
      },
      required: ["lead_id", "campaign_id"],
    },
  },
  {
    name: "get_lead_messages",
    description: "Get the message history for a specific lead in a campaign.",
    inputSchema: {
      type: "object",
      properties: {
        lead_id: { type: "number", description: "Lead ID" },
        campaign_id: { type: "number", description: "Campaign ID" },
      },
      required: ["lead_id", "campaign_id"],
    },
  },

  // ── Email Accounts ──
  {
    name: "list_email_accounts",
    description: "List all connected email sending accounts.",
    inputSchema: {
      type: "object",
      properties: {
        offset: { type: "number", description: "Pagination offset (default: 0)", default: 0 },
        limit: { type: "number", description: "Results per page (default: 100)", default: 100 },
      },
    },
  },
  {
    name: "list_campaign_email_accounts",
    description: "List email accounts assigned to a specific campaign.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "add_email_account_to_campaign",
    description: "Assign an email sending account to a campaign.",
    inputSchema: {
      type: "object",
      properties: {
        email_account_id: { type: "number", description: "Email account ID" },
        campaign_id: { type: "number", description: "Campaign ID" },
      },
      required: ["email_account_id", "campaign_id"],
    },
  },

  // ── Statistics ──
  {
    name: "get_campaign_statistics",
    description: "Get campaign statistics: sent, opened, clicked, replied, bounced counts and rates.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "get_sequence_analytics",
    description: "Get per-step sequence analytics for a campaign (open/click/reply rates per step).",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
      },
      required: ["campaign_id"],
    },
  },

  // ── Webhooks ──
  {
    name: "get_campaign_webhooks",
    description: "List webhooks configured for a campaign.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "save_campaign_webhook",
    description: "Add or update a webhook for a campaign. Webhook fires on events like reply, bounce, etc.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
        webhook_url: { type: "string", description: "Webhook endpoint URL" },
        event_type: {
          type: "string",
          description: "Event to trigger on (e.g. EMAIL_REPLIED, EMAIL_BOUNCED, EMAIL_OPENED, LINK_CLICKED, UNSUBSCRIBED)",
        },
      },
      required: ["campaign_id", "webhook_url", "event_type"],
    },
  },

  // ── Master Inbox ──
  {
    name: "reply_to_lead",
    description: "Reply to a lead via the SmartLead master inbox.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "number", description: "Campaign ID" },
        lead_id: { type: "number", description: "Lead ID" },
        email_account_id: { type: "number", description: "Email account ID to send from" },
        email_body: { type: "string", description: "Reply body (HTML supported)" },
      },
      required: ["campaign_id", "lead_id", "email_account_id", "email_body"],
    },
  },
];

// ---------- Tool Handlers ----------

async function handleTool(name, args) {
  switch (name) {
    // ── Campaign Management ──

    case "create_campaign": {
      return apiRequest("/campaigns/create", "POST", { name: args.name });
    }

    case "list_campaigns": {
      return apiRequest("/campaigns", "GET", null, {
        limit: args.limit ?? 100,
      });
    }

    case "get_campaign": {
      return apiRequest(`/campaigns/${args.campaign_id}`, "GET");
    }

    case "update_campaign_settings": {
      return apiRequest(`/campaigns/${args.campaign_id}/settings`, "POST", args.settings);
    }

    case "update_campaign_status": {
      return apiRequest(`/campaigns/${args.campaign_id}/status`, "POST", {
        status: args.status,
      });
    }

    case "save_campaign_sequence": {
      return apiRequest(`/campaigns/${args.campaign_id}/sequences`, "POST", {
        sequences: args.sequences,
      });
    }

    case "get_campaign_sequence": {
      return apiRequest(`/campaigns/${args.campaign_id}/sequences`, "GET");
    }

    case "delete_campaign": {
      return apiRequest(`/campaigns/${args.campaign_id}`, "DELETE");
    }

    // ── Lead Management ──

    case "add_leads_to_campaign": {
      return apiRequest(`/campaigns/${args.campaign_id}/leads`, "POST", {
        lead_list: args.lead_list,
        settings: args.settings,
      });
    }

    case "list_campaign_leads": {
      return apiRequest(`/campaigns/${args.campaign_id}/leads`, "GET", null, {
        offset: args.offset ?? 0,
        limit: args.limit ?? 100,
      });
    }

    case "get_lead_by_email": {
      return apiRequest("/leads", "GET", null, { email: args.email });
    }

    case "update_lead": {
      return apiRequest(`/leads/${args.lead_id}`, "POST", args.fields);
    }

    case "unsubscribe_lead": {
      return apiRequest(`/leads/${args.lead_id}/unsubscribe`, "POST", {
        campaign_id: args.campaign_id,
      });
    }

    case "get_lead_messages": {
      return apiRequest(`/leads/${args.lead_id}/messages`, "GET", null, {
        campaign_id: args.campaign_id,
      });
    }

    // ── Email Accounts ──

    case "list_email_accounts": {
      return apiRequest("/email-accounts", "GET", null, {
        offset: args.offset ?? 0,
        limit: args.limit ?? 100,
      });
    }

    case "list_campaign_email_accounts": {
      return apiRequest(`/campaigns/${args.campaign_id}/email-accounts`, "GET");
    }

    case "add_email_account_to_campaign": {
      return apiRequest(
        `/email-accounts/${args.email_account_id}/campaigns`,
        "POST",
        { campaign_id: args.campaign_id }
      );
    }

    // ── Statistics ──

    case "get_campaign_statistics": {
      return apiRequest(`/campaigns/${args.campaign_id}/statistics`, "GET");
    }

    case "get_sequence_analytics": {
      return apiRequest(`/campaigns/${args.campaign_id}/sequences/analytics`, "GET");
    }

    // ── Webhooks ──

    case "get_campaign_webhooks": {
      return apiRequest(`/campaigns/${args.campaign_id}/webhooks`, "GET");
    }

    case "save_campaign_webhook": {
      return apiRequest(`/campaigns/${args.campaign_id}/webhooks`, "POST", {
        webhook_url: args.webhook_url,
        event_type: args.event_type,
      });
    }

    // ── Master Inbox ──

    case "reply_to_lead": {
      return apiRequest("/master-inbox/reply", "POST", {
        campaign_id: args.campaign_id,
        lead_id: args.lead_id,
        email_account_id: args.email_account_id,
        email_body: args.email_body,
      });
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---------- Server Setup ----------

const server = new Server(
  { name: "smartlead", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, args);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: true, message: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SmartLead MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
