#!/bin/bash
# Offload tasks to background Claude Code processes
# Source this: source /Users/mike/IAML\ Business\ OS/scripts/offload.sh

OFFLOAD_DIR="/Users/mike/IAML Business OS/tasks/responses"
CONTEXT_FILE="/Users/mike/IAML Business OS/.claude/skills/workflow-multiplier-context.md"

# Main offload function
offload() {
  local task="$1"
  local template="${2:-}" # optional: doc, skill, review, arch, boiler, n8n, seo, component

  if [[ -z "$task" ]]; then
    echo "Usage: offload \"task description\" [template]"
    echo "Templates: doc, skill, review, arch, boiler, n8n, seo, component"
    return 1
  fi

  mkdir -p "$OFFLOAD_DIR"

  # Generate filename
  local slug=$(echo "$task" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | cut -c1-40)
  local filename="$OFFLOAD_DIR/$(date +%Y%m%d-%H%M%S)-${slug}.md"

  # Build prompt with context
  local context=$(cat "$CONTEXT_FILE" | sed -n '/^```markdown$/,/^```$/p' | head -1 | tail -n +2)
  local full_prompt="$context

## Task
$task

## Output Format
Return complete, paste-ready content. Start with file paths if creating files."

  # Run in background
  (
    claude --print "$full_prompt" > "$filename" 2>&1
    echo -e "\a"  # Terminal bell
    osascript -e "display notification \"Task complete: $slug\" with title \"Offload Done\"" 2>/dev/null
  ) &

  local pid=$!

  # Log to queue
  echo "| $(date +%Y-%m-%d) | PENDING | $task | PID:$pid → $filename |" >> "/Users/mike/IAML Business OS/tasks/async-queue.md"

  echo "→ Offloaded (PID: $pid)"
  echo "  Output: $filename"
  echo "  Check:  cat \"$filename\""
}

# Quick check on running offloads
offload-status() {
  echo "Running Claude processes:"
  ps aux | grep -E "claude.*--print" | grep -v grep || echo "  None running"
  echo ""
  echo "Recent outputs:"
  ls -lt "$OFFLOAD_DIR" 2>/dev/null | head -6
}

# View latest offload result
offload-latest() {
  local latest=$(ls -t "$OFFLOAD_DIR"/*.md 2>/dev/null | head -1)
  if [[ -n "$latest" ]]; then
    echo "=== $latest ==="
    cat "$latest"
  else
    echo "No offload results yet"
  fi
}

# Tail a running offload
offload-watch() {
  local latest=$(ls -t "$OFFLOAD_DIR"/*.md 2>/dev/null | head -1)
  if [[ -n "$latest" ]]; then
    echo "Watching: $latest (Ctrl+C to stop)"
    tail -f "$latest"
  else
    echo "No offload results yet"
  fi
}

echo "Offload functions loaded: offload, offload-status, offload-latest, offload-watch"
