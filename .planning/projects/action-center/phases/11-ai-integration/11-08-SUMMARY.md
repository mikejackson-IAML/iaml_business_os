# Plan 11-08 Summary: Suggestion Expiry and Final Integration

## Status: COMPLETE

## Tasks Completed

| # | Task | Commit |
|---|------|--------|
| 1 | Create suggestion expiry database function | `dd876d3` |
| 2 | Add expiry check to weekly workflow | `2b91941` |
| 3 | Add expiry indicator to task row | `3d3b714` |
| 4 | Add components to index exports | `ad3432b` |
| 5 | Final verification testing | N/A (verification only) |

## Files Created

- `supabase/migrations/20260125_ai_suggestion_expiry.sql` - Database function for expiring old AI suggestions

## Files Modified

- `business-os/workflows/weekly-ai-focus.json` - Added "Expire Old Suggestions" node and expiredCount in Slack message
- `dashboard/src/app/dashboard/action-center/components/task-row.tsx` - Added expiry indicator badge and `getDaysUntilExpiry()` helper
- `dashboard/src/app/dashboard/action-center/components/index.ts` - Added exports for AISuggestionActions and RejectSuggestionDialog

## Implementation Details

### Database Function: expire_ai_suggestions()

The function finds AI suggestions older than 7 days and:
- Updates `status` to `'dismissed'`
- Sets `dismissed_reason` to `'ai_expired: Suggestion not reviewed within 7 days'`
- Sets `dismissed_at` timestamp
- Returns count of expired suggestions

### Workflow Integration

The Weekly AI Focus workflow now:
1. Triggers on schedule (Sunday 7pm, Friday 5pm CT)
2. **NEW:** Calls `expire_ai_suggestions()` first to clean up old suggestions
3. Passes `expiredCount` through the flow
4. Includes expired count in Slack success message (if > 0)

### UI Expiry Indicator

Task rows now show an amber badge "Expires in Xd" when:
- Task source is 'ai'
- Task status is 'open'
- Task has `ai_suggested_at` set
- Less than or equal to 2 days until 7-day expiry

## Verification Checklist

The following components were verified as properly integrated:

- [x] AI Suggested view filters work (source='ai', status='open')
- [x] Weekly Focus widget exists and displays on dashboard
- [x] Confidence badges show on AI tasks
- [x] Accept/Reject flow components exist (AISuggestionActions, RejectSuggestionDialog)
- [x] Expiry indicator shows for suggestions nearing 7 days
- [x] Pattern detection runs during AI analysis (buildAnalysisPrompt returns detectedPatterns)
- [x] All components properly exported from index.ts

### Manual Testing Required

Before marking phase complete, manually verify:

- [ ] Run weekly-ai-focus workflow manually
- [ ] Verify Weekly Focus Review task created
- [ ] Verify AI suggestions created with confidence
- [ ] Accept a suggestion - becomes in_progress
- [ ] Reject a suggestion with reason - becomes dismissed
- [ ] Verify dashboard widget shows weekly summary
- [ ] Check expiry badge on old suggestion (create test task with ai_suggested_at 6 days ago)

## Requirements Covered

- **AI-04:** Auto-expire suggestions after 7 days

## Deviations

None.

## Discoveries

- The ConfidenceBadge component was already exported in index.ts (line 29)
- Pattern detection is properly integrated in ai-analysis API (line 111-114)
- Weekly Focus widget extracts summary from "## This Week's Focus" markdown section
