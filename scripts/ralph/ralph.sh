#!/bin/bash
# Ralph Loop - Autonomous AI Agent for IAML Business OS
# Adapted from https://github.com/snarktank/ralph
#
# This script runs Claude Code iterations to complete PRD items autonomously.
# Each iteration gets fresh context, preventing quality degradation.

set -e

# Configuration
MAX_ITERATIONS=${MAX_ITERATIONS:-15}
SLEEP_BETWEEN=${SLEEP_BETWEEN:-3}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Files
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"
AGENTS_FILE="$SCRIPT_DIR/AGENTS.md"
LAST_BRANCH_FILE="$SCRIPT_DIR/.last-branch"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              RALPH LOOP - IAML Business OS                 ║${NC}"
echo -e "${BLUE}║         Autonomous n8n Worker Deployment System            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo "Install with: sudo apt-get install jq (Linux) or brew install jq (Mac)"
    exit 1
fi

if ! command -v claude &> /dev/null; then
    echo -e "${RED}Error: Claude Code CLI not found.${NC}"
    echo "Install from: https://github.com/anthropics/claude-code"
    exit 1
fi

if [ ! -f "$PRD_FILE" ]; then
    echo -e "${RED}Error: prd.json not found at $PRD_FILE${NC}"
    echo "Create a prd.json with your user stories first."
    echo "See: $SCRIPT_DIR/prd.example.json for template"
    exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
    echo -e "${RED}Error: prompt.md not found at $PROMPT_FILE${NC}"
    exit 1
fi

# Archive previous runs if branch changed
current_branch=$(jq -r '.branchName // "main"' "$PRD_FILE")
if [ -f "$LAST_BRANCH_FILE" ]; then
    last_branch=$(cat "$LAST_BRANCH_FILE")
    if [ "$current_branch" != "$last_branch" ] && [ -f "$PROGRESS_FILE" ]; then
        archive_dir="$SCRIPT_DIR/archive/$(date +%Y-%m-%d)-$last_branch"
        mkdir -p "$archive_dir"
        cp "$PROGRESS_FILE" "$archive_dir/" 2>/dev/null || true
        echo -e "${YELLOW}Archived previous run to: $archive_dir${NC}"
        rm -f "$PROGRESS_FILE"
    fi
fi
echo "$current_branch" > "$LAST_BRANCH_FILE"

# Initialize progress file if needed
if [ ! -f "$PROGRESS_FILE" ]; then
    echo "# Ralph Progress Log - IAML Business OS" > "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "## Codebase Patterns" >> "$PROGRESS_FILE"
    echo "<!-- Add reusable patterns discovered during iterations -->" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
fi

# Count stories
total_stories=$(jq '.stories | length' "$PRD_FILE")
completed_stories=$(jq '[.stories[] | select(.passes == true)] | length' "$PRD_FILE")

echo -e "${GREEN}Project:${NC} $(jq -r '.project' "$PRD_FILE")"
echo -e "${GREEN}Branch:${NC} $current_branch"
echo -e "${GREEN}Progress:${NC} $completed_stories / $total_stories stories complete"
echo -e "${GREEN}Max Iterations:${NC} $MAX_ITERATIONS"
echo ""

# Main loop
iteration=1
while [ $iteration -le $MAX_ITERATIONS ]; do
    # Check if all stories complete
    incomplete=$(jq '[.stories[] | select(.passes != true)] | length' "$PRD_FILE")
    if [ "$incomplete" -eq 0 ]; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                    ALL STORIES COMPLETE!                   ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "Completed $total_stories stories in $((iteration - 1)) iterations."
        exit 0
    fi

    # Get next story
    next_story=$(jq -r '[.stories[] | select(.passes != true)][0].id' "$PRD_FILE")
    next_title=$(jq -r '[.stories[] | select(.passes != true)][0].title' "$PRD_FILE")

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Iteration $iteration / $MAX_ITERATIONS${NC}"
    echo -e "${GREEN}Next Story:${NC} [$next_story] $next_title"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Run Claude Code with the prompt
    # Using --print to run non-interactively with the prompt
    prompt_content=$(cat "$PROMPT_FILE")

    echo -e "${YELLOW}Starting Claude Code iteration...${NC}"

    # Run Claude with the prompt, working directory is project root
    cd "$PROJECT_ROOT"

    # Create a temporary file with the full context
    temp_prompt=$(mktemp)
    cat > "$temp_prompt" << EOF
$prompt_content

---

## Current PRD Location
$PRD_FILE

## Progress File Location
$PROGRESS_FILE

## AGENTS.md Location
$AGENTS_FILE

## Working Directory
$PROJECT_ROOT
EOF

    # Run Claude Code
    # Note: You may need to adjust this based on your Claude Code setup
    # Option 1: Interactive mode (recommended for complex tasks)
    # claude --print "$temp_prompt"

    # Option 2: Using the prompt file directly
    if claude --print "$(cat $temp_prompt)" 2>&1 | tee -a "$PROGRESS_FILE.log"; then
        echo -e "${GREEN}Iteration $iteration completed.${NC}"
    else
        echo -e "${RED}Iteration $iteration had errors. Check logs.${NC}"
    fi

    rm -f "$temp_prompt"

    # Check for completion signal in the output
    if grep -q "<promise>COMPLETE</promise>" "$PROGRESS_FILE.log" 2>/dev/null; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                    ALL STORIES COMPLETE!                   ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
        rm -f "$PROGRESS_FILE.log"
        exit 0
    fi

    rm -f "$PROGRESS_FILE.log"

    # Increment and sleep
    iteration=$((iteration + 1))

    if [ $iteration -le $MAX_ITERATIONS ]; then
        echo ""
        echo -e "${YELLOW}Sleeping $SLEEP_BETWEEN seconds before next iteration...${NC}"
        sleep $SLEEP_BETWEEN
    fi
done

echo ""
echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║              MAX ITERATIONS REACHED                        ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
remaining=$(jq '[.stories[] | select(.passes != true)] | length' "$PRD_FILE")
echo -e "${RED}$remaining stories still incomplete.${NC}"
echo "Review progress.txt and prd.json, then run again."
exit 1
