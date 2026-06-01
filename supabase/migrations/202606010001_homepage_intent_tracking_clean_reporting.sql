-- Homepage intent tracking for IAML Program Finder and route modules
-- Clean reporting schema for quiz sessions, answer events, route clicks, and aggregate views.

create extension if not exists pgcrypto;

create table if not exists public.homepage_quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  completed boolean not null default false,
  current_step_reached integer not null default 1,
  source_url text,
  page_path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  device_type text,
  browser_family text,
  user_agent text,
  ip_address inet,
  ip_hash text,
  geo_country text,
  geo_region text,
  geo_city text,
  answers jsonb not null default '{}'::jsonb,
  recommended_program_slug text,
  secondary_program_slug text,
  recommended_track text,
  recommended_format text,
  recommendation_confidence numeric(5,2),
  cta_shown text,
  cta_clicked text,
  lead_id text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.homepage_quiz_answers (
  id bigserial primary key,
  session_id uuid not null references public.homepage_quiz_sessions(id) on delete cascade,
  step_number integer not null,
  question_key text not null,
  answer_key text not null,
  answer_label text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.homepage_route_clicks (
  id bigserial primary key,
  anonymous_id text,
  quiz_session_id uuid references public.homepage_quiz_sessions(id) on delete set null,
  route_key text not null,
  route_label text,
  destination_url text,
  source_url text,
  page_path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  device_type text,
  browser_family text,
  user_agent text,
  ip_address inet,
  ip_hash text,
  geo_country text,
  geo_region text,
  geo_city text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_homepage_quiz_sessions_started_at on public.homepage_quiz_sessions(started_at desc);
create index if not exists idx_homepage_quiz_sessions_anonymous_id on public.homepage_quiz_sessions(anonymous_id);
create index if not exists idx_homepage_quiz_sessions_completed on public.homepage_quiz_sessions(completed, started_at desc);
create index if not exists idx_homepage_quiz_sessions_recommendation on public.homepage_quiz_sessions(recommended_program_slug, started_at desc);
create index if not exists idx_homepage_quiz_sessions_answers on public.homepage_quiz_sessions using gin(answers);
create index if not exists idx_homepage_quiz_answers_session_step on public.homepage_quiz_answers(session_id, step_number);
create index if not exists idx_homepage_quiz_answers_question_answer on public.homepage_quiz_answers(question_key, answer_key, created_at desc);
create index if not exists idx_homepage_route_clicks_created_at on public.homepage_route_clicks(created_at desc);
create index if not exists idx_homepage_route_clicks_route_key on public.homepage_route_clicks(route_key, created_at desc);
create index if not exists idx_homepage_route_clicks_session on public.homepage_route_clicks(quiz_session_id);

alter table public.homepage_quiz_sessions enable row level security;
alter table public.homepage_quiz_answers enable row level security;
alter table public.homepage_route_clicks enable row level security;

-- Server-side API uses service role and bypasses RLS. Do not expose broad anon read policies.

create or replace function public.set_homepage_intent_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_homepage_quiz_sessions_updated_at on public.homepage_quiz_sessions;
create trigger trg_homepage_quiz_sessions_updated_at
before update on public.homepage_quiz_sessions
for each row execute function public.set_homepage_intent_updated_at();

-- Session-level reporting view: one row per quiz start with clean lifecycle and attribution fields.
create or replace view public.homepage_quiz_session_report as
select
  s.id,
  s.anonymous_id,
  s.started_at,
  s.updated_at,
  s.completed_at,
  s.completed,
  extract(epoch from coalesce(s.completed_at, s.updated_at) - s.started_at)::integer as seconds_active,
  s.current_step_reached,
  count(a.id)::integer as answer_events,
  count(distinct a.question_key)::integer as distinct_questions_answered,
  s.recommended_program_slug,
  s.secondary_program_slug,
  s.recommended_track,
  s.recommended_format,
  s.recommendation_confidence,
  s.cta_shown,
  s.cta_clicked,
  s.answers,
  s.source_url,
  s.page_path,
  s.referrer,
  s.utm_source,
  s.utm_medium,
  s.utm_campaign,
  s.utm_term,
  s.utm_content,
  s.device_type,
  s.browser_family,
  s.geo_country,
  s.geo_region,
  s.geo_city,
  s.lead_id,
  s.metadata
from public.homepage_quiz_sessions s
left join public.homepage_quiz_answers a on a.session_id = s.id
group by s.id;

-- Daily funnel rollup for dashboard/reporting use.
create or replace view public.homepage_quiz_funnel_daily as
select
  date_trunc('day', started_at)::date as day,
  coalesce(utm_source, '(direct/unknown)') as utm_source,
  coalesce(utm_medium, '(none/unknown)') as utm_medium,
  coalesce(utm_campaign, '(none)') as utm_campaign,
  count(*)::integer as sessions_started,
  count(*) filter (where current_step_reached >= 2)::integer as reached_step_2,
  count(*) filter (where current_step_reached >= 3)::integer as reached_step_3,
  count(*) filter (where current_step_reached >= 4)::integer as reached_step_4,
  count(*) filter (where completed)::integer as sessions_completed,
  round(100.0 * count(*) filter (where completed) / nullif(count(*), 0), 1) as completion_rate_pct,
  count(*) filter (where cta_clicked is not null)::integer as cta_clicks
from public.homepage_quiz_sessions
group by 1,2,3,4
order by day desc, sessions_started desc;

-- Recommendation rollup by program path.
create or replace view public.homepage_quiz_recommendation_daily as
select
  date_trunc('day', started_at)::date as day,
  coalesce(recommended_program_slug, '(none)') as recommended_program_slug,
  coalesce(recommended_track, '(none)') as recommended_track,
  coalesce(recommended_format, '(none)') as recommended_format,
  count(*)::integer as sessions,
  count(*) filter (where completed)::integer as completed_sessions,
  round(avg(recommendation_confidence)::numeric, 2) as avg_recommendation_confidence
from public.homepage_quiz_sessions
group by 1,2,3,4
order by day desc, sessions desc;

-- Route-click rollup for hero/start-here/final-CTA routing cards.
create or replace view public.homepage_route_click_daily as
select
  date_trunc('day', created_at)::date as day,
  coalesce(route_key, '(unknown)') as route_key,
  coalesce(route_label, '(unlabeled)') as route_label,
  coalesce(destination_url, '(none)') as destination_url,
  coalesce(utm_source, '(direct/unknown)') as utm_source,
  coalesce(utm_medium, '(none/unknown)') as utm_medium,
  coalesce(utm_campaign, '(none)') as utm_campaign,
  count(*)::integer as clicks,
  count(distinct quiz_session_id)::integer as linked_quiz_sessions,
  count(distinct anonymous_id)::integer as anonymous_visitors
from public.homepage_route_clicks
group by 1,2,3,4,5,6,7
order by day desc, clicks desc;
