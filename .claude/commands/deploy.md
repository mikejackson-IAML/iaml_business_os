# Production Deployment

Deploy to Vercel production (www.iaml.com).

## Instructions

### 1. Check for Changes

First, check git status for any uncommitted changes:

```bash
cd "/Users/mike/IAML Business OS" && git status
```

### 2. Commit Changes (if any)

If there are uncommitted changes, stage and commit them:

```bash
cd "/Users/mike/IAML Business OS" && git add -A && git status
```

Then commit with a descriptive message:

```bash
git commit -m "$(cat <<'EOF'
<type>: <description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

**Commit types:** `feat`, `fix`, `chore`, `refactor`, `perf`, `docs`, `style`

### 3. Push to GitHub

```bash
cd "/Users/mike/IAML Business OS" && git push
```

### 4. Deploy to Vercel Production

```bash
cd "/Users/mike/IAML Business OS" && npx vercel --prod
```

### 5. Confirm Deployment

- Return the production URL to the user
- Confirm the deployment is live at www.iaml.com

## Quick Deploy (No Changes)

If git is clean, skip directly to deploy:

```bash
cd "/Users/mike/IAML Business OS" && npx vercel --prod
```
