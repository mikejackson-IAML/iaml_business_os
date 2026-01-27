// Planning Studio Document Templates
// Template constants and mappings for all 9 document types

import type { DocumentType } from '@/dashboard-kit/types/departments/planning';

// Re-export DocumentType for convenience
export type { DocumentType };

// =============================================================================
// LABELS
// =============================================================================

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  icp: 'Ideal Customer Profile',
  competitive_intel: 'Competitive Intelligence',
  lean_canvas: 'Lean Canvas',
  problem_statement: 'Problem Statement',
  feature_spec: 'Feature Specification',
  technical_scope: 'Technical Scope',
  gsd_project: 'PROJECT.md',
  gsd_requirements: 'REQUIREMENTS.md',
  gsd_roadmap: 'ROADMAP.md',
};

// =============================================================================
// FILE PATHS
// =============================================================================

export const DOC_FILE_PATHS: Record<DocumentType, string> = {
  icp: '.planning/references/icp.md',
  competitive_intel: '.planning/references/competitive_intel.md',
  lean_canvas: '.planning/references/lean_canvas.md',
  problem_statement: '.planning/references/problem_statement.md',
  feature_spec: '.planning/references/feature_spec.md',
  technical_scope: '.planning/references/technical_scope.md',
  gsd_project: '.planning/PROJECT.md',
  gsd_requirements: '.planning/REQUIREMENTS.md',
  gsd_roadmap: '.planning/ROADMAP.md',
};

// =============================================================================
// PHASE DOC SUGGESTIONS
// =============================================================================

export const PHASE_DOC_SUGGESTIONS: Record<string, DocumentType[]> = {
  discover: ['icp', 'competitive_intel', 'problem_statement'],
  define: ['lean_canvas', 'feature_spec'],
  develop: ['technical_scope'],
  package: ['gsd_project', 'gsd_requirements', 'gsd_roadmap'],
};

// =============================================================================
// DOCUMENT TEMPLATES
// =============================================================================

export const DOC_TEMPLATES: Record<DocumentType, string> = {
  icp: `# Ideal Customer Profile

## Target Market
Describe the overall market segment this product serves.

## Demographics
- **Job Title / Role:** [TBD - discuss in next session]
- **Company Size:** [TBD - discuss in next session]
- **Industry:** [TBD - discuss in next session]
- **Location:** [TBD - discuss in next session]

## Psychographics
- **Motivations:** What drives them professionally?
- **Frustrations:** What keeps them up at night?
- **Values:** What do they prioritize in tools/solutions?

## Pain Points
List the top 3-5 pain points this user experiences, ranked by severity.

1. [TBD - discuss in next session]
2. [TBD - discuss in next session]
3. [TBD - discuss in next session]

## Goals
What does success look like for this person?

- Short-term goals (next 3 months)
- Medium-term goals (next 12 months)
- Long-term aspirations

## Decision Criteria
How does this person evaluate and choose solutions?

- **Budget:** What are they willing to pay?
- **Must-haves:** Non-negotiable features
- **Nice-to-haves:** Features that differentiate
- **Deal-breakers:** What would disqualify a solution?

## Channels
Where does this person spend time? How do we reach them?

- Online communities
- Social platforms
- Publications / newsletters
- Events / conferences
- Referral networks

Fill known sections with project context. Mark unknown sections as [TBD - discuss in next session]. Cross-reference other documents where relevant.`,

  competitive_intel: `# Competitive Intelligence

## Market Overview
Brief description of the market landscape and current state.

## Direct Competitors

| Competitor | Price | Strengths | Weaknesses | Target Market |
|-----------|-------|-----------|------------|---------------|
| [TBD] | [TBD] | [TBD] | [TBD] | [TBD] |
| [TBD] | [TBD] | [TBD] | [TBD] | [TBD] |
| [TBD] | [TBD] | [TBD] | [TBD] | [TBD] |

## Indirect Competitors
Solutions that address the same pain point differently (spreadsheets, manual processes, adjacent tools).

- [TBD - discuss in next session]

## Competitive Advantages
What can we do better than existing solutions?

1. [TBD - discuss in next session]
2. [TBD - discuss in next session]
3. [TBD - discuss in next session]

## Market Gaps
Opportunities that competitors are missing or underserving.

- [TBD - discuss in next session]

Fill known sections with project context. Mark unknown sections as [TBD - discuss in next session]. Cross-reference other documents where relevant.`,

  lean_canvas: `# Lean Canvas

## Problem
Top 3 problems this product solves:

1. [TBD - discuss in next session]
2. [TBD - discuss in next session]
3. [TBD - discuss in next session]

## Solution
Top 3 features that address the problems above:

1. [TBD - discuss in next session]
2. [TBD - discuss in next session]
3. [TBD - discuss in next session]

## Key Metrics
Numbers that tell us the product is working:

- [TBD - discuss in next session]

## Unique Value Proposition
Single, clear, compelling message that states why this is different and worth paying attention to.

> [TBD - discuss in next session]

## Unfair Advantage
Something that cannot be easily copied or bought by competitors.

- [TBD - discuss in next session]

## Channels
How we reach our customers:

- [TBD - discuss in next session]

## Customer Segments
- **Primary:** [TBD - discuss in next session]
- **Early Adopters:** [TBD - discuss in next session]

## Cost Structure
Major costs to deliver this solution:

- [TBD - discuss in next session]

## Revenue Streams
How this product makes money:

- [TBD - discuss in next session]

Fill known sections with project context. Mark unknown sections as [TBD - discuss in next session]. Cross-reference other documents where relevant.`,

  problem_statement: `# Problem Statement

## Problem Description
A specific, testable, resonant statement of the problem.

> [TBD - discuss in next session]

## Who's Affected
Describe the specific people experiencing this problem. Cross-reference the ICP document.

- **Primary audience:** [TBD - discuss in next session]
- **Secondary audience:** [TBD - discuss in next session]
- **Estimated market size:** [TBD - discuss in next session]

## Current Solutions
How do people solve this problem today?

1. [TBD - discuss in next session]
2. [TBD - discuss in next session]

## Why They Fail
Why are existing solutions insufficient?

- [TBD - discuss in next session]

## Impact & Urgency
Why does this problem matter now? What's the cost of not solving it?

- **Financial impact:** [TBD - discuss in next session]
- **Time impact:** [TBD - discuss in next session]
- **Opportunity cost:** [TBD - discuss in next session]

## Success Criteria
How will we know the problem is solved?

- [TBD - discuss in next session]

Fill known sections with project context. Mark unknown sections as [TBD - discuss in next session]. Cross-reference other documents where relevant.`,

  feature_spec: `# Feature Specification

## Overview
Brief description of the product and its core purpose. Cross-reference the problem statement.

## User Stories

| Priority | As a... | I want to... | So that... |
|----------|---------|-------------|-----------|
| P0 | [TBD] | [TBD] | [TBD] |
| P1 | [TBD] | [TBD] | [TBD] |
| P2 | [TBD] | [TBD] | [TBD] |

## Feature Details

### Feature 1: [TBD]
- **Priority:** P0 / P1 / P2
- **Description:** [TBD - discuss in next session]
- **User flow:** [TBD - discuss in next session]
- **Complexity:** Low / Medium / High

### Feature 2: [TBD]
- **Priority:** P0 / P1 / P2
- **Description:** [TBD - discuss in next session]
- **User flow:** [TBD - discuss in next session]
- **Complexity:** Low / Medium / High

## Acceptance Criteria
Conditions that must be true for each feature to be considered complete.

- [ ] [TBD - discuss in next session]
- [ ] [TBD - discuss in next session]

## Out of Scope
Features explicitly deferred to future versions, with reasoning.

- [TBD - discuss in next session]

Fill known sections with project context. Mark unknown sections as [TBD - discuss in next session]. Cross-reference other documents where relevant.`,

  technical_scope: `# Technical Scope

## Architecture Overview
High-level architecture description and diagram notes.

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | [TBD] | [TBD] |
| Backend | [TBD] | [TBD] |
| Database | [TBD] | [TBD] |
| Hosting | [TBD] | [TBD] |

## Data Model
Key entities and their relationships.

- [TBD - discuss in next session]

## API Surface
Key endpoints or interfaces.

| Method | Path | Purpose |
|--------|------|---------|
| [TBD] | [TBD] | [TBD] |

## Integrations
External services or APIs required.

- [TBD - discuss in next session]

## Non-Functional Requirements
- **Performance:** [TBD - discuss in next session]
- **Security:** [TBD - discuss in next session]
- **Scalability:** [TBD - discuss in next session]
- **Accessibility:** [TBD - discuss in next session]

## Risks
Technical risks and mitigation strategies.

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| [TBD] | [TBD] | [TBD] | [TBD] |

Fill known sections with project context. Mark unknown sections as [TBD - discuss in next session]. Cross-reference other documents where relevant.`,

  gsd_project: `# Project Name

## Vision
What this project achieves and why it matters.

> [TBD - discuss in next session]

## Problem
The specific problem being solved. Cross-reference the problem statement document.

## Target Users
Who this is built for. Cross-reference the ICP document.

## Success Metrics
How we measure if this project succeeds.

- [TBD - discuss in next session]

## Constraints
Technical, business, or time constraints that shape the solution.

- [TBD - discuss in next session]

Fill known sections with project context. Mark unknown sections as [TBD - discuss in next session]. Cross-reference other documents where relevant.`,

  gsd_requirements: `# Requirements

## Functional Requirements

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| REQ-001 | [TBD] | P0 | Draft |
| REQ-002 | [TBD] | P1 | Draft |
| REQ-003 | [TBD] | P2 | Draft |

## Non-Functional Requirements

| ID | Requirement | Category |
|----|------------|----------|
| NFR-001 | [TBD] | Performance |
| NFR-002 | [TBD] | Security |

## Assumptions
Things assumed to be true that could affect requirements.

- [TBD - discuss in next session]

Fill known sections with project context. Mark unknown sections as [TBD - discuss in next session]. Cross-reference other documents where relevant.`,

  gsd_roadmap: `# Roadmap

## Phase Overview

| Phase | Goal | Estimated Effort | Status |
|-------|------|-----------------|--------|
| Phase 1 (MVP) | [TBD] | [TBD] | Not Started |
| Phase 2 (Core) | [TBD] | [TBD] | Not Started |
| Phase 3+ | [TBD] | [TBD] | Not Started |

## Phase 1: MVP

### Goal
[TBD - discuss in next session]

### Tasks
- [ ] [TBD - discuss in next session]

### Success Criteria
- [TBD - discuss in next session]

## Phase 2: Core

### Goal
[TBD - discuss in next session]

### Tasks
- [ ] [TBD - discuss in next session]

### Success Criteria
- [TBD - discuss in next session]

## Dependencies
Cross-phase dependencies and external blockers.

- [TBD - discuss in next session]

## Risk Mitigation
Strategies for addressing roadmap risks.

- [TBD - discuss in next session]

Fill known sections with project context. Mark unknown sections as [TBD - discuss in next session]. Cross-reference other documents where relevant.`,
};
