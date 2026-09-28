-- ============================================================================
-- Cap quyen admin cho mot tai khoan da dang ky.
--
-- KHONG phai migration: script nay can mot tai khoan CO SAN trong auth.users,
-- ma tai khoan do do nguoi that tao. De trong thu muc migrations thi moi lan
-- `supabase db push` deu that bai vi chua co user.
--
-- Cach dung:
--   1. Tao tai khoan: Supabase Dashboard -> Authentication -> Users -> Add user
--      (dien email + password, bat "Auto Confirm User").
--   2. Doi email ben duoi thanh email vua tao.
--   3. Dashboard -> SQL Editor -> dan noi dung file nay -> Run.
--      Hoac: supabase db execute --file supabase/scripts/grant-admin.sql
-- ============================================================================

do $$
declare
  target_email text := 'admin@tcauto.vn';   -- <<< DOI EMAIL NAY neu dung tai khoan khac
  target_id    uuid;
begin
  select id into target_id from auth.users where email = target_email;

  if target_id is null then
    raise exception
      'Chua co user % trong auth.users. Tao user o Authentication -> Users truoc.',
      target_email;
  end if;

  insert into public.admin_profiles (id, email, full_name, role, is_active)
  values (target_id, target_email, 'Quản trị viên', 'owner', true)
  on conflict (id) do update
    set role = 'owner', is_active = true, email = excluded.email;

  raise notice 'Da cap quyen owner cho % (%).', target_email, target_id;
end
$$;
