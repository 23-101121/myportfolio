-- ============================================================================
-- contact_messages — stores messages sent from the website contact form.
--
-- HOW TO RUN: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.
--
-- Security model (Row Level Security):
--   * Anyone (anon) may INSERT a message.
--   * Nobody using the public key can SELECT / UPDATE / DELETE messages.
--   * Only the signed-in site admin (row in public.admin) can read them.
-- ============================================================================

create table if not exists public.contact_messages (
  id          bigint generated always as identity primary key,
  name        text        not null check (char_length(btrim(name)) between 2 and 80),
  email       text        not null check (char_length(email) <= 254
                                          and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'),
  subject     text        not null check (char_length(btrim(subject)) between 3 and 120),
  message     text        not null check (char_length(btrim(message)) between 10 and 2000),
  status      text        not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at  timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Column-level privileges: the public can only write these four columns,
-- so they can't set status/created_at themselves.
revoke all on public.contact_messages from anon, authenticated;
grant insert (name, email, subject, message) on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;

-- 1) Public: insert only
drop policy if exists "contact_messages_insert_public" on public.contact_messages;
create policy "contact_messages_insert_public"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (status = 'new');

-- 2) Admin only: read / update / delete
drop policy if exists "contact_messages_admin_select" on public.contact_messages;
create policy "contact_messages_admin_select"
  on public.contact_messages
  for select
  to authenticated
  using (exists (select 1 from public.admin a where a.auth_user_id = (select auth.uid())));

drop policy if exists "contact_messages_admin_update" on public.contact_messages;
create policy "contact_messages_admin_update"
  on public.contact_messages
  for update
  to authenticated
  using (exists (select 1 from public.admin a where a.auth_user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin a where a.auth_user_id = (select auth.uid())));

drop policy if exists "contact_messages_admin_delete" on public.contact_messages;
create policy "contact_messages_admin_delete"
  on public.contact_messages
  for delete
  to authenticated
  using (exists (select 1 from public.admin a where a.auth_user_id = (select auth.uid())));

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
