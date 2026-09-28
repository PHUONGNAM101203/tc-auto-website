-- ============================================================================
-- TC Auto Solutions — schema khoi tao
--
-- Chay trong Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Idempotent: chay lai nhieu lan an toan.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Ho so quan tri (gan voi auth.users cua Supabase Auth)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text        not null,
  full_name   text,
  role        text        not null default 'editor'
                          check (role in ('owner', 'admin', 'editor', 'viewer')),
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.admin_profiles is
  'Nguoi dung duoc phep vao /admin. Chi co ban ghi o day moi qua duoc is_admin().';

-- ---------------------------------------------------------------------------
-- 2. Ghi de noi dung tung phan tu cua page spec
--    Toa do / style KHONG luu o day — chung den tu Figma va bat bien.
--    Admin chi duoc doi text (html) va link (href), hoac an phan tu.
-- ---------------------------------------------------------------------------
create table if not exists public.page_items (
  slug        text        not null,
  item_id     text        not null,
  html        text,
  href        text,
  hidden      boolean     not null default false,
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references auth.users (id) on delete set null,
  primary key (slug, item_id),
  constraint page_items_slug_valid check (
    slug in ('home', 'trai-nghiem', 'giai-phap', 'cong-nghe', 'dai-ly', 'nhan-su')
  ),
  constraint page_items_html_len check (html is null or char_length(html) <= 5000)
);

create index if not exists page_items_slug_idx on public.page_items (slug);

-- ---------------------------------------------------------------------------
-- 3. Lead tu form lien he
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null check (char_length(trim(name)) between 2 and 120),
  phone        text        not null check (char_length(trim(phone)) between 9 and 20),
  message      text        check (message is null or char_length(message) <= 2000),
  source_page  text        not null default '/',
  status       text        not null default 'new'
                           check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  note         text        check (note is null or char_length(note) <= 2000),
  user_agent   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx     on public.leads (status);
create index if not exists leads_phone_idx      on public.leads (phone);

-- ---------------------------------------------------------------------------
-- 4. Cai dat site (mot hang duy nhat)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id                serial  primary key check (id = 1),
  site_title        text    not null default 'TC Auto Solutions',
  site_description  text    not null default '',
  contact_phone     text    not null default '',
  contact_email     text    not null default '',
  contact_address   text    not null default '',
  motion_enabled    boolean not null default true,
  updated_at        timestamptz not null default now(),
  updated_by        uuid    references auth.users (id) on delete set null
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Thu vien media (metadata; file that nam trong Storage bucket 'media')
-- ---------------------------------------------------------------------------
create table if not exists public.media (
  id          uuid        primary key default gen_random_uuid(),
  path        text        not null unique,
  name        text        not null,
  mime_type   text        not null,
  bytes       bigint      not null check (bytes > 0),
  width       integer,
  height      integer,
  alt_text    text,
  created_at  timestamptz not null default now(),
  created_by  uuid        references auth.users (id) on delete set null
);

create index if not exists media_created_at_idx on public.media (created_at desc);

-- ---------------------------------------------------------------------------
-- 6. Nhat ky hoat dong
-- ---------------------------------------------------------------------------
create table if not exists public.activity_log (
  id          bigserial   primary key,
  actor_id    uuid        references auth.users (id) on delete set null,
  actor_email text,
  action      text        not null,
  entity      text        not null,
  entity_id   text,
  detail      jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);
create index if not exists activity_log_entity_idx     on public.activity_log (entity, entity_id);

-- ============================================================================
-- Ham tro giup
-- ============================================================================

-- Nguoi goi hien tai co phai admin dang hoat dong?
-- security definer + search_path co dinh de tranh bi chiem quyen qua schema gia.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.admin_profiles p
    where p.id = auth.uid()
      and p.is_active
  );
$$;

-- Tu dong cap nhat updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists leads_touch          on public.leads;
drop trigger if exists page_items_touch     on public.page_items;
drop trigger if exists settings_touch       on public.settings;
drop trigger if exists admin_profiles_touch on public.admin_profiles;

create trigger leads_touch          before update on public.leads
  for each row execute function public.touch_updated_at();
create trigger page_items_touch     before update on public.page_items
  for each row execute function public.touch_updated_at();
create trigger settings_touch       before update on public.settings
  for each row execute function public.touch_updated_at();
create trigger admin_profiles_touch before update on public.admin_profiles
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Row Level Security
--
-- Nguyen tac:
--   * anon  : CHI doc duoc noi dung cong khai (page_items, settings).
--             Khong doc duoc lead, media, nhat ky, ho so.
--   * admin : doc/ghi day du qua Supabase Auth.
--   * lead  : ghi vao BANG service_role tu /api/leads (bypass RLS) — khong mo
--             quyen insert cho anon de tranh spam ghi truc tiep vao DB.
-- ============================================================================

alter table public.admin_profiles enable row level security;
alter table public.page_items     enable row level security;
alter table public.leads          enable row level security;
alter table public.settings       enable row level security;
alter table public.media          enable row level security;
alter table public.activity_log   enable row level security;

-- admin_profiles ------------------------------------------------------------
drop policy if exists admin_profiles_select_self  on public.admin_profiles;
drop policy if exists admin_profiles_select_admin on public.admin_profiles;
drop policy if exists admin_profiles_write_admin  on public.admin_profiles;

create policy admin_profiles_select_self on public.admin_profiles
  for select to authenticated using (id = auth.uid());

create policy admin_profiles_select_admin on public.admin_profiles
  for select to authenticated using (public.is_admin());

create policy admin_profiles_write_admin on public.admin_profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- page_items ----------------------------------------------------------------
drop policy if exists page_items_read_public on public.page_items;
drop policy if exists page_items_write_admin on public.page_items;

create policy page_items_read_public on public.page_items
  for select to anon, authenticated using (true);

create policy page_items_write_admin on public.page_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- leads ---------------------------------------------------------------------
drop policy if exists leads_read_admin  on public.leads;
drop policy if exists leads_write_admin on public.leads;

create policy leads_read_admin on public.leads
  for select to authenticated using (public.is_admin());

create policy leads_write_admin on public.leads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- settings ------------------------------------------------------------------
drop policy if exists settings_read_public on public.settings;
drop policy if exists settings_write_admin on public.settings;

create policy settings_read_public on public.settings
  for select to anon, authenticated using (true);

create policy settings_write_admin on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- media ---------------------------------------------------------------------
drop policy if exists media_read_public on public.media;
drop policy if exists media_write_admin on public.media;

create policy media_read_public on public.media
  for select to anon, authenticated using (true);

create policy media_write_admin on public.media
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- activity_log --------------------------------------------------------------
drop policy if exists activity_log_read_admin on public.activity_log;

create policy activity_log_read_admin on public.activity_log
  for select to authenticated using (public.is_admin());
-- Ghi nhat ky chi qua service_role (khong co policy insert cho authenticated).

-- ============================================================================
-- Storage bucket cho media
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists media_object_read   on storage.objects;
drop policy if exists media_object_write  on storage.objects;

create policy media_object_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');

create policy media_object_write on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());
