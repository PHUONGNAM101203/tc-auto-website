# Bảo mật & chống cào dữ liệu

Chốt ngày 02/10/2026 theo yêu cầu của khách: *"khi chuyển domain từ web đó sang
web chúng ta làm thì phải chặn không cho họ vào đây crawl dữ liệu nhiều như vậy
nhé, muốn crawl thì phải qua lớp bảo mật chuẩn mới được."*

Yêu cầu này đến từ một việc có thật: trong lúc đi tìm ảnh gốc, phiên làm việc
này đã mở hàng trăm kết nối song song tới `tcauto.vn`, và tường lửa của họ khoá
IP sau vài phút — **đúng như nó nên làm**. Trang mới phải làm được điều tương
tự.

## Những lớp đã có trong mã nguồn

| Lớp | Ở đâu | Chặn cái gì |
|---|---|---|
| Nhịp truy cập theo trang | `src/lib/crawl-guard.ts` + `src/proxy.ts` | 60 trang/phút cho mỗi IP |
| Từ chối máy cào SEO | `crawl-guard.ts` (`DENY`) | Ahrefs, Semrush, MJ12, DataForSEO… → **403** |
| Chống dò mật khẩu | `crawl-guard.ts` | 5 lần POST `/admin/login` trong 10 phút |
| Nhịp API | `src/app/api/{search,leads}/route.ts` | 60 và 5 lượt/phút |
| Bẫy spam biểu mẫu | `src/app/api/leads/route.ts` | trường `honeypot` |
| Khai báo ý định | `src/app/robots.ts` | mời Google/Bing/AI, cấm máy cào SEO |
| Nhóm header bảo mật | `next.config.ts` → `SECURITY_HEADERS` | CSP, HSTS, COOP/CORP, Permissions-Policy… |
| Chặn `/admin` khi chưa đăng nhập | `src/proxy.ts` | mọi tuyến `/admin/*` |

Kiểm nhanh (cần máy chủ ở cổng 3311):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "X-Forwarded-For: 203.0.113.9" \
  -A "AhrefsBot/7.0" http://127.0.0.1:3311/          # 403
for i in $(seq 1 80); do curl -s -o /dev/null -w "%{http_code} " \
  -H "X-Forwarded-For: 198.51.100.7" http://127.0.0.1:3311/giai-phap; done  # …429
```

Địa chỉ nội bộ (`127.*`, `10.*`, `192.168.*`, `172.16–31.*`) **được miễn trừ**.
Không phải cho tiện: chuỗi kiểm của dự án tự mở 156 lượt trang từ một địa chỉ,
tính cả chúng vào thì hạn mức phải nới cho vừa chuỗi kiểm thay vì vừa người
dùng — tức là vô nghĩa.

## Giới hạn thật của lớp trong mã — đọc kỹ

Bộ đếm nằm **trong bộ nhớ của từng instance**. Trên Vercel, mỗi vùng và mỗi lần
khởi động lạnh là một bộ đếm riêng, nên hạn mức thực tế **lỏng hơn** con số
khai báo. Nó chặn được đợt bắn nhanh từ một nguồn — đúng cái đã xảy ra — chứ
**không thay được tường lửa**.

Muốn chặt hơn nữa thì thay `src/lib/rate-limit.ts` bằng bộ đếm dùng chung
(Upstash Redis hoặc chính Supabase). Giao diện `rateLimit(key, limit, windowMs)`
giữ nguyên, nên chỉ phải sửa một tệp.

## Phải bật thêm trên Vercel (không làm bằng mã được)

Những mục dưới đây nằm ở bảng điều khiển, **chưa bật**:

1. **Firewall → Attack Challenge Mode** — bật khi bị cào mạnh. Mọi khách lạ
   phải qua một thử thách trình duyệt; người thật gần như không thấy gì.
2. **Firewall → Custom Rules** — chặn theo quốc gia / ASN / User-Agent ở biên,
   trước cả khi request chạm vào hàm. Đây mới là chỗ chặn rẻ nhất.
3. **Firewall → Rate Limiting** (gói Pro) — bộ đếm dùng chung ở biên, không bị
   chia nhỏ theo instance như lớp trong mã.
4. **Deployment Protection** — bật cho các bản xem trước, để bản nháp không bị
   lập chỉ mục.
5. **Log Drains / Observability** — để thấy được đợt cào, chứ không chỉ chặn.

## Khi đổi tên miền

- Đổi `SITE.url` trong `src/lib/site-config.ts` → `robots.txt`, `sitemap.xml`
  và mọi `canonical` tự bám theo.
- Giữ tên miền cũ trỏ sang bằng **301**, đừng xoá: mất hết liên kết đã có.
- Bật HSTS preload sau khi tên miền mới chạy ổn ít nhất một tuần — bật sớm mà
  phải lùi lại thì rất khó gỡ.
- Kiểm lại `Content-Security-Policy` trong `next.config.ts` nếu tên miền mới
  dùng CDN hay dịch vụ nhúng khác.
