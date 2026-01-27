#!/bin/bash
#
# Slack notification helper for Overnight GSD
#

send_slack_notification() {
    local type=$1
    local title=$2
    local message=$3

    # Skip if no webhook configured
    if [[ -z "$SLACK_WEBHOOK" ]]; then
        log "Slack notification skipped (no webhook configured): $title"
        return 0
    fi

    local emoji
    case "$type" in
        start)
            emoji=":rocket:"
            ;;
        complete)
            emoji=":white_check_mark:"
            ;;
        blocker)
            emoji=":rotating_light:"
            ;;
        warning)
            emoji=":warning:"
            ;;
        *)
            emoji=":information_source:"
            ;;
    esac

    # Format message with newlines preserved
    local formatted_message=$(echo -e "$message" | sed 's/$/\\n/' | tr -d '\n' | sed 's/\\n$//')

    # Build simple Slack payload (works with all webhook types)
    local payload=$(cat <<EOF
{
    "text": "$emoji *$title*\n\n$formatted_message",
    "unfurl_links": false,
    "unfurl_media": false
}
EOF
)

    # Send to Slack
    local response
    response=$(curl -s -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$SLACK_WEBHOOK" 2>&1)

    if [[ "$response" == "ok" ]]; then
        log "Slack notification sent: $title"
    else
        log "Slack notification failed: $response"
    fi
}

send_blocker_alert() {
    local blocker=$1
    local context=$2

    send_slack_notification "blocker" "Blocker Encountered" \
        "*Issue:* $blocker\n\n*Context:* $context\n\nRun paused. Check \`.overnight/blockers.md\` for details."
}
