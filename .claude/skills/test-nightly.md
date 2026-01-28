---
name: test-nightly
description: Full autonomous nightly workflow testing with email summary. Tests all unverified workflows using the test-workflow-auto protocol and sends results via SendGrid.
---

# Nightly Workflow Testing Skill

This skill orchestrates autonomous testing of ALL unverified n8n workflows and sends an email summary.

## Overview

1. Query Supabase `n8n_brain.workflow_registry` for workflows where `test_status NOT IN ('verified')`
2. For each workflow, spawn a **fresh Claude session** (`claude --print`) that runs `/test-workflow <id>`
   - Each session gets clean context (no accumulation across workflows)
   - Uses the full `/test-workflow` protocol: load, analyze, check history, diagnose, fix, test branches, verify output, add error handling, learn, update registry
   - Skips tag addition
   - Outputs structured result block for parsing
3. Parse results from each session, collect into JSON array
4. Send HTML email via SendGrid API

## Execution

This skill is invoked by the `test-nightly` command and runs via `scripts/test-workflows-nightly.sh`.

The bash script handles:
- Querying Supabase for unverified workflows
- Invoking `claude --print` for each workflow with the full RALPH loop prompt
- Collecting results from each test
- Building HTML email with results table
- Sending via SendGrid REST API (`curl`)

## Email Format

```html
Subject: Nightly Workflow Test Results - {date}

Sections:
1. Summary stats bar (tested / passed / needs attention)
2. "Ready for Verification" table - clickable links to each workflow
3. "Needs Attention" table - broken workflows with error descriptions
```

## Configuration

| Setting | Value |
|---------|-------|
| Email to | mike.jackson@iaml.com |
| Email from | workflows@iaml.com |
| SendGrid API | SENDGRID_API_KEY from .env.local |
| Max fix attempts | 5 per workflow |
| Timeout | 600s per workflow |
| Registry table | n8n_brain.workflow_registry |
