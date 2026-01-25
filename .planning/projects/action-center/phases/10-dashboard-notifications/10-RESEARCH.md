# Phase 10: Dashboard & Notifications - Research

**Researched:** 2026-01-25
**Status:** Ready for planning

## 1. Dashboard Architecture

### Main Dashboard Location
- **Page:** `dashboard/src/app/dashboard/page.tsx`
- **Content:** `dashboard/src/app/dashboard/dashboard-content.tsx`
- **Pattern:** Uses Suspense + data loader pattern; displays CEO Dashboard with metrics, campaigns, activities

### Dashboard Layout System
- **Layout Base:** `dashboard-kit/components/dashboard/dashboard-layout.tsx`
- **Features:** Reusable DashboardLayout with sidebar, notifications bell icon, theme toggle, user menu
- **Props:** `notifications` (count) and `onNotificationClick` callbacks

### Widget Placement Pattern
- Dashboard content component builds sections with Cards
- Existing structure: metrics grid + campaigns + activities
- Action Center widget would be added as a new Card component at top

## 2. Task Data Access

### Query Functions
- **Location:** `dashboard/src/lib/api/task-queries.ts`
- **Main Function:** `listTasks(params: TaskListParams)` returns `{tasks, cursor, has_more}`
- **Filters:** status, priority, assignee_id, department, task_type, source, due_category, workflow_id, search
- **Pagination:** Cursor-based using task IDs
- **Sorting:** Primary by priority (critical first), secondary by due_date

### Action Center Data Loader
- **Location:** `dashboard/src/app/dashboard/action-center/action-center-data-loader.tsx`
- Uses `listTasks()` with limit of 500
- Extracts unique departments for filter dropdowns

### Badge Count Query
Need to create a new efficient query that returns:
- Critical count (status=open, priority=critical)
- Due today count (status=open, due_category='today')
- Overdue count (status=open, due_category='overdue')

Can leverage existing `listTasks()` with count-only parameter, or create a dedicated RPC.

## 3. Navigation & Badge

### Navigation Structure
- **User Menu:** `dashboard/src/components/UserMenu.tsx` - top-right with Settings and LogOut
- **Dashboard Layout:** Has notifications bell icon already with count prop
- **Settings Link:** Goes to `/settings`

### Badge Pattern
- DashboardLayout already accepts `notifications` prop for badge count
- Badge appears on notifications bell icon
- Need to add Action Center-specific badge to nav item

### Adding Nav Badge
Two options:
1. Use existing notifications bell pattern (update `notifications` prop)
2. Add dedicated badge to Action Center nav item (requires layout update)

Recommend: Add dedicated badge to sidebar nav for "Action Center" item.

## 4. Real-time Infrastructure

### Supabase Setup
- **Browser Client:** `dashboard/src/lib/supabase/client.ts` - uses `createBrowserClient`
- **Server Client:** `dashboard/src/lib/supabase/server.ts` - uses `createServerClient`

### Real-time Pattern
No existing real-time subscriptions found in codebase. Would implement using:
```typescript
const channel = supabase
  .channel('task-changes')
  .on('postgres_changes',
    { event: '*', schema: 'action_center', table: 'tasks' },
    (payload) => { /* update badge count */ }
  )
  .subscribe()
```

### Recommendation
For badge updates, use Supabase real-time subscription in a React context or hook that wraps the dashboard layout.

## 5. Email Infrastructure

### Current State
- **No email service installed** (no Resend, SendGrid, AWS SES imports found)
- **Push notifications:** APNs-based via `@parse/node-apn` at `dashboard/src/lib/api/notifications.ts`
- **Digest endpoint:** `/api/mobile/notifications/digest` exists for mobile push, not email

### Email Sending Options
1. **Resend** (recommended) - Simple API, React Email templates, good DX
2. **n8n workflow** - Existing email patterns in business-os/workflows/
3. **SendGrid** - More enterprise, complex setup

### Recommendation
Install Resend for email sending. Create React Email templates for digest.

### User Data for Email
- **Profiles table:** `public.profiles` with id, email, full_name, avatar_url, role, is_active
- **Missing:** timezone, notification_preferences columns

## 6. Settings & Preferences

### Settings Page
- **Location:** `dashboard/src/app/settings/page.tsx`
- **Layout:** `dashboard/src/app/settings/layout.tsx` with tabs: Profile and Users
- **Pattern:** Fetch from `public.profiles`, update via actions

### Notification Preferences Storage
Options:
1. Add columns to `public.profiles`: `digest_enabled`, `digest_time`, `timezone`, `critical_alerts_enabled`
2. Create separate `notification_preferences` table

Recommend: Add columns to profiles (simpler for single-user system).

### Schema Addition Needed
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
  digest_enabled BOOLEAN DEFAULT TRUE,
  digest_time TIME DEFAULT '07:00',
  timezone TEXT DEFAULT 'America/Chicago',
  critical_alerts_enabled BOOLEAN DEFAULT TRUE;
```

## 7. Toast Notifications

### Current State
- No toast library installed (no Sonner, react-hot-toast, etc.)
- Current pattern: simple state-based message cards with conditional CSS

### Recommendation
Install `sonner` for toast notifications:
- Lightweight
- Works with Next.js App Router
- Supports promise toasts and custom styling

### Usage Pattern
```tsx
import { toast } from 'sonner'

// In action handler
toast.success('Task completed')
toast.error('Failed to complete task')
```

## 8. Technical Decisions

### What This Phase Should Do
1. Create Action Center widget component for main dashboard
2. Add task count badge to Action Center nav item
3. Implement real-time badge updates via Supabase subscription
4. Add notification preferences to profiles table
5. Create notification preferences UI in Settings
6. Install and configure Resend for email
7. Create digest email template (React Email)
8. Create API endpoint for sending digest
9. Create n8n workflow for daily 7am digest (or Vercel cron)
10. Install and configure Sonner for toast notifications

### What This Phase Should NOT Do
- Modify existing task list functionality
- Change existing API endpoints
- Implement Slack notifications (out of scope)
- Build complex notification center UI (just badge + toast)

## 9. Risks and Gotchas

### Risk: Email Deliverability
- New email sending requires verified domain in Resend
- May need DNS records for DKIM/SPF
- **Mitigation:** Start with Resend free tier, verify domain first

### Risk: Real-time Subscription Cleanup
- Must unsubscribe when component unmounts to avoid memory leaks
- **Mitigation:** Use cleanup function in useEffect

### Risk: Timezone Handling
- User timezone needed for 7am digest send time
- **Mitigation:** Default to America/Chicago, allow user to set in preferences

### Risk: Badge Performance
- Frequent count queries could be expensive
- **Mitigation:** Use Supabase real-time instead of polling; debounce updates

### Risk: Profiles Table Migration
- Adding columns to existing table
- **Mitigation:** Use IF NOT EXISTS, default values

## 10. Recommended Plan Structure

### Wave 1 (Database + Core)
- Migration for notification preferences columns
- Task count query function/RPC
- Install dependencies (Resend, Sonner)

### Wave 2 (Widget + Badge)
- Action Center widget component
- Nav badge with real-time subscription
- Widget integration on main dashboard

### Wave 3 (Notifications UI)
- Notification preferences form in Settings
- Toast notification integration

### Wave 4 (Email Digest)
- Resend email service setup
- Digest email template
- Digest generation function
- Digest API endpoint

### Wave 5 (Scheduled Digest)
- n8n workflow OR Vercel cron for daily digest
- Final integration testing

---

*Research completed: 2026-01-25*
