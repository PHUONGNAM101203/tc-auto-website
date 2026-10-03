# Chuyển sang tài khoản webanam

Chốt ngày 03/10/2026. Ba thứ đổi cùng lúc: **GitHub**, **Vercel**, **Supabase**.
Bản cũ (`PHUONGNAM101203`) **giữ chạy song song**, không xoá gì.

## Nguyên tắc không được phá

1. **Hai tài khoản Vercel phải tách biệt.** Mọi lệnh `vercel` đều kèm
   `--global-config`, không bao giờ gọi trần:

   ```
   bản cũ   →  vercel --global-config ~/.vercel-tc-auto   …
   bản mới  →  vercel --global-config ~/.vercel-webanam   …
   ```

   Gọi trần một lần là ghi đè phiên đăng nhập của phiên khác và deploy nhầm
   tài khoản.

2. **`.env.local` và `.env.example` không bao giờ lên git.** Đã chặn bằng
   `.env*` trong `.gitignore` — kiểm lại bằng `git ls-files | grep env`.

3. **`.backup/` cũng không lên git.** Nó chứa 504 dòng khách hàng tiềm năng
   với tên và số điện thoại thật.

## Việc chỉ anh làm được

Những bước dưới cần mật khẩu hoặc trình duyệt của anh. Gõ `!` trước lệnh để
chạy ngay trong phiên này:

```
!gh auth login                         # chọn tài khoản webanam
!vercel --global-config ~/.vercel-webanam login
!supabase login
```

`gh` giữ được **nhiều tài khoản cùng lúc**; đổi qua lại bằng:

```
!gh auth switch --user <tên-tài-khoản>
```

## Thứ tự làm

### 1. Kho mã nguồn

`origin` chuyển sang kho mới, kho cũ giữ lại làm bản lưu dưới tên `cu`:

```
git remote rename origin cu
git remote add origin https://github.com/<webanam>/<repo>.git
git push -u origin main
```

Sau đó `git push` đi webanam. Muốn cập nhật cả bản cũ thì `git push cu main`.

> Bản Vercel cũ nối với **kho cũ**, nên sau khi đổi `origin` nó sẽ dừng ở
> commit hiện tại chứ không tự cập nhật nữa. Đó là điều mong muốn khi "giữ
> chạy song song"; muốn cả hai cùng tiến thì phải đẩy sang cả hai kho.

### 2. Supabase mới

Lược đồ đã có sẵn trong kho — không dựng tay:

```
!supabase link --project-ref <ref-moi>      # hỏi mật khẩu cơ sở dữ liệu
supabase db push                            # chạy 0001_init + 0002_posts
```

Tạo kho ảnh: Dashboard → Storage → New bucket → tên `media`, bật Public.

Tạo tài khoản quản trị: Dashboard → Authentication → Users → Add user
(bật **Auto Confirm User**), rồi sửa email trong
`supabase/scripts/grant-admin.sql` và chạy nó ở SQL Editor.

> `admin_profiles` **không chuyển được** từ dự án cũ: khoá chính của nó trỏ
> vào `auth.users`, mà người dùng bên mới có `id` khác hẳn.

### 3. Chuyển dữ liệu

Bản xuất đã nằm sẵn ở `.backup/supabase-cu.json` (5 bài viết, 1 cài đặt,
6 dòng nhật ký, 504 khách tiềm năng).

```
NEW_SUPABASE_URL=https://<ref-moi>.supabase.co \
NEW_SUPABASE_SERVICE_ROLE_KEY=<khoá service role mới> \
node tools/migrate-supabase.mjs --dry       # xem trước, không ghi
```

Bỏ `--dry` để nạp thật. Thêm `--leads` nếu muốn chuyển cả 504 khách tiềm
năng — **mặc định bỏ qua**, vì chuyển dữ liệu cá nhân sang một hệ thống khác
phải là quyết định có ý.

Các cột `updated_by` / `created_by` / `actor_id` được **xoá về rỗng**: chúng
trỏ vào người dùng của dự án cũ, để nguyên là trỏ sai.

### 4. Đổi biến môi trường

Sửa `.env.local` (tệp này không lên git):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref-moi>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key mới>
SUPABASE_SERVICE_ROLE_KEY=<service role key mới>
```

Rồi nạp lên Vercel webanam:

```
!vercel --global-config ~/.vercel-webanam env add NEXT_PUBLIC_SUPABASE_URL production
!vercel --global-config ~/.vercel-webanam env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
!vercel --global-config ~/.vercel-webanam env add SUPABASE_SERVICE_ROLE_KEY production
```

Thiếu `NEXT_PUBLIC_SITE_URL` thì `robots.txt`, `sitemap.xml` và mọi thẻ
`canonical` sẽ trỏ sai tên miền — đặt luôn.

### 5. Nối Vercel webanam với kho mới

```
!vercel --global-config ~/.vercel-webanam link
!vercel --global-config ~/.vercel-webanam git connect
```

`git connect` đọc `origin` của kho, nên **phải làm sau bước 1**. Tài khoản
Vercel webanam cần được cấp quyền đọc kho GitHub của webanam (Vercel sẽ mở
trang cấp quyền).

### 6. Kiểm trước khi coi là xong

```
npm run verify
npm run verify:live
```

Rồi mở bản deploy và kiểm ba thứ mà chỉ cơ sở dữ liệu mới quyết định:

- `/cong-nghe/tien-phong-cong-nghe/bai-viet` — phải thấy **5 bài thật**, không
  còn ô nào ghi "TÊN BÀI VIẾT";
- `/admin` — đăng nhập được bằng tài khoản quản trị mới;
- form liên hệ — gửi thử một lượt, kiểm xem có vào bảng `leads` không.

### 7. Bảo mật — đừng quên

Lớp chặn cào trong mã đi theo kho nên tự có. Nhưng **WAF của Vercel là cấu
hình theo từng dự án**: bản webanam là dự án MỚI nên chưa bật gì cả. Xem
`docs/SECURITY.md` mục "Phải bật thêm trên Vercel".
