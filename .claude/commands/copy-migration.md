# Copy Migration

Copy a Supabase migration file to clipboard.

## Usage

```
/copy-migration <filename>
```

## Examples

```
/copy-migration 20260117_create_workflow_errors_schema
/copy-migration knowledge
/copy-migration n8n_brain
```

## Instructions

When the user asks to copy a migration (or uses this command):

1. Search for the migration file in `supabase/migrations/`
2. If a partial name is given, find the best match
3. Copy the full SQL content to clipboard using `pbcopy`
4. Confirm to the user it's ready to paste

```bash
cat "/Users/mike/IAML Business OS/supabase/migrations/$ARGUMENTS.sql" | pbcopy
```

If the file doesn't exist, list available migrations and ask which one they want.
