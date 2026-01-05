#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_KEY = process.env.NEVERBOUNCE_API_KEY;
const BASE_URL = "https://api.neverbounce.com/v4";

if (!API_KEY) {
  console.error("Error: NEVERBOUNCE_API_KEY environment variable is required");
  process.exit(1);
}

// Result code descriptions
const RESULT_CODES = {
  valid: "Email is valid and deliverable",
  invalid: "Email is invalid and will bounce",
  disposable: "Email is from a disposable email provider",
  catchall: "Domain accepts all emails (unverifiable)",
  unknown: "Could not determine validity",
};

// Helper function to make API requests
async function apiRequest(endpoint, method = "GET", body = null) {
  const url = new URL(`${BASE_URL}${endpoint}`);

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (method === "GET") {
    url.searchParams.append("key", API_KEY);
    if (body) {
      Object.entries(body).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
  } else {
    options.body = JSON.stringify({ key: API_KEY, ...body });
  }

  const response = await fetch(url.toString(), options);
  const data = await response.json();

  if (data.status === "error" || data.status === "auth_failure") {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

// Create server instance
const server = new Server(
  {
    name: "neverbounce",
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
      {
        name: "verify_email",
        description:
          "Verify a single email address. Returns validity status (valid, invalid, disposable, catchall, unknown) along with additional flags and suggestions.",
        inputSchema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "The email address to verify",
            },
            address_info: {
              type: "boolean",
              description: "Include additional address info (default: true)",
              default: true,
            },
            credits_info: {
              type: "boolean",
              description: "Include credits usage info (default: false)",
              default: false,
            },
            timeout: {
              type: "number",
              description: "Timeout in seconds (default: 30)",
              default: 30,
            },
          },
          required: ["email"],
        },
      },
      {
        name: "verify_emails_bulk",
        description:
          "Create a bulk verification job for multiple email addresses. Returns a job_id to track progress.",
        inputSchema: {
          type: "object",
          properties: {
            emails: {
              type: "array",
              items: { type: "string" },
              description: "Array of email addresses to verify",
            },
            auto_parse: {
              type: "boolean",
              description: "Automatically parse the list (default: true)",
              default: true,
            },
            auto_start: {
              type: "boolean",
              description: "Automatically start verification (default: true)",
              default: true,
            },
            callback_url: {
              type: "string",
              description: "Webhook URL to receive completion notification",
            },
          },
          required: ["emails"],
        },
      },
      {
        name: "get_job_status",
        description:
          "Get the status of a bulk verification job. Shows progress and statistics.",
        inputSchema: {
          type: "object",
          properties: {
            job_id: {
              type: "number",
              description: "The job ID returned from verify_emails_bulk",
            },
          },
          required: ["job_id"],
        },
      },
      {
        name: "get_job_results",
        description:
          "Get the results of a completed bulk verification job. Returns verification results for all emails.",
        inputSchema: {
          type: "object",
          properties: {
            job_id: {
              type: "number",
              description: "The job ID to get results for",
            },
            page: {
              type: "number",
              description: "Page number for pagination (default: 1)",
              default: 1,
            },
            items_per_page: {
              type: "number",
              description: "Items per page (default: 100, max: 1000)",
              default: 100,
            },
          },
          required: ["job_id"],
        },
      },
      {
        name: "search_jobs",
        description: "Search for existing bulk verification jobs.",
        inputSchema: {
          type: "object",
          properties: {
            job_id: {
              type: "number",
              description: "Search for a specific job ID",
            },
            filename: {
              type: "string",
              description: "Search by filename",
            },
            page: {
              type: "number",
              description: "Page number (default: 1)",
              default: 1,
            },
            items_per_page: {
              type: "number",
              description: "Items per page (default: 10)",
              default: 10,
            },
          },
        },
      },
      {
        name: "delete_job",
        description: "Delete a bulk verification job and its results.",
        inputSchema: {
          type: "object",
          properties: {
            job_id: {
              type: "number",
              description: "The job ID to delete",
            },
          },
          required: ["job_id"],
        },
      },
      {
        name: "get_account_info",
        description:
          "Get account information including credits balance and usage statistics.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "verify_email": {
        const params = {
          email: args.email,
          address_info: args.address_info !== false ? 1 : 0,
          credits_info: args.credits_info ? 1 : 0,
          timeout: args.timeout || 30,
        };

        const result = await apiRequest("/single/check", "GET", params);

        // Enhance result with human-readable description
        const enhanced = {
          ...result,
          result_description: RESULT_CODES[result.result] || "Unknown result",
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(enhanced, null, 2),
            },
          ],
        };
      }

      case "verify_emails_bulk": {
        const input = args.emails.map((email) => ({ email }));

        const result = await apiRequest("/jobs/create", "POST", {
          input_location: "supplied",
          input: input,
          auto_parse: args.auto_parse !== false,
          auto_start: args.auto_start !== false,
          callback_url: args.callback_url,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ...result,
                  message: `Bulk job created. Job ID: ${result.job_id}. Use get_job_status to check progress.`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_job_status": {
        const result = await apiRequest("/jobs/status", "GET", {
          job_id: args.job_id,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_job_results": {
        const result = await apiRequest("/jobs/results", "GET", {
          job_id: args.job_id,
          page: args.page || 1,
          items_per_page: args.items_per_page || 100,
        });

        // Enhance results with descriptions
        if (result.results) {
          result.results = result.results.map((item) => ({
            ...item,
            result_description:
              RESULT_CODES[item.verification?.result] || "Unknown",
          }));
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "search_jobs": {
        const params = {};
        if (args.job_id) params.job_id = args.job_id;
        if (args.filename) params.filename = args.filename;
        params.page = args.page || 1;
        params.items_per_page = args.items_per_page || 10;

        const result = await apiRequest("/jobs/search", "GET", params);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "delete_job": {
        const result = await apiRequest("/jobs/delete", "POST", {
          job_id: args.job_id,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ...result,
                  message: `Job ${args.job_id} deleted successfully.`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_account_info": {
        const result = await apiRequest("/account/info", "GET");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: true,
              message: error.message,
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
  console.error("NeverBounce MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
