# Overnight GSD

> **CEO Summary:** Runs GSD phases and n8n workflow testing autonomously while you sleep. Wake up to completed work, tested workflows, and a summary of what needs your attention.

## Quick Start

```bash
# 1. Configure your Slack webhook
vim scripts/overnight-gsd/config.json
# Set slack.webhook_url

# 2. Run a dry-run to see what would execute
./scripts/overnight-gsd/overnight.sh --dry-run

# 3. Start an overnight run
./scripts/overnight-gsd/overnight.sh --phases 12,13
```

## What It Does

```
10:00 PM  You start the script and go to sleep
10:01 PM  System begins iterating with fresh Claude contexts
 2:30 AM  Phase 12 completes (all plans executed and verified)
 2:35 AM  Phase 13 starts
 4:15 AM  3 n8n workflows tested and verified
 5:45 AM  Blocker hit → Slack notification → System stops
 5:46 AM  Morning summary generated
 7:00 AM  You wake up, check .overnight/morning-summary.md
```

## Usage

```bash
# Default: Run GSD phases + n8n testing with config.json settings
./overnight.sh

# Run specific GSD phases
./overnight.sh --phases 12,13

# Only run GSD phases (no n8n testing)
./overnight.sh --gsd-only

# Only run n8n workflow testing
./overnight.sh --n8n-only

# Dry run - see what would execute
./overnight.sh --dry-run
```

## Configuration

Edit `config.json`:

```json
{
  "slack": {
    "webhook_url": "https://hooks.slack.com/services/XXX/YYY/ZZZ",
    "channel": "#automation"
  },
  "limits": {
    "max_cost_usd": 25,        // Stop if cost exceeds this
    "max_iterations": 50,       // Stop after this many iterations
    "max_consecutive_failures": 3  // Stop after N failures in a row
  },
  "behavior": {
    "stop_on_blocker": true,    // Stop immediately on blocker
    "stop_on_verification_fail": true  // Stop if verification fails
  },
  "modes": {
    "run_gsd": true,            // Run GSD phase execution
    "run_n8n": true             // Run n8n workflow testing
  },
  "gsd": {
    "target_phases": [12, 13],  // Phases to run (or [] for auto-detect)
    "auto_detect_phase": true   // Auto-detect current phase from ROADMAP.md
  },
  "n8n": {
    "max_workflows_per_night": 10  // Max workflows to test
  },
  "model": "sonnet"             // Claude model to use
}
```

## Outputs

After a run, check these files:

| File | Purpose |
|------|---------|
| `.overnight/morning-summary.md` | Human-readable summary - **start here** |
| `.overnight/progress.log` | Iteration-by-iteration log |
| `.overnight/cost-report.json` | Detailed cost tracking |
| `.overnight/blockers.md` | Full details on any blockers |
| `.overnight/iterations/*.log` | Raw output from each iteration |

## How It Works

### Fresh Context Per Iteration

Each iteration runs Claude with a fresh context window. This prevents quality degradation over long runs. Context is injected via:

1. **STATE.md summary** - Key decisions and current state
2. **Current plan** - The specific plan being executed
3. **Context prompt** - Instructions for autonomous execution

### GSD Integration

The system calls GSD commands with fresh context:

```
Iteration 1: Fresh context → Execute Phase 12 Plan 1 → Commit
Iteration 2: Fresh context → Execute Phase 12 Plan 2 → Commit
...
Iteration N: Fresh context → Phase 12 complete → Move to Phase 13
```

### n8n Integration

Uses n8n-brain MCP tools for intelligent testing:

1. **find_similar_patterns** - Check for existing patterns
2. **get_credential** - Get credential IDs
3. **lookup_error_fix** - Find known fixes for errors
4. **store_error_fix** - Learn new error→fix mappings
5. **update_pattern_success** - Track pattern reuse

### Cost Tracking

Cost is estimated per-iteration based on:
- Output token count (estimated from response length)
- Model pricing (Opus/Sonnet/Haiku)
- 2:1 input:output ratio assumption

## Slack Notifications

You'll receive Slack messages for:

- **Run started** - With config summary
- **Blocker hit** - Immediate alert with details
- **Run complete** - Summary with stats

Example blocker notification:
```
🚨 Blocker Encountered
GSD Phase 13: Need human decision on App Store privacy labels

Context: Phase 13 Plan 03
Run paused. Check .overnight/blockers.md for details.
```

## Safety Features

1. **Cost limits** - Stops when cost limit reached
2. **Iteration limits** - Stops after max iterations
3. **Consecutive failure limit** - Stops after N failures in a row
4. **Blocker detection** - Stops immediately on blockers (configurable)
5. **Atomic commits** - Each plan committed separately for easy rollback

## Directory Structure

```
scripts/overnight-gsd/
├── overnight.sh          # Main entry point
├── config.json           # Configuration
├── README.md             # This file
├── lib/
│   ├── slack.sh          # Slack notifications
│   ├── cost.sh           # Cost tracking
│   ├── parser.sh         # Output parsing
│   └── summary.sh        # Morning summary generation
└── prompts/
    ├── gsd-context.md    # Context for GSD execution
    └── n8n-context.md    # Context for n8n testing

.overnight/               # Runtime outputs (gitignored)
├── morning-summary.md
├── progress.log
├── cost-report.json
├── blockers.md
└── iterations/
    └── {run_id}_iter_{n}.log
```

## Troubleshooting

### "No GSD phases configured or detected"

Either specify phases with `--phases` or ensure:
- `.planning/STATE.md` exists with current phase info
- `.planning/ROADMAP.md` has phases listed

### "No workflows need testing"

The n8n testing queries `n8n_brain.workflows_needing_attention`. Ensure:
- Workflows are registered in the registry
- Some have status `untested`, `broken`, or `needs_review`

### Cost is higher than expected

Cost estimation is approximate. For accurate tracking:
- Check Claude API usage dashboard
- Consider using Sonnet instead of Opus for overnight runs

### Script stops immediately

Check:
- Slack webhook is valid (or remove it from config)
- `.planning/` directory exists
- Required tools (jq, bc, curl) are installed

## Best Practices

1. **Start small** - First run with `--dry-run`, then single phase
2. **Review in the morning** - Don't blindly trust overnight work
3. **Test completed items** - Run the testing checklist in morning-summary.md
4. **Adjust limits** - Tune cost/iteration limits based on experience
5. **Check git history** - Each plan is a separate commit for easy review/rollback
