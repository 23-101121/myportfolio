-- ============================================================================
-- Projects template migration
-- Makes `projects` hold everything the /project/:slug template needs, locks it
-- down to read-only for the public, creates the "projects" image bucket, and
-- seeds 5 projects with placeholder content you can edit later.
--
-- HOW TO RUN: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once (everything is "if not exists" / upsert).
-- Your existing columns (summary, description, thumbnail_url, status…) are
-- left untouched, so nothing that already uses them breaks.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1) Columns used by the template
-- ---------------------------------------------------------------------------
alter table public.projects
  add column if not exists title_accent_word text,
  add column if not exists tags              text[]  not null default '{}',
  add column if not exists year              integer,
  add column if not exists role              text,
  add column if not exists timeline          text,
  add column if not exists tools             text[]  not null default '{}',
  add column if not exists type              text,
  add column if not exists accent_color      text,
  add column if not exists cover_image       text,   -- path in the "projects" bucket, e.g. 'skoda-car-dashboard/cover.jpg'
  add column if not exists hero_image        text,
  add column if not exists hero_video        text,   -- bucket path or full https URL (mp4/webm)
  add column if not exists overview          text,
  add column if not exists statement         text,
  add column if not exists challenge         text,
  add column if not exists solution          text,
  add column if not exists result            text,
  add column if not exists stats             jsonb   not null default '[]'::jsonb,  -- [{ "value": "3s", "label": "…" }]
  add column if not exists gallery           jsonb   not null default '[]'::jsonb,  -- [{ "image": "slug/x.jpg", "caption": "…", "size": "full|half|third" }]
  add column if not exists process_words     text[]  not null default '{}',
  add column if not exists case_study_slug   text,
  add column if not exists sort_order        integer not null default 100,
  add column if not exists category          text,
  add column if not exists published         boolean not null default false;

-- Accent colour must look like #RRGGBB (or be empty)
alter table public.projects drop constraint if exists projects_accent_color_hex;
alter table public.projects add constraint projects_accent_color_hex
  check (accent_color is null or accent_color ~* '^#[0-9a-f]{6}$');

create unique index if not exists projects_slug_unique on public.projects (slug);
create index if not exists projects_published_sort_idx on public.projects (published, sort_order);

-- Existing rows that were already live stay live
update public.projects set published = true where published = false and status = 'published';

-- ---------------------------------------------------------------------------
-- 2) Row Level Security: the public can only READ published projects
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;

-- Remove old public (anon/public) policies on projects; admin (authenticated) policies are kept.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'projects'
      and roles && array['anon', 'public']::name[]
  loop
    execute format('drop policy %I on public.projects', p.policyname);
  end loop;
end $$;

revoke insert, update, delete on public.projects from anon;
grant select on public.projects to anon, authenticated;

create policy projects_public_read_published
  on public.projects
  for select
  to anon, authenticated
  using (published = true);

-- ---------------------------------------------------------------------------
-- 3) Storage: public "projects" bucket (one folder per project slug)
--    Public bucket = images are readable by URL. Nobody can upload with the
--    public key; upload through the dashboard (Storage → projects).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('projects', 'projects', true)
on conflict (id) do update set public = true;

-- ---------------------------------------------------------------------------
-- 4) Seed 5 projects (upsert by slug — re-running just refreshes them)
--    Image paths point at projects/<slug>/… — upload files with those names
--    and they appear automatically; until then the site shows placeholders.
-- ---------------------------------------------------------------------------
insert into public.projects (
  admin_id, status, slug, title, title_accent_word, summary, description,
  tags, year, role, timeline, tools, type, category, accent_color,
  cover_image, hero_image, hero_video, overview, statement, challenge, solution, result,
  stats, gallery, process_words, case_study_slug, sort_order, published
)
values
(
  (select admin_id from public.admin order by admin_id limit 1), 'published',
  'skoda-car-dashboard', 'Skoda Car Dashboard', 'Dashboard',
  'A dashboard that lets drivers glance, not stare.',
  'An in-car dashboard concept designed to reduce how much a driver needs to read while driving.',
  array['UI', 'Automotive', 'Dashboard'], 2026, 'UI/UX Designer', '4 weeks',
  array['Figma', 'After Effects', 'Illustrator'], 'Concept', 'Dashboards & Systems', '#2fbf71',
  'skoda-car-dashboard/cover.jpg', 'skoda-car-dashboard/hero.jpg', null,
  'An in-car dashboard concept for Skoda that puts the most important information at a glance and hides everything else until it is needed.',
  'A dashboard that lets drivers glance, not stare.',
  'Modern dashboards show too much at once. Drivers spend precious seconds reading menus instead of watching the road.',
  'A calm, layered interface: speed and navigation up front, secondary information one tap away, and a strict limit on what can be on screen while moving.',
  'A clearer hierarchy that testers understood in under three seconds per glance.',
  '[{"value":"<3s","label":"Average glance time"},{"value":"40%","label":"Less text on screen"},{"value":"12","label":"Screens designed"}]'::jsonb,
  '[{"image":"skoda-car-dashboard/gallery-1.jpg","caption":"Driving mode — only what matters","size":"full"},{"image":"skoda-car-dashboard/gallery-2.jpg","caption":"Navigation","size":"half"},{"image":"skoda-car-dashboard/gallery-3.jpg","caption":"Media","size":"half"}]'::jsonb,
  array['Research', 'Wireframes', 'Visual design', 'Prototype', 'Testing'],
  'skoda-car-dashboard', 1, true
),
(
  (select admin_id from public.admin order by admin_id limit 1), 'published',
  'wok-and-bowl-asian-food', 'Wok & Bowl Asian Food', 'Food',
  'Ordering noodles should feel as fast as the kitchen.',
  'A mobile ordering app for an Asian street-food restaurant.',
  array['UI', 'Mobile', 'Food'], 2026, 'UI/UX Designer', '3 weeks',
  array['Figma', 'Illustrator', 'Photoshop'], 'Mobile app', 'Mobile Apps', '#ff7a3d',
  'wok-and-bowl-asian-food/cover.jpg', 'wok-and-bowl-asian-food/hero.jpg', null,
  'A warm, appetite-first ordering experience: build your bowl, see it come together, and check out in a few taps.',
  'Ordering noodles should feel as fast as the kitchen.',
  'The old menu was a long PDF. Customers gave up before choosing toppings.',
  'A visual bowl builder with big food photography, smart defaults and a one-screen checkout.',
  'A menu that is fun to explore and quick to finish.',
  '[{"value":"3","label":"Taps to reorder"},{"value":"24","label":"Screens designed"}]'::jsonb,
  '[{"image":"wok-and-bowl-asian-food/gallery-1.jpg","caption":"Bowl builder","size":"half"},{"image":"wok-and-bowl-asian-food/gallery-2.jpg","caption":"Checkout","size":"half"},{"image":"wok-and-bowl-asian-food/gallery-3.jpg","caption":null,"size":"full"}]'::jsonb,
  array['Menu audit', 'User flows', 'Bowl builder', 'Visual design'],
  null, 2, true
),
(
  (select admin_id from public.admin order by admin_id limit 1), 'published',
  'egyptgo-transportation', 'EgyptGo Transportation', 'Transportation',
  'Getting around Egypt, in one calm app.',
  'A transport app that brings buses, metro and ride options together.',
  array['UI', 'Mobile', 'Travel'], 2026, 'UI/UX Designer', '3 weeks',
  array['Figma', 'Photoshop'], 'Mobile app', 'Mobile Apps', '#27b4d6',
  'egyptgo-transportation/cover.jpg', 'egyptgo-transportation/hero.jpg', null,
  'EgyptGo combines routes, live times and tickets so travellers and locals can plan a trip without switching apps.',
  'Getting around Egypt, in one calm app.',
  'Transport information is scattered across many sources and often only in one language.',
  'One bilingual journey planner with clear route cards and offline-friendly tickets.',
  'Faster trip planning with fewer steps.',
  '[]'::jsonb,
  '[{"image":"egyptgo-transportation/gallery-1.jpg","caption":"Route planner","size":"third"},{"image":"egyptgo-transportation/gallery-2.jpg","caption":"Live times","size":"third"},{"image":"egyptgo-transportation/gallery-3.jpg","caption":"Tickets","size":"third"}]'::jsonb,
  array['Research', 'Journey mapping', 'Wireframes', 'UI'],
  null, 3, true
),
(
  (select admin_id from public.admin order by admin_id limit 1), 'published',
  'project-4', 'Project 4', '4',
  'Placeholder project — edit me in Supabase.',
  'Placeholder project.',
  array['Branding', 'Identity'], 2025, 'Designer', '2 weeks',
  array['Illustrator'], 'Branding', 'Branding & Identity', '#8b5cf6',
  'project-4/cover.jpg', null, null,
  'Placeholder overview. Replace this text with a short introduction to the project.',
  'Placeholder statement — one bold sentence about the project.',
  null, null, null,
  '[]'::jsonb, '[]'::jsonb, '{}', null, 4, true
),
(
  (select admin_id from public.admin order by admin_id limit 1), 'published',
  'project-5', 'Project 5', '5',
  'Placeholder project — edit me in Supabase.',
  'Placeholder project.',
  array['Web', 'Frontend'], 2025, 'Designer & Developer', '3 weeks',
  array['HTML', 'CSS', 'JavaScript'], 'Website', 'Web Development', '#f2c94c',
  'project-5/cover.jpg', null, null,
  'Placeholder overview. Replace this text with a short introduction to the project.',
  'Placeholder statement — one bold sentence about the project.',
  null, null, null,
  '[]'::jsonb, '[]'::jsonb, '{}', null, 5, true
)
on conflict (slug) do update set
  title_accent_word = excluded.title_accent_word,
  tags = excluded.tags,
  year = excluded.year,
  role = excluded.role,
  timeline = excluded.timeline,
  tools = excluded.tools,
  type = excluded.type,
  category = excluded.category,
  accent_color = excluded.accent_color,
  cover_image = excluded.cover_image,
  hero_image = excluded.hero_image,
  hero_video = excluded.hero_video,
  overview = excluded.overview,
  statement = excluded.statement,
  challenge = excluded.challenge,
  solution = excluded.solution,
  result = excluded.result,
  stats = excluded.stats,
  gallery = excluded.gallery,
  process_words = excluded.process_words,
  case_study_slug = excluded.case_study_slug,
  sort_order = excluded.sort_order,
  published = excluded.published;

commit;
