import { Card } from "./ui";

/**
 * Hien thi khi chua co bien moi truong Supabase.
 * Muc dich: /admin khong bao gio tra ve loi 500 mo ho — luon noi ro can lam gi.
 */
export function SetupNotice({ missing }: { missing: readonly string[] }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-display text-[11px] font-extrabold tracking-[0.18em] text-brand">
        TC AUTO · QUẢN TRỊ
      </p>
      <h1 className="mt-3 text-2xl font-semibold">Cần cấu hình Supabase</h1>
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        Trang public đã chạy bình thường bằng nội dung tĩnh từ Figma. Khu quản trị cần
        Supabase để lưu nội dung sửa, lead và media.
      </p>

      <div className="mt-8 space-y-4">
        <Card title="1. Điền biến môi trường" description="Tạo file .env.local ở gốc project.">
          <ul className="space-y-2">
            {missing.map((key) => (
              <li key={key} className="flex items-center gap-2 text-xs">
                <span className="text-brand-soft">✕</span>
                <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-white/85">
                  {key}
                </code>
                <span className="text-white/40">chưa có</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-white/45">
            Lấy giá trị tại Supabase Dashboard → Project Settings → API. Xem mẫu đầy đủ
            trong <code className="font-mono text-white/70">.env.example</code>.
          </p>
        </Card>

        <Card title="2. Chạy migration" description="Tạo bảng, RLS và Storage bucket.">
          <p className="text-xs leading-relaxed text-white/60">
            Mở Supabase Dashboard → SQL Editor → New query, dán lần lượt nội dung của:
          </p>
          <ul className="mt-3 space-y-1.5 text-xs font-mono text-white/80">
            <li>supabase/migrations/0001_init.sql</li>
            <li>supabase/migrations/0002_seed_admin.sql</li>
          </ul>
        </Card>

        <Card title="3. Tạo tài khoản quản trị">
          <p className="text-xs leading-relaxed text-white/60">
            Authentication → Users → Add user (bật <em>Auto Confirm User</em>), rồi sửa
            email trong <code className="font-mono text-white/80">0002_seed_admin.sql</code>{" "}
            cho khớp và chạy lại file đó.
          </p>
        </Card>
      </div>

      <p className="mt-8 text-xs text-white/35">
        Khởi động lại dev server sau khi sửa <code className="font-mono">.env.local</code>.
      </p>
    </main>
  );
}
