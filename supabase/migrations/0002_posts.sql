-- ============================================================================
-- Bai viet.
--
-- Ban thiet ke de san nhung o tieu de mau "TÊN BÀI VIẾT" — cho nay danh cho bai
-- viet that. Bang nay de admin tu them/sua bai ma khong can dung toi ma nguon.
--
-- Idempotent: chay lai nhieu lan an toan.
-- ============================================================================

create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text        not null unique,
  title        text        not null,
  excerpt      text,
  -- Noi dung dang van ban thuan, moi doan cach nhau mot dong trong.
  body         text        not null default '',
  cover_url    text,
  -- Muc trang con ma bai nay thuoc ve, vi du "cong-nghe/tien-phong-cong-nghe/bai-viet".
  section      text,
  status       text        not null default 'draft'
                           check (status in ('draft', 'published')),
  published_at timestamptz,
  source_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid        references auth.users (id) on delete set null
);

comment on table public.posts is
  'Bai viet do admin soan. Thay cho cac o "TÊN BÀI VIẾT" trong ban thiet ke.';

create index if not exists posts_status_idx    on public.posts (status, published_at desc);
create index if not exists posts_section_idx   on public.posts (section);

-- Tu cap nhat updated_at moi lan sua.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;

-- Khach chi doc duoc bai DA XUAT BAN; admin doc/ghi tat ca.
drop policy if exists posts_read_public on public.posts;
create policy posts_read_public on public.posts
  for select using (status = 'published');

drop policy if exists posts_read_admin on public.posts;
create policy posts_read_admin on public.posts
  for select using (public.is_admin());

drop policy if exists posts_write_admin on public.posts;
create policy posts_write_admin on public.posts
  for all using (public.is_admin()) with check (public.is_admin());
