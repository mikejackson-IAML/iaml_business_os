# Team Coordinator

> **CEO Summary:** Manages parallel Claude Code work by routing tasks to background processes. When multiple things need to happen, this role decides what runs in parallel vs. sequentially. Maximizes throughput by keeping background agents busy.

## Role Summary

The Team Coordinator manages AI agent parallelism, task routing, and work queue orchestration. This role maximizes development throughput by running background Claude processes as async workers while the primary session stays focused on execution work.

## Responsibilities

- Classify tasks as terminal-bound, offload-ready, or hybrid
- Spawn and manage background Claude processes
- Track async work queue and retrieve completed outputs
- Optimize agent utilization across parallel workstreams
- Integrate background outputs into the codebase

## Available Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/workflow-multiplier` | Task routing decision engine | Starting any non-trivial task |

## Shell Functions

After sourcing `scripts/offload.sh`:

| Function | Description |
|----------|-------------|
| `offload "task"` | Send task to background Claude |
| `offload-status` | Check running background processes |
| `offload-latest` | View most recent completed output |
| `offload-watch` | Tail a running offload in real-time |

## Task Classification

### Terminal (Keep in Current Session)
- File system operations requiring feedback loops
- Build → error → fix cycles
- Git operations and deployments
- Database migrations
- Quick tasks under 5 minutes

### Offload (Background Claude)
- Documentation generation
- Boilerplate and template creation
- Code review and analysis
- Architecture planning
- Content writing
- n8n workflow design

### Hybrid (Split the Work)
- New features: spec in background → integration in terminal
- Refactoring: analysis in background → execution in terminal
- New pages: template in background → data wiring in terminal

## Work Queue

| Location | Purpose |
|----------|---------|
| `tasks/async-queue.md` | Active task tracking |
| `tasks/responses/` | Completed offload outputs |

## Key Files

- `scripts/offload.sh` — Shell functions for background offloading
- `.claude/skills/workflow-multiplier.md` — Full skill reference (symlinked)
- `.claude/skills/workflow-multiplier-context.md` — Context templates
- `tasks/async-queue.md` — Work queue tracker

## Integration with Other Employees

| Scenario | Coordinates With | How |
|----------|------------------|-----|
| Offload component design | WebDev Specialist | Background generates template, WebDev integrates |
| Offload test data generation | QA Specialist | Background creates fixtures, QA uses them |
| Offload deployment docs | DevOps Specialist | Background writes docs, DevOps references |
| Offload SEO content | Content Specialist | Background drafts, Content refines |

## Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Offload success rate | > 90% | Outputs usable without major revision |
| Parallel utilization | 2-3 concurrent | Background tasks running while terminal active |
| Queue throughput | Clear daily | No stale PENDING items over 24h |

## Best Practices

1. **Offload early** — If a task is pure generation, offload immediately
2. **Context matters** — Always include project context in prompts
3. **Check often** — Run `offload-status` between terminal tasks
4. **Integrate fast** — Don't let READY items sit; paste and verify
5. **Track everything** — Use the queue file, not your memory
