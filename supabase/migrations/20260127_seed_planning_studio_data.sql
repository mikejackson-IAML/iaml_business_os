-- Planning Studio Seed Data
-- Creates test data for UI development and verification
-- Date: 2026-01-27

-- ============================================
-- USER GOALS
-- Goals that influence AI prioritization
-- ============================================

INSERT INTO planning_studio.user_goals (id, goal_type, description, priority, active)
VALUES
  (
    gen_random_uuid(),
    'revenue',
    'Prioritize projects that generate recurring revenue or reduce costs significantly',
    8,
    true
  ),
  (
    gen_random_uuid(),
    'learning',
    'Try new technologies and frameworks to expand skills (AI/ML, edge computing)',
    5,
    true
  ),
  (
    gen_random_uuid(),
    'quick_win',
    'Ship at least one small win per month to maintain momentum',
    7,
    true
  );

-- ============================================
-- CONFIG
-- System configuration values
-- ============================================

INSERT INTO planning_studio.config (key, value)
VALUES
  (
    'incubation_hours',
    '{"capture": 24, "discover": 48, "define": 24, "develop": 24, "validate": 12}'::jsonb
  ),
  (
    'default_priority_weights',
    '{"revenue": 1.5, "learning": 0.8, "strategic": 1.2, "quick_win": 1.0, "passion": 0.6}'::jsonb
  );

-- ============================================
-- PROJECTS
-- Test projects covering all statuses
-- ============================================

-- Project 1: Mobile App Idea (just captured, idea status)
INSERT INTO planning_studio.projects (
  id, title, one_liner, status, current_phase, created_at, updated_at
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Mobile App Idea',
  'A mobile app for tracking daily habits with gamification',
  'idea',
  'capture',
  NOW() - interval '2 hours',
  NOW() - interval '2 hours'
);

-- Project 2: AI Writing Assistant (in discovery, planning status)
INSERT INTO planning_studio.projects (
  id, title, one_liner, status, current_phase,
  priority_score, priority_reasoning, priority_updated_at,
  created_at, updated_at
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'AI Writing Assistant',
  'Browser extension that helps write professional emails using AI',
  'planning',
  'discover',
  7.5,
  'High revenue potential, aligns with AI learning goal, medium complexity',
  NOW() - interval '1 day',
  NOW() - interval '5 days',
  NOW() - interval '1 day'
);

-- Project 3: Customer Portal v2 (incubating in develop phase)
INSERT INTO planning_studio.projects (
  id, title, one_liner, status, current_phase,
  phase_locked_until, incubation_skipped,
  priority_score, priority_reasoning, priority_updated_at,
  created_at, updated_at
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Customer Portal v2',
  'Redesigned customer portal with self-service features and better UX',
  'planning',
  'develop',
  NOW() + interval '12 hours',
  false,
  8.2,
  'Directly supports revenue goal, reduces support costs, strategic for retention',
  NOW() - interval '2 days',
  NOW() - interval '10 days',
  NOW() - interval '6 hours'
);

-- Project 4: Analytics Dashboard (ready to build with command)
INSERT INTO planning_studio.projects (
  id, title, one_liner, status, current_phase,
  priority_score, priority_reasoning, priority_updated_at,
  claude_code_command, github_repo,
  ready_to_build_at, created_at, updated_at
)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Analytics Dashboard',
  'Real-time business metrics dashboard with customizable widgets',
  'ready_to_build',
  'package',
  9.1,
  'Quick win, high visibility, supports all goals indirectly',
  NOW() - interval '1 day',
  '/gsd:execute-phase 1 --project analytics-dashboard',
  'https://github.com/iaml/analytics-dashboard',
  NOW() - interval '1 day',
  NOW() - interval '14 days',
  NOW() - interval '1 day'
);

-- Project 5: Email Automation (building, in progress)
INSERT INTO planning_studio.projects (
  id, title, one_liner, status, current_phase,
  build_phase, build_total_phases, build_progress_percent,
  claude_code_command, github_repo,
  ready_to_build_at, build_started_at, created_at, updated_at
)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'Email Automation',
  'Automated email sequences for onboarding and retention campaigns',
  'building',
  'package',
  2,
  5,
  35,
  '/gsd:execute-phase 2 --project email-automation',
  'https://github.com/iaml/email-automation',
  NOW() - interval '7 days',
  NOW() - interval '3 days',
  NOW() - interval '21 days',
  NOW() - interval '4 hours'
);

-- Project 6: Landing Page Redesign (shipped/completed)
INSERT INTO planning_studio.projects (
  id, title, one_liner, status, current_phase,
  build_phase, build_total_phases, build_progress_percent,
  github_repo,
  ready_to_build_at, build_started_at, shipped_at, created_at, updated_at
)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  'Landing Page Redesign',
  'Modern, conversion-optimized landing page with A/B testing',
  'shipped',
  'package',
  3,
  3,
  100,
  'https://github.com/iaml/landing-page-v2',
  NOW() - interval '30 days',
  NOW() - interval '25 days',
  NOW() - interval '10 days',
  NOW() - interval '45 days',
  NOW() - interval '10 days'
);

-- ============================================
-- PHASES
-- 6 phases for each project
-- ============================================

-- Helper: Create all 6 phases for a project
-- Project 1: Mobile App Idea (only capture started)
INSERT INTO planning_studio.phases (project_id, phase_type, status, started_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'capture', 'in_progress', NOW() - interval '2 hours'),
  ('11111111-1111-1111-1111-111111111111', 'discover', 'not_started', NULL),
  ('11111111-1111-1111-1111-111111111111', 'define', 'not_started', NULL),
  ('11111111-1111-1111-1111-111111111111', 'develop', 'not_started', NULL),
  ('11111111-1111-1111-1111-111111111111', 'validate', 'not_started', NULL),
  ('11111111-1111-1111-1111-111111111111', 'package', 'not_started', NULL);

-- Project 2: AI Writing Assistant (capture complete, discover in progress)
INSERT INTO planning_studio.phases (project_id, phase_type, status, started_at, completed_at)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'capture', 'complete', NOW() - interval '5 days', NOW() - interval '4 days'),
  ('22222222-2222-2222-2222-222222222222', 'discover', 'in_progress', NOW() - interval '3 days', NULL),
  ('22222222-2222-2222-2222-222222222222', 'define', 'not_started', NULL, NULL),
  ('22222222-2222-2222-2222-222222222222', 'develop', 'not_started', NULL, NULL),
  ('22222222-2222-2222-2222-222222222222', 'validate', 'not_started', NULL, NULL),
  ('22222222-2222-2222-2222-222222222222', 'package', 'not_started', NULL, NULL);

-- Project 3: Customer Portal v2 (through develop, incubating)
INSERT INTO planning_studio.phases (project_id, phase_type, status, started_at, completed_at, incubation_ends_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'capture', 'complete', NOW() - interval '10 days', NOW() - interval '9 days', NULL),
  ('33333333-3333-3333-3333-333333333333', 'discover', 'complete', NOW() - interval '8 days', NOW() - interval '6 days', NULL),
  ('33333333-3333-3333-3333-333333333333', 'define', 'complete', NOW() - interval '5 days', NOW() - interval '3 days', NULL),
  ('33333333-3333-3333-3333-333333333333', 'develop', 'incubating', NOW() - interval '2 days', NULL, NOW() + interval '12 hours'),
  ('33333333-3333-3333-3333-333333333333', 'validate', 'not_started', NULL, NULL, NULL),
  ('33333333-3333-3333-3333-333333333333', 'package', 'not_started', NULL, NULL, NULL);

-- Project 4: Analytics Dashboard (all planning phases complete)
INSERT INTO planning_studio.phases (project_id, phase_type, status, started_at, completed_at, readiness_check_passed, readiness_notes)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'capture', 'complete', NOW() - interval '14 days', NOW() - interval '13 days', true, NULL),
  ('44444444-4444-4444-4444-444444444444', 'discover', 'complete', NOW() - interval '12 days', NOW() - interval '10 days', true, NULL),
  ('44444444-4444-4444-4444-444444444444', 'define', 'complete', NOW() - interval '9 days', NOW() - interval '7 days', true, NULL),
  ('44444444-4444-4444-4444-444444444444', 'develop', 'complete', NOW() - interval '6 days', NOW() - interval '4 days', true, NULL),
  ('44444444-4444-4444-4444-444444444444', 'validate', 'complete', NOW() - interval '3 days', NOW() - interval '2 days', true, NULL),
  ('44444444-4444-4444-4444-444444444444', 'package', 'complete', NOW() - interval '2 days', NOW() - interval '1 day', true, 'GSD package generated successfully');

-- Project 5: Email Automation (all planning phases complete, now building)
INSERT INTO planning_studio.phases (project_id, phase_type, status, started_at, completed_at, readiness_check_passed)
VALUES
  ('55555555-5555-5555-5555-555555555555', 'capture', 'complete', NOW() - interval '21 days', NOW() - interval '20 days', true),
  ('55555555-5555-5555-5555-555555555555', 'discover', 'complete', NOW() - interval '19 days', NOW() - interval '16 days', true),
  ('55555555-5555-5555-5555-555555555555', 'define', 'complete', NOW() - interval '15 days', NOW() - interval '12 days', true),
  ('55555555-5555-5555-5555-555555555555', 'develop', 'complete', NOW() - interval '11 days', NOW() - interval '9 days', true),
  ('55555555-5555-5555-5555-555555555555', 'validate', 'complete', NOW() - interval '8 days', NOW() - interval '7 days', true),
  ('55555555-5555-5555-5555-555555555555', 'package', 'complete', NOW() - interval '7 days', NOW() - interval '7 days', true);

-- Project 6: Landing Page Redesign (all complete, shipped)
INSERT INTO planning_studio.phases (project_id, phase_type, status, started_at, completed_at, readiness_check_passed)
VALUES
  ('66666666-6666-6666-6666-666666666666', 'capture', 'complete', NOW() - interval '45 days', NOW() - interval '44 days', true),
  ('66666666-6666-6666-6666-666666666666', 'discover', 'complete', NOW() - interval '43 days', NOW() - interval '40 days', true),
  ('66666666-6666-6666-6666-666666666666', 'define', 'complete', NOW() - interval '39 days', NOW() - interval '36 days', true),
  ('66666666-6666-6666-6666-666666666666', 'develop', 'complete', NOW() - interval '35 days', NOW() - interval '32 days', true),
  ('66666666-6666-6666-6666-666666666666', 'validate', 'complete', NOW() - interval '31 days', NOW() - interval '30 days', true),
  ('66666666-6666-6666-6666-666666666666', 'package', 'complete', NOW() - interval '30 days', NOW() - interval '30 days', true);

-- ============================================
-- DOCUMENTS
-- Sample documents for ready-to-build project
-- ============================================

INSERT INTO planning_studio.documents (project_id, doc_type, content, version, file_path)
VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    'icp',
    E'# Ideal Customer Profile: Analytics Dashboard\n\n## Target User\n- **Role:** Operations Manager, Business Analyst\n- **Company Size:** 10-100 employees\n- **Pain Points:**\n  - Manual data aggregation from multiple sources\n  - No real-time visibility into key metrics\n  - Difficulty sharing insights with team\n\n## Key Characteristics\n- Uses multiple SaaS tools (CRM, Analytics, Support)\n- Needs daily/weekly reporting\n- Values ease of use over complexity',
    1,
    '.planning/docs/ICP.md'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'gsd_project',
    E'# Analytics Dashboard\n\nReal-time business metrics dashboard with customizable widgets.\n\n## Goals\n1. Provide at-a-glance view of key business metrics\n2. Support custom widget configuration\n3. Enable data export and sharing\n\n## Non-Goals\n- Complex data transformations (use dedicated ETL)\n- Historical trend analysis beyond 90 days',
    1,
    '.planning/PROJECT.md'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'gsd_requirements',
    E'# Requirements: Analytics Dashboard\n\n## Functional Requirements\n\n### FR-1: Dashboard Layout\n- Grid-based layout with drag-and-drop widgets\n- Responsive design for tablet and desktop\n- Save/load layout configurations\n\n### FR-2: Widgets\n- Metric card (single number with trend)\n- Line chart (time series)\n- Bar chart (categorical comparison)\n- Table (detailed data view)\n\n### FR-3: Data Sources\n- Supabase direct connection\n- REST API integration\n- Manual data entry\n\n## Non-Functional Requirements\n- Dashboard load time < 2s\n- Real-time updates via subscriptions\n- Mobile-friendly (read-only)',
    1,
    '.planning/REQUIREMENTS.md'
  );

-- ============================================
-- SAMPLE CONVERSATIONS
-- For the AI Writing Assistant project (in discover)
-- ============================================

INSERT INTO planning_studio.conversations (
  id, project_id, phase_id, title, summary, started_at, ended_at, message_count
)
SELECT
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222',
  p.id,
  'Initial Discovery Session',
  'Explored the core problem space of email writing friction. User confirmed that tone matching and brevity are the biggest challenges. Decided to focus on professional email use cases first.',
  NOW() - interval '3 days',
  NOW() - interval '3 days' + interval '45 minutes',
  12
FROM planning_studio.phases p
WHERE p.project_id = '22222222-2222-2222-2222-222222222222'
  AND p.phase_type = 'discover';

-- ============================================
-- SAMPLE MEMORIES
-- For AI Writing Assistant project
-- ============================================

INSERT INTO planning_studio.memories (project_id, phase_id, memory_type, content, summary, metadata)
SELECT
  '22222222-2222-2222-2222-222222222222',
  p.id,
  'decision',
  'Focus on professional email use cases first (sales follow-ups, customer support replies, internal updates). Personal emails can be added later.',
  'Professional email focus first',
  '{"source": "discovery_conversation", "confidence": 0.9}'::jsonb
FROM planning_studio.phases p
WHERE p.project_id = '22222222-2222-2222-2222-222222222222'
  AND p.phase_type = 'discover';

INSERT INTO planning_studio.memories (project_id, phase_id, memory_type, content, summary, metadata)
SELECT
  '22222222-2222-2222-2222-222222222222',
  p.id,
  'insight',
  'Users struggle most with tone matching - they want to sound professional but not cold, friendly but not unprofessional. This is the core value proposition.',
  'Tone matching is core challenge',
  '{"source": "user_interview", "confidence": 0.95}'::jsonb
FROM planning_studio.phases p
WHERE p.project_id = '22222222-2222-2222-2222-222222222222'
  AND p.phase_type = 'discover';

INSERT INTO planning_studio.memories (project_id, memory_type, content, summary, metadata)
VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    'inspiration',
    'Grammarly''s tone detector shows the power of real-time writing feedback. Could adapt this for email-specific contexts.',
    'Grammarly tone detector inspiration',
    '{"source": "competitive_analysis"}'::jsonb
  );

-- Add a rejection reason memory to the mobile app (less compelling idea)
INSERT INTO planning_studio.memories (project_id, memory_type, content, summary, metadata)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'user_preference',
    'User mentioned this is more of a personal interest than a business priority. Would be fun to build but not urgent.',
    'Personal project, not business priority',
    '{"source": "capture_conversation"}'::jsonb
  );
