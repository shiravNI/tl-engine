-- ============================================================================
-- TL Engine — Supabase schema
--
-- HOW TO USE THIS FILE
--   Run this once, in full, in the Supabase SQL editor, right after creating
--   the project (Project Settings -> SQL Editor -> New query -> paste -> Run).
--   It is idempotent-ish for a fresh project but is NOT designed to be
--   re-run against a project that already has these objects — it will error
--   on "already exists" the second time. Take a fresh backup/snapshot before
--   editing anything here once real data exists.
--
--   After running this, copy Project Settings -> API -> Project URL and the
--   `anon` `public` key into this repo's `.env.local` as VITE_SUPABASE_URL /
--   VITE_SUPABASE_ANON_KEY. Never put the `service_role` key in this file,
--   in `.env.local`, or anywhere the client app can read it.
--
-- DESIGN NOTES (see /Users/shira.vilvovsky/.claude/plans/fancy-doodling-widget.md)
--   - Every user-owned table carries its own `user_id uuid references
--     auth.users(id)` and a flat `for all to authenticated using
--     ((select auth.uid()) = user_id) with check ((select auth.uid()) =
--     user_id)` RLS policy. RLS is the *sole* isolation mechanism — there
--     is no client-side manual filtering on top of it. `auth.uid()` is
--     wrapped in a `select` per Supabase's RLS performance guidance (lets
--     Postgres evaluate it once per statement instead of once per row),
--     and every `user_id` column is indexed for the same reason.
--   - Sign-up is restricted to @naturalint.com addresses, enforced inside
--     the `handle_new_user()` trigger below (raising an exception rejects
--     the signup outright — GoTrue surfaces this as a signup error).
--   - Every account starts genuinely empty. This file creates no seed/demo
--     rows for any table, by design.
--   - Deferred to a later migration (do not add here): `conversations` /
--     `chat_messages`, `posts` / `insight_snapshots`, `newsletter_issues`.
--     Because `posts` does not exist yet, `archive_entries` below only
--     unions `ideas` and `drafts` — add a third arm against `public.posts`
--     once that table ships.
-- ============================================================================

create extension if not exists pgcrypto; -- gives us gen_random_uuid()

-- ============================================================================
-- 1. Signup-provisioned singletons
--    (auto-created for every new user by the handle_new_user() trigger below)
-- ============================================================================

create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  name       text not null,
  initials   text not null,
  role       text not null default 'cast' check (role in ('director', 'cast')),
  title      text not null default '',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_owner" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.onboarding_state (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  current_phase_index int not null default 1,
  completed_at        timestamptz,
  skipped             boolean not null default false,
  updated_at          timestamptz not null default now()
);
alter table public.onboarding_state enable row level security;
create policy "onboarding_state_owner" on public.onboarding_state
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.streaks (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  current_weeks           int not null default 0,
  personal_best_weeks     int not null default 0,
  -- Last 16 weeks, oldest first; true = posted that week.
  weeks                   boolean[] not null default array_fill(false, array[16]),
  next_milestone_weeks    int not null default 1,
  next_milestone_deadline timestamptz,
  updated_at              timestamptz not null default now()
);
alter table public.streaks enable row level security;
create policy "streaks_owner" on public.streaks
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ============================================================================
-- 2. Onboarding
--    The phase/question *catalog* (titles, prompts, options) is intentionally
--    NOT a table — it stays a single shared TS constant on the client
--    (src/data/onboardingCatalog.ts), so the map page and interview page
--    read the exact same list instead of two independently-drifting ones.
-- ============================================================================

create table public.interview_answers (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  question_id        text not null,
  selected_option_id text,
  free_text_answer   text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, question_id)
);
alter table public.interview_answers enable row level security;
create policy "interview_answers_owner" on public.interview_answers
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- `unique (user_id, question_id)` above already gives user_id a leading
-- index; no separate index needed.

create table public.voice_cards (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  role_label          text not null default '',
  pov_fingerprint     text not null default '',
  completeness_pct    int not null default 0,
  completeness_note   text not null default '',
  updated_at          timestamptz not null default now()
);
alter table public.voice_cards enable row level security;
create policy "voice_cards_owner" on public.voice_cards
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.voice_card_opinions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  quote       text not null,
  placeholder boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.voice_card_opinions enable row level security;
create policy "voice_card_opinions_owner" on public.voice_card_opinions
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index voice_card_opinions_user_idx on public.voice_card_opinions (user_id, sort_order);

-- ============================================================================
-- 3. Core content (priority tier, built now)
-- ============================================================================

create table public.ideas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  text        text not null,
  pillar      text,
  source      text not null default 'manual',
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);
alter table public.ideas enable row level security;
create policy "ideas_owner" on public.ideas
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index ideas_user_archived_idx on public.ideas (user_id, archived_at);

create table public.drafts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null default '',
  -- Plain-paragraph body, kept in sync with the Tiptap editor's JSON doc.
  paragraphs       jsonb not null default '[]'::jsonb,
  excerpt          text not null default '',
  pillar           text,
  stage            text not null default 'draft',
  -- `'post'` (short-form, char-capped) or `'article'` (long-form) — same
  -- pipeline either way, only the composer's layout differs client-side.
  format           text not null default 'post' check (format in ('post', 'article')),
  bs_check         text not null default 'not_run',
  bs_check_note    text not null default '',
  voice_match      int not null default 0,
  ai_texture       int not null default 0,
  source_idea_id   uuid references public.ideas(id) on delete set null,
  source_type      text,
  source_label     text,
  image_url        text,
  image_file_name  text,
  checklist        jsonb not null default '{"hookEarnsSeeMore":false,"noLinksInBody":false,"visualAttached":false,"hashtagsAdded":false}'::jsonb,
  scheduled_for    timestamptz,
  published_at     timestamptz,
  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.drafts enable row level security;
create policy "drafts_owner" on public.drafts
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index drafts_user_stage_idx on public.drafts (user_id, stage);
create index drafts_source_idea_idx on public.drafts (source_idea_id);

create table public.tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text not null,
  done       boolean not null default false,
  due_pill   text,
  created_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "tasks_owner" on public.tasks
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index tasks_user_idx on public.tasks (user_id, created_at);

-- Shared read-only reference data — the badge *definitions* are the same
-- for every user, only per-user progress (user_badges) differs. There is
-- deliberately no insert/update/delete policy for regular users here: only
-- the select policy below, so authenticated users can read the catalog but
-- only the service_role (Supabase dashboard / a future admin tool) can
-- change it.
create table public.badge_catalog (
  id          text primary key,
  name        text not null,
  description text not null,
  icon        text,
  hidden      boolean not null default false,
  sort_order  int not null default 0
);
alter table public.badge_catalog enable row level security;
create policy "badge_catalog_read_all" on public.badge_catalog
  for select to authenticated using (true);

-- Seed data for the *catalog* only (every user reads the same 8 badge
-- definitions) — this is reference data, not per-user/demo content, so it
-- does not conflict with the "every account starts genuinely empty"
-- decision. No `user_badges` rows are seeded here; a brand-new account
-- reads this full catalog with nothing earned and no progress yet.
insert into public.badge_catalog (id, name, description, icon, hidden, sort_order) values
  ('badge_chain10', 'Chain of 10', '10 weeks straight.', 'flame', false, 1),
  ('badge_full_bucket', 'Full bucket', '10 ideas banked at once.', 'inbox', false, 2),
  ('badge_no_slop', 'No slop', '5 posts passed BS check first time.', 'shield', false, 3),
  ('badge_chain15', 'Chain of 15', 'Post consistently for 15 weeks.', 'trophy', false, 4),
  ('badge_100k', '100k reached', 'Reach 100,000 impressions.', 'eye', false, 5),
  ('badge_conversation', 'Conversation starter', 'Start 20 comment threads.', 'msg', false, 6),
  ('badge_amplifier', 'Amplifier', 'Boost 5 cohort posts.', 'users', false, 7),
  ('badge_hidden', 'Hidden badge', 'Unlocks at 20 weeks.', 'lock', true, 8);

create table public.user_badges (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  badge_id         text not null references public.badge_catalog(id) on delete cascade,
  earned           boolean not null default false,
  earned_at        timestamptz,
  progress_current int,
  progress_target  int,
  unique (user_id, badge_id)
);
alter table public.user_badges enable row level security;
create policy "user_badges_owner" on public.user_badges
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- `unique (user_id, badge_id)` above already indexes user_id; badge_id
-- (the other FK) still needs its own index for the catalog-side join.
create index user_badges_badge_idx on public.user_badges (badge_id);

create table public.video_items (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  format           text not null,
  stage            text not null default 'script',
  beats            jsonb,
  beats_summary    text,
  inspo_label      text,
  inspo_link       text,
  shoot_date       text,
  location         text,
  people           jsonb not null default '[]'::jsonb,
  editing_note     text,
  editing_progress int,
  posting_note     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.video_items enable row level security;
create policy "video_items_owner" on public.video_items
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index video_items_user_idx on public.video_items (user_id, stage);

create table public.carousel_decks (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  title              text not null,
  prompt             text not null default '',
  source_file_label  text,
  stage              text not null default 'drafting',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
alter table public.carousel_decks enable row level security;
create policy "carousel_decks_owner" on public.carousel_decks
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index carousel_decks_user_idx on public.carousel_decks (user_id);

create table public.carousel_slides (
  id        uuid primary key default gen_random_uuid(),
  -- Denormalized user_id (rather than joining through carousel_decks) so
  -- this table can use the exact same flat RLS policy as every other one.
  user_id   uuid not null references auth.users(id) on delete cascade,
  deck_id   uuid not null references public.carousel_decks(id) on delete cascade,
  index     int not null,
  kind      text not null,
  label     text not null,
  headline  text not null default '',
  has_chart boolean not null default false
);
alter table public.carousel_slides enable row level security;
create policy "carousel_slides_owner" on public.carousel_slides
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index carousel_slides_deck_idx on public.carousel_slides (deck_id, index);
create index carousel_slides_user_idx on public.carousel_slides (user_id);

create table public.contacts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  initials   text not null,
  specialty  text not null default '',
  created_at timestamptz not null default now()
);
alter table public.contacts enable row level security;
create policy "contacts_owner" on public.contacts
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index contacts_user_idx on public.contacts (user_id);

-- A dump of interesting links people find, usable later in a draft (lives
-- under Newsletter in the nav). Hard-delete only for v1 — no soft-archive
-- lifecycle, so unlike ideas/drafts it has no `archived_at` and no arm in
-- `archive_entries` below.
create table public.resources (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  url        text not null default '',
  title      text not null default '',
  note       text not null default '',
  pillar     text,
  tags       jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.resources enable row level security;
create policy "resources_owner" on public.resources
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Composite index deliberately (not just user_id) — matches both the
-- Newsletter card's "N most recent" query and the full ResourcesPage's
-- default sort, both ordered by (user_id, created_at desc).
create index resources_user_created_idx on public.resources (user_id, created_at desc);

-- ============================================================================
-- 4. handle_new_user() — signup provisioning + @naturalint.com restriction
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_local_part text;
  v_name       text;
  v_first      text;
  v_second     text;
  v_initials   text;
begin
  -- Locked decision: sign-up is restricted to @naturalint.com addresses.
  if new.email is null or new.email !~* '^[^@]+@naturalint\.com$' then
    raise exception 'Sign-up is restricted to @naturalint.com email addresses';
  end if;

  -- Derive a friendly default name/initials from the email local-part
  -- (e.g. "shira.vilvovsky@naturalint.com" -> "Shira Vilvovsky" / "SV").
  -- This is a reasonable default, not a substitute for a real profile
  -- editor (out of scope for this migration).
  v_local_part := split_part(new.email, '@', 1);
  v_name := initcap(replace(replace(v_local_part, '.', ' '), '_', ' '));
  v_first := split_part(v_name, ' ', 1);
  v_second := nullif(split_part(v_name, ' ', 2), '');
  v_initials := upper(
    coalesce(left(v_first, 1), '') ||
    coalesce(left(v_second, 1), left(v_first, 2))
  );

  insert into public.profiles (user_id, email, name, initials, role, title)
  values (new.id, new.email, v_name, v_initials, 'cast', '');

  insert into public.onboarding_state (user_id) values (new.id);

  insert into public.streaks (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 5. Archive — derived view, not a stored table
--
--    CRITICAL: `security_invoker = true` is required here. Postgres views
--    default to running with the *view owner's* privileges, which would
--    silently bypass every RLS policy above and leak every user's archived
--    rows to every other user. `security_invoker = true` makes the view
--    run as the querying user instead, so the underlying tables' RLS
--    policies apply exactly as if queried directly.
-- ============================================================================

create view public.archive_entries
with (security_invoker = true)
as
  select
    id::text as id,
    id::text as ref_id,
    'idea'::text as type,
    text as title,
    coalesce(archived_at, created_at) as last_touched,
    'Auto-archived idea'::text as reason
  from public.ideas
  where archived_at is not null

  union all

  select
    id::text as id,
    id::text as ref_id,
    'draft'::text as type,
    title,
    coalesce(archived_at, updated_at) as last_touched,
    'Archived draft'::text as reason
  from public.drafts
  where archived_at is not null;

-- NOTE: `posts` is explicitly deferred to phase 2 (analytics-derived data,
-- not user-authored — see the plan's "Explicitly deferred" section). Once
-- a `public.posts` table ships, add a third `union all` arm here selecting
-- its archived rows the same way.
