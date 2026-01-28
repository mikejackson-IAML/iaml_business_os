# Planning Studio API Documentation

> **CEO Summary:** API reference for Planning Studio endpoints. Use these to integrate with external tools or automate workflows.

## Base URL

All endpoints are relative to `/api/planning/`.

## Authentication

All endpoints require Supabase authentication. Include the session cookie or Authorization header from the Supabase client.

---

## Analytics

### Get Analytics Metrics

```
GET /api/planning/analytics
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| period | string | Time period: `week`, `month`, `quarter`, `all` (default: month) |

**Response:**
```json
{
  "captured": 12,
  "shipped": 5,
  "avgVelocityDays": 14.5,
  "funnel": {
    "idea": 3,
    "planning": 4,
    "ready_to_build": 2,
    "building": 2,
    "shipped": 5
  },
  "trend": [
    { "date": "2026-01-20", "captured": 2, "shipped": 1 }
  ]
}
```

---

## Chat

### Send Message (SSE Streaming)

```
POST /api/planning/chat
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "phaseType": "discover",
  "conversationId": "uuid",
  "message": "User's message"
}
```

**Phase Types:**
- `capture` - Initial idea capture
- `discover` - Research and discovery
- `define` - Problem definition
- `develop` - Solution design
- `validate` - Readiness validation
- `package` - GSD export

**Response:** Server-Sent Events (SSE) stream

**SSE Events:**
| Event Type | Data | Description |
|------------|------|-------------|
| conversation_created | `{"conversationId": "uuid"}` | New conversation was created |
| text | `{"content": "..."}` | Partial response text chunk |
| done | `{}` | Stream complete |
| error | `{"message": "..."}` | Error occurred |
| phase_complete | `{"phaseType": "discover"}` | Phase completion marker detected |
| readiness_result | `{"passed": true, "reason": "..."}` | Readiness check result |
| doc_suggestion | `{"docType": "icp"}` | Document generation suggestion |
| research_suggestion | `{"query": "..."}` | Research suggestion |

---

## Conversations

### List Conversations

```
GET /api/planning/conversations
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| projectId | string | Required. Project UUID |
| phaseId | string | Optional. Filter by phase |

**Response:**
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "phase_id": "uuid",
    "title": "Session title",
    "summary": "Conversation summary",
    "created_at": "2026-01-28T12:00:00Z",
    "ended_at": "2026-01-28T12:30:00Z"
  }
]
```

### Create Conversation

```
POST /api/planning/conversations
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "phaseId": "uuid",
  "title": "Optional title"
}
```

**Response:** Created conversation object (201)

### End Conversation

```
PATCH /api/planning/conversations
```

**Request Body:**
```json
{
  "conversationId": "uuid",
  "action": "end",
  "projectId": "uuid",
  "projectTitle": "Project Name",
  "phaseType": "discover"
}
```

**Response:**
```json
{
  "summary": "Generated conversation summary",
  "ended_at": "2026-01-28T12:30:00Z"
}
```

---

## Documents

### Generate Document

```
POST /api/planning/documents/generate
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "docType": "icp"
}
```

**Document Types:**
| Type | Description |
|------|-------------|
| `icp` | Ideal Customer Profile |
| `competitive_intel` | Competitive Analysis |
| `lean_canvas` | Lean Canvas |
| `problem_statement` | Problem Statement |
| `feature_spec` | Feature Specification |
| `technical_scope` | Technical Scope |
| `gsd_project` | GSD PROJECT.md |
| `gsd_requirements` | GSD REQUIREMENTS.md |
| `gsd_roadmap` | GSD ROADMAP.md |

**Response:**
```json
{
  "id": "uuid",
  "version": 1,
  "docType": "icp",
  "content": "# ICP Document..."
}
```

### Export All Documents

```
POST /api/planning/documents/export
```

**Request Body:**
```json
{
  "projectId": "uuid"
}
```

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "doc_type": "icp",
      "content": "...",
      "version": 2,
      "file_path": "icp.md",
      "created_at": "2026-01-28T12:00:00Z"
    }
  ],
  "projectName": "My Project"
}
```

### Get Document

```
GET /api/planning/documents/[docId]
```

**Response:** Full document object including version history

---

## Memories

### Store Memories

```
POST /api/planning/memories
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "conversationId": "uuid",
  "memories": [
    {
      "content": "We decided to target SMB market",
      "memory_type": "decision",
      "source_phase": "discover"
    }
  ]
}
```

**Memory Types:**
| Type | Description |
|------|-------------|
| `decision` | Recorded decision |
| `inspiration` | Idea or inspiration |
| `insight` | Learning or insight |
| `pivot` | Direction change |
| `research_finding` | From Perplexity |
| `constraint` | Limitation identified |
| `user_preference` | User preference noted |
| `rejection_reason` | Why something was rejected |

**Response:**
```json
{
  "stored": 3,
  "embedded": 3
}
```

### Semantic Search

```
POST /api/planning/memories/search
```

**Request Body:**
```json
{
  "query": "What did we decide about pricing?",
  "projectId": "uuid",
  "limit": 10,
  "threshold": 0.7
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "content": "We decided to use tiered pricing...",
      "memory_type": "decision",
      "similarity": 0.85,
      "project_id": "uuid",
      "source_phase": "define",
      "conversation_id": "uuid"
    }
  ]
}
```

---

## Ask AI (RAG)

### Ask a Question

```
POST /api/planning/ask
```

**Request Body:**
```json
{
  "question": "What are the key features we planned?",
  "projectId": "uuid",
  "conversationHistory": [
    { "role": "user", "content": "Previous question" },
    { "role": "assistant", "content": "Previous answer" }
  ]
}
```

**Response:**
```json
{
  "answer": "Based on your planning sessions...",
  "sources": [
    {
      "id": "uuid",
      "content": "Feature list includes...",
      "memory_type": "decision",
      "similarity": 0.92,
      "project_id": "uuid",
      "project_title": "SaaS Product"
    }
  ]
}
```

---

## Research

### Trigger Research

```
POST /api/planning/research
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "conversationId": "uuid",
  "phaseId": "uuid",
  "query": "What are the main competitors for legal tech SaaS?",
  "researchType": "competitive_analysis"
}
```

**Research Types:**
- `icp_deep_dive`
- `competitive_analysis`
- `market_research`
- `user_workflows`
- `technical_feasibility`
- `custom`

**Response:**
```json
{
  "id": "uuid",
  "status": "complete",
  "query": "...",
  "summary": "Research findings...",
  "key_findings": {
    "citations": ["url1", "url2"],
    "model": "sonar-pro"
  },
  "completed_at": "2026-01-28T12:05:00Z"
}
```

**Rate Limits:**
- Session limit: 10 research requests per conversation
- Project limit: 50 research requests per project

### Get Research Results

```
GET /api/planning/research
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | string | Get specific research by ID |
| projectId | string | Get all research for project |
| conversationId | string | Get all research for conversation |

**Response:** Research object(s)

---

## Prioritization

### Calculate Priority Scores

```
POST /api/planning/prioritize
```

**Request Body:** None required (processes all ready_to_build projects)

**Scoring Criteria:**
| Factor | Weight | Description |
|--------|--------|-------------|
| Goal Alignment | 40% | Match with active user goals |
| Doc Completeness | 25% | Number of generated documents |
| Effort Estimate | 20% | Scope clarity from documentation |
| Recency | 15% | Newer projects get momentum boost |

**Response:**
```json
{
  "success": true,
  "updated": 5
}
```

---

## Database Types Reference

### Project Status Values

| Status | Description |
|--------|-------------|
| `idea` | Initial capture, not yet planned |
| `planning` | Active planning in progress |
| `ready_to_build` | Packaged and prioritized |
| `building` | Active development |
| `shipped` | Completed and deployed |
| `archived` | No longer active |

### Phase Types

| Phase | Description |
|-------|-------------|
| `capture` | Initial idea capture |
| `discover` | Research and discovery |
| `define` | Problem definition |
| `develop` | Solution design |
| `validate` | Readiness validation |
| `package` | GSD export |

---

## Error Responses

All endpoints return standard error format:

```json
{
  "error": "Error message"
}
```

**HTTP Status Codes:**
| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Not authenticated |
| 404 | Not Found - Resource doesn't exist |
| 429 | Rate Limited - Too many requests |
| 500 | Internal Error - Server error |
| 502 | Bad Gateway - External API error (Perplexity, OpenAI) |

---

## Examples

### Complete Planning Flow

```typescript
// 1. Create project (via UI quick capture)
// Project ID: abc-123

// 2. Start conversation
const conv = await fetch('/api/planning/conversations', {
  method: 'POST',
  body: JSON.stringify({
    projectId: 'abc-123',
    phaseId: 'phase-uuid',
  }),
});

// 3. Chat with streaming
const response = await fetch('/api/planning/chat', {
  method: 'POST',
  body: JSON.stringify({
    projectId: 'abc-123',
    phaseType: 'discover',
    conversationId: conv.id,
    message: "Let's explore the target market",
  }),
});

// Handle SSE stream...

// 4. Search memories later
const memories = await fetch('/api/planning/memories/search', {
  method: 'POST',
  body: JSON.stringify({
    query: 'target market decisions',
    projectId: 'abc-123',
  }),
});

// 5. Generate document
const doc = await fetch('/api/planning/documents/generate', {
  method: 'POST',
  body: JSON.stringify({
    projectId: 'abc-123',
    docType: 'icp',
  }),
});

// 6. Export for Claude Code
const exported = await fetch('/api/planning/documents/export', {
  method: 'POST',
  body: JSON.stringify({
    projectId: 'abc-123',
  }),
});
```
