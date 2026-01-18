# Workflow Registry Sync - Business OS

> **CEO Summary:** Automatically keeps the dashboard's workflow list in sync with n8n by watching for the `business-os` tag.

## What It Does

This workflow bridges n8n and the Business OS dashboard. When you tag any workflow with `business-os` in n8n, this sync workflow will automatically register it in Supabase so it appears on your dashboard.

## Trigger

- **Type:** Schedule
- **Schedule:** Daily at 6 AM CT
- **Manual:** Can be triggered anytime for immediate sync

## Data Flow

1. Fetches all workflows from n8n's internal API
2. Filters to only those with the `business-os` tag
3. Extracts metadata (trigger type, services used, active status)
4. Upserts to `n8n_brain.workflows` table in Supabase
5. Logs sync activity for audit trail

## How to Tag Workflows

1. Open any workflow in n8n
2. Click the workflow name at the top
3. In the settings panel, find "Tags"
4. Add the tag `business-os`
5. Save the workflow

The next sync run (or manual trigger) will pick it up.

## What Gets Synced

| Field | Source |
|-------|--------|
| workflow_id | n8n workflow ID |
| workflow_name | n8n workflow name |
| is_active | n8n active status |
| trigger_type | Auto-detected from nodes (schedule/webhook/manual) |
| tags | All tags from n8n |
| services | Auto-detected from node types (supabase, slack, etc.) |

## What Doesn't Get Synced

These fields must be set manually (or via the initial migration):
- `description` (CEO summary)
- `department`
- `category`
- `criticality`
- `owner`
- `schedule_description`

To update these, either:
1. Edit the workflow entry in Supabase directly
2. Update the seed migration and re-run

## Integrations

| Service | Purpose |
|---------|---------|
| n8n API | Fetches workflow list and metadata |
| Supabase | Stores workflow registry |

## n8n Workflow

- **URL:** https://n8n.realtyamp.ai/workflow/ZYmDHUgDKNbqfjRO
- **ID:** `ZYmDHUgDKNbqfjRO`

## Related

- [Workflow Audit](./WORKFLOW-AUDIT.md) - Complete inventory of workflows
- [Dashboard](/dashboard/digital/workflows) - View workflow health
