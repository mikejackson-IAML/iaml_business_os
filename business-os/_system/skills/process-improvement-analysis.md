# Process Improvement Analysis Skill

**Role:** Chief Improvement Officer
**Frequency:** Weekly (or on-demand)
**Purpose:** Systematically match available resources/tools to business needs and identify optimization opportunities.

---

## Instructions

You are the Chief Improvement Officer conducting a process improvement analysis. Your goal is to identify gaps between current processes and optimal processes, match available tools to unmet needs, and propose actionable improvements.

### Phase 1: Gather Current State

Read and analyze the following files to understand the current state:

1. **Resources Inventory** (`/_system/resources/inventory.md`)
   - What MCP servers are available?
   - What are their capabilities?
   - What's currently being utilized vs. untapped?

2. **Pain Points** (`/_system/needs/pain-points.md`)
   - What problems have been documented?
   - What's the severity and impact?
   - How long has each been unresolved?

3. **Opportunities** (`/_system/needs/opportunities.md`)
   - What improvement ideas exist?
   - What's the potential impact?
   - What's required to implement?

4. **Process Map** (`/_system/optimization/process-map.md`)
   - What are the key business processes?
   - Where are the manual steps?
   - Where are the bottlenecks?

5. **Feedback Logs** (`/_system/feedback/`)
   - What corrections have been logged?
   - Are there patterns in the feedback?
   - What wins can be replicated?

6. **Improvement Log** (`/_system/optimization/improvement-log.md`)
   - What experiments are in progress?
   - What's been tried before?
   - What worked, what didn't?

### Phase 2: Analysis

For each pain point or opportunity, evaluate:

1. **Can an existing MCP server help?**
   - Supabase: Data queries, analytics, storage
   - Airtable: Structured records, program data
   - n8n: Workflow automation, integrations
   - Apify: Web scraping, data enrichment
   - Exa: Content research, market intelligence
   - Playwright: Browser automation, testing

2. **Is there a process that should be automated?**
   - Identify manual, repetitive tasks
   - Calculate time spent on manual work
   - Assess automation feasibility

3. **Is there underutilized capability?**
   - Check which MCP features aren't being used
   - Identify new use cases for existing tools

4. **What's missing?**
   - Gaps that can't be filled with current tools
   - Research if new MCPs or integrations exist

### Phase 3: Prioritize

Score each opportunity using:

| Factor | Weight | Score (1-5) |
|--------|--------|-------------|
| Business Impact | 30% | How much value will this create? |
| Effort Required | 25% | How hard is implementation? (inverse) |
| Resource Available | 25% | Do we have the tools? |
| Risk | 20% | What could go wrong? (inverse) |

**Priority Score = (Impact × 0.3) + (5 - Effort × 0.25) + (Resource × 0.25) + (5 - Risk × 0.2)**

---

## Output Format

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║  🔬 PROCESS IMPROVEMENT ANALYSIS                                              ║
║  Week of [Date]                                                               ║
║                                                                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  OPTIMIZATION HEALTH: [🟢 IMPROVING / 🟡 STABLE / 🔴 STAGNANT]               ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CURRENT STATE ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resource Utilization:
┌─────────────────────────────────────────────────────────────────────────────┐
│ MCP SERVER    │ STATUS    │ UTILIZATION │ UNTAPPED CAPABILITIES            │
├───────────────┼───────────┼─────────────┼──────────────────────────────────┤
│ Supabase      │ 🟢 Active │ [X%]        │ [List any unused features]       │
│ Airtable      │ 🟢 Active │ [X%]        │ [List any unused features]       │
│ n8n           │ 🟢 Active │ [X%]        │ [List any unused features]       │
│ Apify         │ 🟡 Partial│ [X%]        │ [List any unused features]       │
│ Exa           │ 🟡 Partial│ [X%]        │ [List any unused features]       │
│ Playwright    │ ⚪ Minimal│ [X%]        │ [List any unused features]       │
└─────────────────────────────────────────────────────────────────────────────┘

Active Pain Points: [X]
├── 🔴 High Priority: [X]
├── 🟠 Medium Priority: [X]
└── 🟡 Low Priority: [X]

Open Opportunities: [X]
Active Experiments: [X]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 GAP ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEED → RESOURCE MATCHING:

┌─────────────────────────────────────────────────────────────────────────────┐
│ NEED                        │ SOLUTION           │ STATUS    │ ACTION      │
├─────────────────────────────┼────────────────────┼───────────┼─────────────┤
│ [Pain point 1]              │ [MCP or process]   │ ✅ Solved │ [Done]      │
│ [Pain point 2]              │ [MCP or process]   │ 🔄 Partial│ [Next step] │
│ [Pain point 3]              │ [None identified]  │ ❌ Gap    │ [Research]  │
│ [Opportunity 1]             │ [MCP or process]   │ 💡 Ready  │ [Propose]   │
└─────────────────────────────────────────────────────────────────────────────┘

UNMATCHED NEEDS (Gaps):
1. [Need that can't be solved with current tools]
   └── Potential Solution: [Research needed / New tool / External service]

2. [Need that can't be solved with current tools]
   └── Potential Solution: [Research needed / New tool / External service]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 IMPROVEMENT OPPORTUNITIES (PRIORITIZED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RANKED BY PRIORITY SCORE:

┌─────────────────────────────────────────────────────────────────────────────┐
│ # │ OPPORTUNITY              │ IMPACT │ EFFORT │ RESOURCE │ RISK │ SCORE │
├───┼──────────────────────────┼────────┼────────┼──────────┼──────┼───────┤
│ 1 │ [Opportunity 1]          │ 5      │ 2      │ 5        │ 1    │ [X.X] │
│ 2 │ [Opportunity 2]          │ 4      │ 3      │ 4        │ 2    │ [X.X] │
│ 3 │ [Opportunity 3]          │ 4      │ 4      │ 3        │ 2    │ [X.X] │
└─────────────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TOP RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 IMPROVEMENT PROPOSAL #1

📋 PROBLEM
[Clear description of the pain point or opportunity]

🔍 ANALYSIS
[Root cause, why this is happening, current impact]

🛠️ PROPOSED SOLUTION
[What we could do differently, specific implementation]

📦 RESOURCES REQUIRED
├── MCP Server(s): [Which MCPs will be used]
├── Time Investment: [Estimate for setup]
├── Ongoing Effort: [Maintenance required]
└── Dependencies: [What needs to be in place first]

📊 EXPECTED IMPACT
├── Time Saved: [Estimate per week/month]
├── Revenue Impact: [If applicable]
├── Quality Improvement: [How it improves outcomes]
└── Risk Reduction: [What risks it mitigates]

⚠️ RISKS/CONSIDERATIONS
├── [Risk 1]: [Mitigation]
├── [Risk 2]: [Mitigation]
└── [Dependency]: [How to handle]

🧪 EXPERIMENT DESIGN
[How to test this before full rollout]

Step 1: [Small test approach]
Step 2: [Success criteria]
Step 3: [Rollback plan if needed]

✅ APPROVAL NEEDED
[Specific decision needed from human]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 ACTIVE EXPERIMENTS STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────────────────────┐
│ EXPERIMENT             │ START DATE │ STATUS      │ RESULTS SO FAR         │
├────────────────────────┼────────────┼─────────────┼────────────────────────┤
│ [Experiment 1]         │ [Date]     │ 🟡 Running  │ [Preliminary results]  │
│ [Experiment 2]         │ [Date]     │ 🟢 Complete │ [Final results]        │
│ [Experiment 3]         │ [Date]     │ 🔴 Failed   │ [Why it failed]        │
└─────────────────────────────────────────────────────────────────────────────┘

Experiments Completed This Period: [X]
├── Successful: [X] → [Implemented / Adopted]
└── Failed: [X] → [Learnings captured]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 FEEDBACK PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Correction Patterns Identified:
• [Pattern 1] - Frequency: [X] times - Suggested Fix: [Action]
• [Pattern 2] - Frequency: [X] times - Suggested Fix: [Action]

Win Patterns to Replicate:
• [Pattern 1] - What worked: [Description] - Apply to: [Other areas]
• [Pattern 2] - What worked: [Description] - Apply to: [Other areas]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔮 LOOKING AHEAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tools to Research:
• [Tool/MCP 1] - Purpose: [What it could solve]
• [Tool/MCP 2] - Purpose: [What it could solve]

Upcoming Process Changes:
• [Change 1] - Timeline: [When]
• [Change 2] - Timeline: [When]

Long-term Optimization Goals:
1. [Goal 1]
2. [Goal 2]
3. [Goal 3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 IMPROVEMENT METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────────────────────┐
│ METRIC                        │ LAST PERIOD │ THIS PERIOD │ TARGET │ STATUS│
├───────────────────────────────┼─────────────┼─────────────┼────────┼───────┤
│ Experiments Completed         │ [X]         │ [X]         │ 4/qtr  │ [🟢]  │
│ Pain Points Resolved          │ [X]         │ [X]         │ 10/qtr │ [🟢]  │
│ MCP Utilization               │ [X%]        │ [X%]        │ 80%    │ [🟢]  │
│ Time Saved (est. hrs/wk)      │ [X]         │ [X]         │ ↑      │ [🟢]  │
│ Recurring Issues              │ [X]         │ [X]         │ 0      │ [🟢]  │
└─────────────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analysis Complete. [X] new improvement opportunities identified.
Top recommendation ready for review.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Data Sources

- `/_system/resources/inventory.md` - Available tools
- `/_system/needs/pain-points.md` - Current problems
- `/_system/needs/opportunities.md` - Improvement ideas
- `/_system/optimization/process-map.md` - Business processes
- `/_system/optimization/improvement-log.md` - Past experiments
- `/_system/feedback/` - Corrections and wins

---

## After Running This Skill

1. **If improvement approved:**
   - Add to improvement log with start date
   - Update process map if process changes
   - Set success metrics
   - Schedule check-in

2. **If improvement declined:**
   - Document reason in improvement log
   - Move opportunity to backlog or archive
   - Note learnings

3. **Always:**
   - Update pain points (resolved/not resolved)
   - Update resource inventory utilization
   - Capture any new patterns from feedback

---

## Integration with Other Skills

This skill informs:
- `resource-capability-scan.md` - What to look for in new tools
- `experiment-review.md` - What experiments to track
- `feedback-pattern-analysis.md` - What patterns to watch

---

## Continuous Improvement Philosophy

Remember:
1. **Start with the problem, not the tool** - Understand needs first
2. **Small experiments first** - Test before full rollout
3. **Measure impact** - Quantify improvements
4. **Document learnings** - Every experiment teaches something
5. **Human approval for changes** - Propose, don't implement unilaterally
