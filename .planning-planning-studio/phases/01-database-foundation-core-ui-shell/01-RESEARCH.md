# Phase 1: Database Foundation & Core UI Shell - Research

**Researched:** 2026-01-26
**Domain:** Supabase pgvector, Next.js App Router, PostgreSQL schema design
**Confidence:** HIGH

## Summary

This phase establishes the data layer (Supabase with pgvector for vector embeddings) and basic Next.js page routing for the Planning Studio. Research confirms the existing codebase already has established patterns for Supabase clients, schema creation via migrations, and dashboard page structure that we should follow.

The key findings are:
1. pgvector is ready to use in Supabase with simple `CREATE EXTENSION IF NOT EXISTS vector;` - HNSW indexes can be created immediately after table creation
2. The dashboard follows a consistent pattern: page.tsx (server component with Suspense) -> DataLoader -> Content component
3. Migration files follow `YYYYMMDD_description.sql` naming convention with dedicated schemas
4. Navigation is done via hardcoded links in dashboard-content.tsx header section

**Primary recommendation:** Follow existing patterns exactly - create planning_studio schema via migration, add Planning Studio link to dashboard header, create shell pages with skeleton components.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | current | Database client | Already configured in dashboard |
| @supabase/ssr | current | Browser client for SSR | Already configured |
| Next.js App Router | 14+ | Page routing | Existing dashboard pattern |
| PostgreSQL | 17 | Database engine | Supabase standard |
| pgvector | 0.7.0+ | Vector embeddings | Supabase native extension |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | current | Icons | Already used throughout dashboard |
| tailwindcss | current | Styling | Already configured |
| sonner | current | Toast notifications | Already configured |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pgvector | Pinecone/Weaviate | External service adds complexity; pgvector is built-in |
| HNSW index | IVFFlat index | HNSW is recommended as default - better with changing data |

**Installation:**
No new packages needed - all dependencies already exist in the project.

## Architecture Patterns

### Recommended Project Structure

Based on existing patterns in the codebase:

```
dashboard/src/app/dashboard/
├── planning/                          # New Planning Studio routes
│   ├── page.tsx                       # Main pipeline view (server component)
│   ├── planning-content.tsx           # Client component with UI
│   ├── planning-skeleton.tsx          # Loading skeleton
│   ├── [projectId]/                   # Project detail routes
│   │   ├── page.tsx
│   │   └── project-content.tsx
│   └── settings/                      # Goals management
│       └── page.tsx

dashboard/src/lib/api/
└── planning-queries.ts                # Server-side Supabase queries

supabase/migrations/
└── 20260127_create_planning_studio_schema.sql
```

### Pattern 1: Page Component Structure

**What:** Server component with Suspense wrapping async data loader
**When to use:** All dashboard pages
**Example:**
```typescript
// Source: dashboard/src/app/dashboard/development/page.tsx
import { Suspense } from 'react';
import { getDevelopmentDashboardData } from '@/lib/api/development-queries';
import { DevelopmentContent } from './development-content';
import { DevelopmentSkeleton } from './development-skeleton';

export const dynamic = 'force-dynamic';

export default async function DevelopmentPage() {
  return (
    <Suspense fallback={<DevelopmentSkeleton />}>
      <DevelopmentDataLoader />
    </Suspense>
  );
}

async function DevelopmentDataLoader() {
  const data = await getDevelopmentDashboardData();
  return <DevelopmentContent data={data} />;
}
```

### Pattern 2: Supabase Query Pattern

**What:** Server-side queries using createServerClient singleton
**When to use:** All database queries from server components
**Example:**
```typescript
// Source: dashboard/src/lib/api/development-queries.ts
import { createServerClient } from '@/lib/supabase/server';

export async function getDevProjects(): Promise<DevProjectSummary[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('dev_project_summary')  // Can query views directly
    .select('*')
    .order('status');

  if (error) {
    console.error('Error fetching dev projects:', error);
    return [];
  }

  return data || [];
}
```

### Pattern 3: Migration File Structure

**What:** SQL files with schema creation, tables, indexes, functions, triggers, comments
**When to use:** All database schema changes
**Example:**
```sql
-- Source: supabase/migrations/20260123_dev_projects_schema.sql
-- Development Project Management Schema
-- Date: 2026-01-23

-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS planning_studio;

-- Tables
CREATE TABLE IF NOT EXISTS planning_studio.projects (
  ...
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON planning_studio.projects(status);

-- Functions
CREATE OR REPLACE FUNCTION planning_studio.some_function(...)
RETURNS ... AS $$
BEGIN
  ...
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON planning_studio.projects
  FOR EACH ROW EXECUTE FUNCTION planning_studio.update_updated_at();

-- Comments
COMMENT ON TABLE planning_studio.projects IS 'Main project tracking table';
```

### Pattern 4: Navigation Links

**What:** Hardcoded links in dashboard header section
**When to use:** Adding new top-level dashboard sections
**Example:**
```typescript
// Source: dashboard/src/app/dashboard/dashboard-content.tsx lines 137-187
<div className="flex flex-wrap gap-3 mt-4">
  <Link
    href="/dashboard/development"
    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-colors"
  >
    <FolderCode className="h-4 w-4" />
    <span className="text-sm font-medium">Development</span>
    <ArrowRight className="h-3 w-3" />
  </Link>
</div>
```

### Anti-Patterns to Avoid

- **Creating separate layout.tsx for simple nested routes:** Not needed - follow flat page structure
- **Using client-side Supabase for initial data fetch:** Always use server components with createServerClient
- **Hardcoding table names from wrong schema:** Always use schema-qualified names (planning_studio.projects)
- **Skipping skeleton components:** Always create loading states for dashboard pages

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vector similarity search | Custom cosine similarity function | pgvector `<=>` operator + HNSW index | Optimized C implementation |
| Full-text search fallback | Custom text matching | pg_trgm extension (already suggested in REQUIREMENTS) | Proven, indexed |
| Updated_at triggers | Per-table trigger logic | Single trigger function reused | Pattern from n8n_brain schema |
| Type definitions | Manual types | Let TypeScript infer from Supabase or create explicit types | Types file already exists |

**Key insight:** The existing codebase has patterns for everything needed - schema design (dev_projects), query patterns (development-queries.ts), page structure (development/page.tsx). Copy these patterns exactly.

## Common Pitfalls

### Pitfall 1: pgvector Extension Schema

**What goes wrong:** Extension created in wrong schema, causing queries to fail
**Why it happens:** Default schema behavior differs between local and production Supabase
**How to avoid:** Use `CREATE EXTENSION IF NOT EXISTS vector;` without schema qualifier for pgvector specifically - Supabase expects it in the default location
**Warning signs:** "function does not exist" errors when using vector operators

### Pitfall 2: HNSW Index Creation on Empty Table

**What goes wrong:** Developer waits for data before creating HNSW index (IVFFlat habit)
**Why it happens:** IVFFlat requires data before indexing; HNSW does not
**How to avoid:** Create HNSW index immediately after table creation - it works correctly with empty tables and fills as data is added
**Warning signs:** Unnecessary "skip index for now" comments in migration

### Pitfall 3: Vector Dimension Mismatch

**What goes wrong:** Embedding model generates different dimension than column expects
**Why it happens:** Different OpenAI models produce different dimensions
**How to avoid:** text-embedding-3-small produces 1536 dimensions - schema already specifies `VECTOR(1536)` correctly
**Warning signs:** "expected 1536 dimensions, got N" errors

### Pitfall 4: Missing Schema in Query

**What goes wrong:** Queries fail because table not found
**Why it happens:** Supabase client queries default to `public` schema
**How to avoid:** Use fully qualified table names OR configure search_path in Supabase config (existing config uses: `extra_search_path = ["public", "extensions"]`)
**Warning signs:** "relation does not exist" errors for tables you know exist

### Pitfall 5: Forgetting to Update Types

**What goes wrong:** TypeScript types don't match database schema
**Why it happens:** Types file is manually maintained
**How to avoid:** After creating migration, update `dashboard/src/lib/supabase/types.ts` to include new schema types
**Warning signs:** Type errors when querying new tables

## Code Examples

Verified patterns from official sources and existing codebase:

### Enable pgvector Extension

```sql
-- Source: https://supabase.com/docs/guides/database/extensions/pgvector
-- Enable in default location (Supabase handles schema)
CREATE EXTENSION IF NOT EXISTS vector;
```

### Create Table with Vector Column

```sql
-- Source: REQUIREMENTS.md + Supabase docs
CREATE TABLE planning_studio.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES planning_studio.projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),  -- OpenAI text-embedding-3-small dimensions
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Create HNSW Index

```sql
-- Source: https://supabase.com/docs/guides/ai/vector-indexes/hnsw-indexes
-- Create immediately after table (safe with empty table)
CREATE INDEX memories_embedding_idx
  ON planning_studio.memories
  USING hnsw (embedding vector_cosine_ops);
```

### Vector Similarity Search Function

```sql
-- Source: REQUIREMENTS.md search_memories function
CREATE OR REPLACE FUNCTION planning_studio.search_memories(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 10,
  filter_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    1 - (m.embedding <=> query_embedding) AS similarity  -- Cosine similarity
  FROM planning_studio.memories m
  WHERE (filter_project_id IS NULL OR m.project_id = filter_project_id)
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Shell Page Component

```typescript
// Based on: dashboard/src/app/dashboard/development/page.tsx
import { Suspense } from 'react';
import { PlanningSkeleton } from './planning-skeleton';
import { PlanningContent } from './planning-content';

export const metadata = {
  title: 'Planning Studio | IAML Business OS',
  description: 'AI-guided idea-to-production pipeline',
};

export const revalidate = 60; // Revalidate every minute

export default function PlanningPage() {
  return (
    <Suspense fallback={<PlanningSkeleton />}>
      <PlanningContent />
    </Suspense>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| IVFFlat indexes | HNSW indexes | pgvector 0.5.0+ (2023) | HNSW is now default recommendation |
| Store embeddings externally | pgvector in Postgres | Supabase Vector (2023) | Single database for all data |
| Pages Router | App Router | Next.js 13+ (2023) | Server components, better streaming |

**Deprecated/outdated:**
- **IVFFlat first, HNSW later:** No longer recommended - HNSW can be created immediately
- **getServerSideProps:** Use Server Components with async/await instead

## Open Questions

Things that couldn't be fully resolved:

1. **Type Generation**
   - What we know: Types file is manually maintained in this project
   - What's unclear: Whether to use Supabase CLI for type generation or continue manual
   - Recommendation: Continue manual approach for now (matches existing pattern), consider CLI generation later

2. **Search Path Configuration**
   - What we know: Supabase config has `extra_search_path = ["public", "extensions"]`
   - What's unclear: Whether planning_studio schema should be added to search_path
   - Recommendation: Use fully-qualified table names (planning_studio.projects) for clarity

## Sources

### Primary (HIGH confidence)
- Existing codebase: `dashboard/src/app/dashboard/development/` - Page structure pattern
- Existing codebase: `dashboard/src/lib/supabase/server.ts` - Supabase client pattern
- Existing codebase: `supabase/migrations/20260123_dev_projects_schema.sql` - Migration pattern
- [pgvector Supabase Docs](https://supabase.com/docs/guides/database/extensions/pgvector) - Extension setup
- [HNSW Indexes Supabase Docs](https://supabase.com/docs/guides/ai/vector-indexes/hnsw-indexes) - Index creation

### Secondary (MEDIUM confidence)
- Existing codebase: `dashboard/src/lib/api/development-queries.ts` - Query patterns
- Existing codebase: `dashboard/src/app/dashboard/dashboard-content.tsx` - Navigation pattern

### Tertiary (LOW confidence)
- None - all findings verified with codebase or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, verified in package.json and codebase
- Architecture: HIGH - All patterns extracted from existing, working code
- Pitfalls: HIGH - Based on official Supabase documentation + known PostgreSQL gotchas

**Research date:** 2026-01-26
**Valid until:** 60 days (stable patterns, pgvector is mature)
