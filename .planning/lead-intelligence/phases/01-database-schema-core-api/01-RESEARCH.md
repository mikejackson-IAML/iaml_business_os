# Phase 1: Database Schema & Core API - Research

**Researched:** 2026-01-27
**Domain:** Supabase PostgreSQL schema + Next.js API routes
**Confidence:** HIGH

## Summary

This phase creates 11 tables + 1 junction table + 1 view in Supabase, plus CRUD API routes for contacts and companies. The PRD provides exact SQL definitions for all tables. The existing codebase has clear patterns for both migrations and API routes that should be followed exactly.

The existing `lead_intelligence` schema migration file is a stub ("Already applied manually"), meaning the original schema (domains, lead_sources, lead_imports, etc.) was applied outside the migration system. The NEW tables from the PRD (contacts, companies, attendance_records, etc.) are entirely different from what exists and need a fresh migration.

**Primary recommendation:** Create one migration file with all 11 tables + junction table + view + indexes + updated_at triggers, then create API routes following the existing task API pattern (route.ts + queries + mutations + types + validation modules).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | existing | DB client | Already in use via `getServerClient()` |
| Next.js App Router | 16 | API routes | `app/api/lead-intelligence/` routes |
| PostgreSQL | Supabase-managed | Database | All tables, views, indexes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None additional needed | - | - | Phase 1 uses only existing dependencies |

## Architecture Patterns

### Established Codebase Patterns (MUST FOLLOW)

**1. Supabase Server Client**
- File: `dashboard/src/lib/supabase/server.ts`
- Pattern: `getServerClient()` singleton using service role key
- No RLS needed (single operator, v1)

**2. API Route Structure (from Task API)**
```
dashboard/src/app/api/lead-intelligence/
├── contacts/
│   ├── route.ts              # GET (list) + POST (create)
│   └── [id]/
│       └── route.ts          # GET (detail) + PUT (update) + DELETE
└── companies/
    ├── route.ts              # GET (list) + POST (create)
    └── [id]/
        └── route.ts          # GET (detail) + PUT (update) + DELETE
```

**3. Query/Mutation Separation (from Task API)**
```
dashboard/src/lib/api/
├── lead-intelligence-contacts-queries.ts   # Read operations
├── lead-intelligence-contacts-mutations.ts # Write operations
├── lead-intelligence-contacts-types.ts     # TypeScript interfaces
├── lead-intelligence-contacts-validation.ts # Input validation
├── lead-intelligence-companies-queries.ts
├── lead-intelligence-companies-mutations.ts
├── lead-intelligence-companies-types.ts
└── lead-intelligence-companies-validation.ts
```

**4. Route Handler Pattern**
- `validateApiKey(request)` for auth
- Parse query params for GET, JSON body for POST/PUT
- Validation layer before DB operations
- Structured error responses: `{ error: string, code: string }`
- HTTP status codes: 200 OK, 201 Created, 400 Validation, 404 Not Found, 500 Internal

**5. Dynamic Route Params (Next.js 16)**
- Params are async: `const { id } = await context.params;`
- Interface: `{ params: Promise<{ id: string }> }`

**6. Migration File Naming**
- Pattern: `YYYYMMDDNN_description.sql` (e.g., `2026012700_create_contacts_schema.sql`)
- Existing migrations use this numbering scheme

### Recommended Migration Structure
```sql
-- Single migration file containing:
-- 1. companies table (no FK dependencies)
-- 2. contacts table (FK to companies)
-- 3. attendance_records table (FK to contacts, programs)
-- 4. email_activities table (FK to contacts)
-- 5. opportunities table (FK to companies, contacts)
-- 6. opportunity_contacts junction (FK to opportunities, contacts)
-- 7. opportunity_attachments (FK to opportunities)
-- 8. contact_notes (FK to contacts)
-- 9. company_notes (FK to companies)
-- 10. activity_log (polymorphic, no FK)
-- 11. follow_up_tasks (FK to contacts, companies, opportunities)
-- 12. data_health_metrics view
-- 13. updated_at trigger function + triggers
-- 14. All indexes
```

### Pagination Pattern
- Existing Task API uses cursor-based pagination
- For Phase 1, offset-based pagination (page + limit) is simpler and sufficient for contacts/companies
- Query params: `page` (default 1), `limit` (default 25, max 100), `sort` (column), `order` (asc/desc)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom IDs | `gen_random_uuid()` | PostgreSQL built-in, already used everywhere |
| Timestamps | Manual timestamp management | `DEFAULT NOW()` + trigger for `updated_at` | Standard Supabase pattern |
| Pagination | Custom pagination logic | Supabase `.range(from, to)` with count | Built into client |
| Input validation | Inline validation | Dedicated validation module (like task-validation.ts) | Consistent error messages |

## Common Pitfalls

### Pitfall 1: Foreign Key to Programs Table
**What goes wrong:** `attendance_records` references `programs(id)` but the programs table migration is also a stub.
**How to avoid:** Verify programs table exists in production DB before migration. If not, create it or remove the FK constraint and use a text field for program reference.

### Pitfall 2: Schema Naming Conflicts
**What goes wrong:** The existing `lead_intelligence` schema has tables like `lead_sources`, `lead_imports` in what appears to be a different domain (email infrastructure). The new PRD tables (contacts, companies) are in a different conceptual domain.
**How to avoid:** Use the default `public` schema for the new tables (matching the PRD SQL which has no schema prefix). The table names (contacts, companies, etc.) are generic enough to not conflict.

### Pitfall 3: Missing updated_at Trigger
**What goes wrong:** PRD defines `updated_at` columns but no trigger to auto-update them.
**How to avoid:** Create a `set_updated_at()` trigger function and apply it to all tables with `updated_at`.

### Pitfall 4: View Dependencies
**What goes wrong:** The `data_health_metrics` view depends on the `contacts` table. If the view is created in the same migration, order matters.
**How to avoid:** Create the view after all tables in the same migration file.

### Pitfall 5: Existing Migration Stubs
**What goes wrong:** The file `2026011400_create_lead_intelligence_schema.sql` exists as a stub saying "Already applied manually." Running `supabase db push` with a new migration that creates tables already existing in production will fail.
**How to avoid:** Use `CREATE TABLE IF NOT EXISTS` or verify which tables actually exist in production first. The PRD tables (contacts, companies, etc.) are NEW and don't exist yet, so standard `CREATE TABLE` should work.

## Code Examples

### Migration: updated_at Trigger
```sql
-- Reusable trigger function (may already exist)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each table with updated_at
CREATE TRIGGER set_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### API Route: GET List with Pagination
```typescript
// Source: Existing task API pattern adapted for contacts
export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') === 'asc' ? true : false;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getServerClient();
    const { data, error, count } = await supabase
      .from('contacts')
      .select('*, companies(name)', { count: 'exact' })
      .range(from, to)
      .order(sort, { ascending: order });

    if (error) throw error;

    return NextResponse.json({
      data,
      meta: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) }
    });
  } catch (error) {
    console.error('Contacts list error:', error);
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
```

### API Route: POST Create
```typescript
export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = validateCreateContact(body);
    if (!validation.success) {
      return NextResponse.json(createValidationError(validation.errors!), { status: 400 });
    }

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('contacts')
      .insert(validation.data!)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Contact create error:', error);
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
```

### Dynamic Route Params (Next.js 16)
```typescript
interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  // ...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sync route params | Async route params (`await context.params`) | Next.js 15+ | Must use Promise-based params |

## Open Questions

1. **Do contacts/companies tables already exist in production?**
   - What we know: The migration stub says "already applied manually" but that was for the OLD lead_intelligence schema (domains, lead_sources). The PRD tables are new.
   - Recommendation: Assume they don't exist. Use standard CREATE TABLE. If migration fails, add IF NOT EXISTS.

2. **Does the programs table exist?**
   - What we know: `2026011301_create_programs_schema.sql` is also a stub. The `attendance_records` table has `REFERENCES programs(id)`.
   - Recommendation: Verify programs table exists before migration. If not, either create it in this migration or make the FK optional.

## Sources

### Primary (HIGH confidence)
- PRD at `/Users/mikejackson/Downloads/lead-intelligence-prd.md` - Full SQL schema definitions
- Existing codebase: `dashboard/src/app/api/tasks/` - API route patterns
- Existing codebase: `dashboard/src/lib/supabase/server.ts` - Supabase client pattern
- Existing codebase: `dashboard/src/lib/api/lead-intelligence-queries.ts` - Query pattern
- Existing codebase: `dashboard/src/app/api/tasks/[id]/route.ts` - Dynamic route params pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All from existing codebase
- Architecture: HIGH - Directly observed patterns in task API and existing lead intelligence queries
- Pitfalls: HIGH - Based on actual migration files and FK dependencies in PRD SQL

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable domain, existing codebase patterns)
