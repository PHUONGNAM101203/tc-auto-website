# TC Auto Solutions — Website + Trang quản trị

Website dựng lại **chính xác tuyệt đối** từ prototype Figma (`TCAUTO`, 6 frame ·
canvas 1440px), cộng thêm một lớp hiệu ứng hiện đại và một khu quản trị đầy đủ.

> **Cam kết cốt lõi:** giao diện không lệch **một pixel nào** so với prototype.
> Điều này được **đo tự động**, không phải nhận định bằng mắt — xem
> [Kiểm chứng độ chính xác](#kiểm-chứng-độ-chính-xác).

---

## Trạng thái hiện tại

| Hạng mục | Trạng thái |
|---|---|
| 6 trang chính, pixel-perfect | ✅ lệch **0 pixel** cả 6 trang |
| **31 trang con** | ✅ lệch tối đa **0,002%** so với PNG thiết kế |
| Ảnh độ phân giải gốc | ✅ `srcset` @2x/@3x — retina lấy đúng bản @3x |
| Tải ảnh theo lượt cuộn | ✅ vào trang **2 ảnh**, cuộn tới đâu tải tới đó |
| Bộ nhận diện | ✅ favicon + 5 biến thể logo trích từ Design System |
| Tìm kiếm đại lý | ✅ 16 đại lý thật từ thiết kế |
| Lớp hiệu ứng | ✅ 13 hiệu ứng, kết thúc đúng trạng thái thiết kế |
| Tìm kiếm toàn site (không cần dấu) | ✅ phủ cả 37 trang |
| Form liên hệ → Supabase | ✅ trên cả 37 trang (cần điền `.env.local`) |
| Trang quản trị | ✅ 7 module |
| SEO | ✅ sitemap 37 URL, robots, metadata + canonical từng trang |
| Trang 404 + trang lỗi | ✅ theo đúng token thương hiệu |
| Security headers | ✅ CSP, HSTS, nosniff, frame-deny, Permissions-Policy |
| Băng hero | ✅ 5 slide chạy được (4 ảnh tạm — xem [Băng hero](#băng-hero-trang-chủ)) |
| Phân trang | ✅ 10 trang · **tính theo dữ liệu**, không hardcode |
| Thẻ bấm chuyển mục | ✅ 3 thẻ trên trang Công nghệ |
| Nút XEM THÊM | ✅ 47 nút bấm được |
| Mọi trang bấm tới được | ✅ **37/37** |
| Unit test | ✅ 187 test · coverage 96,0% statements |
| E2E test | ✅ 76 test |

---

## Bắt đầu

```bash
npm install --ignore-scripts    # npm 11 chặn --allow-scripts trong project-scoped install
cp .env.example .env.local      # rồi điền giá trị từ Supabase
npm run dev                     # http://localhost:3000
```

Website public **chạy được ngay không cần Supabase** (nội dung đến từ page spec
tĩnh). Supabase chỉ cần cho: lưu lead từ form, và khu `/admin`.

### Cấu hình Supabase

1. Tạo project tại [supabase.com](https://supabase.com).
2. Điền 3 biến trong `.env.local` (lấy ở **Project Settings → API**):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`.
3. **SQL Editor** → chạy `supabase/migrations/0001_init.sql` (bảng + RLS + Storage bucket).
4. **Authentication → Users → Add user** (bật *Auto Confirm User*).
5. Sửa email trong `supabase/migrations/0002_seed_admin.sql` cho khớp rồi chạy file đó.
6. Đăng nhập tại `/admin/login`.

Chưa làm bước nào thì `/admin` hiện đúng hướng dẫn còn thiếu — không bao giờ lỗi 500.

---

## Hai loại trang

| | 6 trang chính | 31 trang con |
|---|---|---|
| Nguồn | `TC-Auto-Website-Prototype.html` (export Figma) | PNG @3x trong `[TC] Website/Website_TC` |
| Chữ | phần tử DOM thật, chọn/copy được | nằm trong ảnh |
| Độ chính xác | **0 pixel** | **0,002%** (nhiễu nén WebP) |
| Sửa nội dung | qua admin | sửa Figma → export → `npm run parse:subpages` |
| SEO / tìm kiếm | text thật | lớp text trích bằng OCR |

## Kiến trúc: vì sao giữ được pixel-perfect

Prototype Figma là một **canvas tuyệt đối 1440px**: ảnh nền liền mạch, chữ và nút
xếp lên trên theo toạ độ chính xác. Dựng lại bằng component "responsive" thông
thường sẽ **thay đổi thiết kế** — điều bị cấm. Nên kiến trúc đi theo đúng bản chất đó:

```
TC-Auto-Website-Prototype.html   (export từ Figma, 5MB, ảnh+font nhúng base64)
            │
            │  tools/parse-prototype.py        ← chạy lại: npm run parse:prototype
            ▼
   ┌────────────────────────────────────────────┐
   │ public/slices/*.webp   30 lát nền @2x      │
   │ public/fonts/*.woff2   15 subset, có VN    │
   │ src/styles/fonts.css   @font-face gốc      │
   │ src/data/pages/*.json  120 phần tử + toạ độ│
   └────────────────────────────────────────────┘
            │
            │  zod xác thực ngay khi import (src/lib/page-spec-schema.ts)
            │  → parser sinh sai thì BUILD ĐỔ, không để render lệch
            ▼
   PageShell → CanvasSlices + SiteHeader + CanvasItem[] + ContactForm
```

**Nguyên tắc bất di bất dịch**

- `src/styles/canvas.css` là **bản sao y nguyên** CSS của prototype. Khối giữa
  `/* === PROTOTYPE === */` và `/* === END PROTOTYPE === */` **không được sửa**.
- Toạ độ, kích thước, font, màu **chỉ** đến từ Figma. Admin sửa được chữ và link,
  không sửa được hình học.
- Thứ tự import CSS trong `globals.css` là **bắt buộc**:
  `tailwind → reset → fonts → canvas → motion`. Đặt reset sau canvas sẽ ghi đè
  `padding` gốc (`.search` 22px, `.nv` 12px, `.ff input` 17px) và làm lệch pixel.

### Co giãn responsive

`--tc-zoom = clientWidth / 1440` được đặt bởi một script inline **trước khi canvas
được parse** (không FOUC, không layout shift), rồi `.tc-canvas { zoom: var(--tc-zoom) }`.

Dùng CSS `zoom` thay vì `transform: scale()` vì zoom **relayout lại chữ** nên nét ở
mọi tỉ lệ, và chiều cao trang tự đúng theo tỉ lệ.

> ⚠️ Thiết kế Figma **chỉ có frame desktop 1440px** — không có frame mobile. Trên
> điện thoại canvas được thu vừa bề ngang (tỉ lệ ~0,27) nên chữ rất nhỏ; đã bật
> pinch-zoom để bù. Muốn có trải nghiệm mobile thật thì **cần frame mobile từ Figma** —
> tự thiết kế lại sẽ là *thay đổi giao diện*, việc đã bị cấm.

---

## Lớp hiệu ứng

Nằm hoàn toàn trong `src/styles/motion.css` + `src/components/motion/MotionLayer.tsx`.

**Bất biến:** trạng thái **kết thúc** của mọi hiệu ứng phải trùng khớp 100% thiết kế
Figma (`opacity: 1`, `transform: none`, `clip-path: none`). Có E2E test canh đúng điều này.

1. Reveal khi cuộn — fade + trượt, so le 70ms theo thứ tự từ trên xuống
2. Lát nền — wipe `clip-path` từ dưới lên, **vị trí không đổi** (nên chữ luôn khớp nền)
3. Tiêu đề — wipe theo từng dòng, so le 110ms
4. Nút — sheen quét chéo + nhấc 2px + đổ bóng đỏ
5. Nav — gạch chân chạy từ giữa, mũi `›` trượt phải
6. Thanh tiến độ cuộn (2px, gradient đỏ)
7. Chuyển trang — màn navy quét lên
8. Con trỏ vòng tròn (chỉ thiết bị có chuột thật)
9. Màn chờ tải trang, tự ẩn (chặn trên 2,2s)
10. Form — glow khi focus, trạng thái đang gửi, toast
11. Logo — nhấn nhẹ khi hover
12. Popover tìm kiếm — fade + trượt
13. Cuộn mượt + nhảy tới phần tử từ kết quả tìm kiếm

Tất cả tôn trọng `prefers-reduced-motion: reduce` (hiện ngay trạng thái cuối, tắt
con trỏ/thanh tiến độ/màn chuyển trang).

### Cạm bẫy đã xử lý: `clip-path` phá IntersectionObserver

Chrome áp `clip-path` của chính element vào phép tính rect giao của
IntersectionObserver. Phần tử đang `clip-path: inset(0 0 100% 0)` có rect giao
**rỗng tuyệt đối** → **không bao giờ** được báo là intersecting → nội dung vô hình
mãi mãi.

Cách xử lý: quan sát một khối cha **không bị clip** (`[data-reveal-group]`), rồi mới
bật `is-in` cho các con. Kèm lưới an toàn khi cuộn tới đáy trang, vì `rootMargin`
âm (`-12%`) khiến dải cuối khung nhìn không bao giờ vào vùng trigger — lát nền cuối
của `/dai-ly` chỉ cao 77px và đã từng bị kẹt vì lý do này.

---

## 31 trang con

Thiết kế trang con chỉ có dạng **PNG đã render** (không có toạ độ + text như prototype
HTML), nên dựng theo cách khác:

```
PNG @3x (4320px, 1.0 GB)
      │  tools/build-subpages.py        ← npm run parse:subpages
      ▼
public/slices/sub/*.webp   135 lát @2x · 21 MB
src/data/subpages/*.json   chiều cao, lát nền, nav, form, breadcrumb
```

Trên nền ảnh là **lớp ghost**: header, ô tìm kiếm và form liên hệ thật được đặt
đúng toạ độ nhưng **trong suốt khi nhàn rỗi** — người dùng thấy đúng pixel thiết kế.
Chỉ khi hover / focus / gõ chữ thì chúng mới hiện ra để dùng được thật.

Hằng số then chốt: **form liên hệ luôn ở `height − 123px`** trên cả 37 trang. Xác minh
trên 6 trang chính (3566−3443, 5977−5854… đều bằng 123) rồi đối chiếu với frame trang
con bằng cách vẽ đè khung lên ảnh.

### Nút bấm vẽ sẵn trong ảnh

Nút CTA nằm trong ảnh nên không bấm được. `tools/detect-buttons.py` dò chúng bằng
màu nhấn chính xác `#C22326`, rồi phủ vùng bấm trong suốt lên trên.

Detector được **kiểm chứng trên 6 trang chính** — nơi đã biết toạ độ thật từ prototype:

```
npm run verify:buttons   →  khớp 25/25 nút, 0 vùng đỏ thừa, lệch ±1px
```

Hai cạm bẫy đã xử lý: chữ **trắng** trên nút khoét thủng vùng đỏ (chỉ 59% pixel là đỏ,
đôi khi cắt đứt liên thông → phải lấp kín khoảng trống theo hàng trước khi gom vùng);
và chữ **nhãn mục** cũng màu đỏ nhưng chỉ cao 22px so với nút 34px.

### Lớp văn bản cho SEO và tìm kiếm

Trang là ảnh nên với Google nó **rỗng**. `tools/ocr/OCR.swift` (Vision framework của
macOS, tiếng Việt) trích 3.047 khối text → lọc header/footer → **2.233 khối, 79.949 ký
tự**, đặt trong `.tc-sr` (ẩn với mắt thường, đọc được với screen reader và Google),
đồng thời nạp vào chỉ mục tìm kiếm.

> ⚠️ Đây là kết quả **nhận dạng**, không phải bản gốc do người nhập. Chữ trong logo
> cách điệu có thể đọc sai (`3M` → `ЗМ`). Vì vậy nó **không bao giờ vẽ đè lên thiết kế** —
> chỉ dùng cho SEO, trình đọc màn hình và tìm kiếm.

### Nối nút trang chính → trang con

Trong prototype, các nút CTA của trang chính đều là `javascript:void(0)` (lúc đó chưa
có thiết kế trang con). `src/lib/link-map.ts` nối 18 nút này tới đúng trang con, suy ra
từ **nhãn mục đặt ngay trên mỗi nút**. Hai nút cố ý để trống vì chưa có trang tương ứng
(Bảo hành, Không gian trải nghiệm) — được liệt kê tường minh và có test canh.

## Ảnh: độ phân giải gốc + tải theo lượt cuộn

Mỗi lát nền được xuất **hai bản** và khai bằng `srcset`:

```html
<img srcset="…-0.webp 2x, …-0@3x.webp 3x" width="1440">
```

Màn thường tải bản @2x, màn retina tải **@3x — đúng độ phân giải gốc của thiết kế**.
Tổng: @2x 21,0 MB · @3x 35,8 MB (WebP nén phần chi tiết rất tốt, chỉ hơn 1,7×).

**Chỉ lát đầu tiên được tải khi vào trang.** Các lát sau để trống `src` và chỉ được
gán khi cuộn gần tới (`IntersectionObserver`, lề 600px). Không có JavaScript thì
`<noscript>` vẫn hiện đủ ảnh.

Kết quả đo (`npm run verify:lazy`):

| | Vào trang | Cuộn hết |
|---|---|---|
| Trang chủ @1x | 2 ảnh · 0,42 MB | 4 ảnh · 0,66 MB |
| Trang chủ @3x | 2 ảnh · 1,11 MB | 4 ảnh · 1,78 MB |
| Bài dài nhất (10 lát) @2x | 2 ảnh · 0,40 MB | 10 ảnh · 1,93 MB |

Ba thứ đã sửa để hết giật, mỗi thứ đều là một cái bẫy thật:

1. **`will-change` đặt sẵn trên mọi lát** tạo hàng chục layer GPU cỡ 4320px cùng lúc.
   Giờ chỉ bật trong lúc animation chạy (`.is-in:not(.is-settled)`).
2. **Next.js prefetch** kéo về ảnh hero của cả 5 trang khác ngay khi vào trang chủ —
   6 ảnh thừa. Đã `prefetch={false}` trên nav và CTA; trang đều static nên chuyển
   trang vẫn nhanh.
3. Đã thử **`content-visibility: auto`** rồi **bỏ**: phần ngoài khung nhìn không có
   hộp bố cục nên ảnh `loading="lazy"` bên trong **không bao giờ được tải**, và bản
   chụp full-page bị trắng. Lợi ít, hại nhiều.

Muốn chuyển ảnh sang CDN thì đặt `NEXT_PUBLIC_ASSET_BASE_URL` — xem
[Đưa ảnh lên Supabase Storage](#đưa-ảnh-lên-supabase-storage).

## Băng hero trang chủ

Quét cả 37 frame bằng `npm run detect:sliders` — dò theo đúng chữ ký đo được từ bản
thiết kế, và kết quả dứt khoát: **toàn site chỉ có MỘT băng ảnh**, ở hero trang chủ.

Số đo lấy từ frame gốc:

| | Toạ độ |
|---|---|
| Vạch chỉ mục | y 826, cao 2px, x 640…799 |
| 5 vạch | vạch đang chọn rộng **86px**, 4 vạch còn lại **11px**, cách nhau **8px** |
| Mũi tên `‹` | x 32…42, y 432…465 |
| Mũi tên `›` | x 1398…1412, y 432…465 |

**Đang chạy với 5 slide.** Slide 1 là ảnh hero thật của trang chủ; 4 slide sau **mượn
tạm** ảnh hero của 4 trang chính khác — đều là ảnh thật của TC Auto trong chính file
thiết kế, nhưng không phải ảnh được thiết kế riêng cho băng hero. Mỗi slide tạm được
đánh dấu `"placeholder": true` trong `src/data/hero-slides.json` để không quên thay.

Thay ảnh thật: bỏ file vào `public/hero/` rồi sửa mục tương ứng. Không phải sửa code.

Chỉ tải ảnh **khi cần**: slide đang xem và slide kế tiếp. Vào trang chủ vẫn chỉ tải
2 ảnh, không phải cả 5 — giữ nguyên thành quả tải theo lượt cuộn.

Lưu ý về 5 kết quả dò khác ban đầu (`trai-nghiem/hanh-trinh`, `ban-sac-rieng`,
`3m-ceramic-elite-im`, `nhan-su`): đã kiểm tra bằng mắt — **đều là dương tính giả**,
khung dò rơi trúng vệt sáng trong ảnh chụp chứ không có vạch nào.

Các bộ ảnh cùng kích thước trong `Tài nguyên Web` (Phong cách sống 6 ảnh, Màn hình
9 ảnh, Kho ứng dụng 10 icon…) **không phải carousel** — chúng là lưới thẻ và danh sách
bài viết, đã hiện đầy đủ sẵn trong thiết kế.

## Phân trang và nút "XEM THÊM"

**Phân trang** `‹ 1 2 3 … ›` có trên **10 trang danh sách** (vị trí đo bằng
`tools/detect-pagination.py`, hộp x 591, rộng 257, cao 56). Bộ dò thô bắt 18 trang
nhưng 8 là dương tính giả (nút XEM THÊM màu đỏ, chú thích ảnh) — đã kiểm bằng mắt
từng trang và chốt danh sách trong `VERIFIED` của script.

Bấm sang trang 2, 3 thì báo rõ *"nội dung đang được cập nhật"* — thiết kế chỉ vẽ
nội dung trang 1.

**Số trang tính từ dữ liệu, không ghi cứng.** Thiết kế vẽ cứng `1 2 3 …` nhưng đó chỉ
là hình minh hoạ — mỗi danh sách hiện chỉ đủ nội dung **một trang**, nên chỉ hiện một số.
Hình vẽ sẵn đã bị **xoá khỏi ảnh** (`tools/scrub-slices.py`) và thay bằng phần tử thật;
nếu không thì số trang trong ảnh sẽ mâu thuẫn với số trang thực.

Thêm bài vào `src/data/listings.json` là số trang tự tăng — không phải sửa code.

**47 nút "XEM THÊM"** trên 14 trang đều bấm được. Bài nào có trang chi tiết thật thì
dẫn thẳng tới đó; còn lại **xổ ra nội dung thật đọc từ chính bản thiết kế** — kể cả
phần bị lớp mờ che ở cuối, vì chữ vẫn được vẽ thật trong ảnh, chỉ bị phủ gradient lên.
45/47 nút có nội dung đọc được.

Trong đó **12 nút** thuộc các ô mà thiết kế để tiêu đề mẫu **"TÊN BÀI VIẾT"** — bảng nói
thẳng điều này, nên khi gửi khách review họ thấy ngay chỗ nào cần bổ sung.

## Thẻ bấm chuyển mục

Ba thẻ lớn ở mục "Ứng dụng" trên `/cong-nghe` (Hiệu suất · Kho ứng dụng · Cập nhật &
vá lỗi) đều bấm được. Toạ độ đo bằng OCR tiêu đề thẻ — tâm ở x 294 / 720 / 1146.
Hai thẻ có trang riêng thì dẫn thẳng tới; thẻ "Hiệu suất" chưa có trang nên mở bảng
giới thiệu. Hover thì thẻ nhấc lên kèm viền sáng.

## Sai lệch có chủ đích so với thiết kế

Cam kết là lệch 0 pixel, nên mọi ngoại lệ đều ghi trong `src/lib/design-deviations.ts`
kèm lý do, và gate so pixel đọc danh sách đó để không báo động nhầm.

| Vùng | Lý do |
|---|---|
| Ô sáng nav "TRẢI NGHIỆM" ở trang chủ | Frame `Home.png` gốc đánh dấu mục này, nhưng đây là **trang chủ** — gần chắc designer copy header từ frame khác. Để nguyên thì khách tưởng đang ở trang Trải nghiệm. |
| Vạch chỉ mục băng hero | Vẽ thật để bấm được và để vạch đang chọn chạy theo slide. |
| Hai mũi tên băng hero | Ảnh nền chỉ có mũi tên ở slide 1; các slide sau không có, nên phải tự vẽ. |
| Bộ phân trang | Số trang phải suy ra từ số bài có thật, không thể để cứng trong ảnh. |

Ảnh hero slide 1 và 10 ảnh trang danh sách đã được **xoá điều khiển vẽ sẵn**
(`npm run brand:hero`, `npm run scrub:slices`) — nếu giữ lại thì điều khiển bị vẽ đôi
và trạng thái trong ảnh mâu thuẫn với trạng thái thật.

## Tìm kiếm đại lý

Trang `/dai-ly/mang-luoi-dai-ly` có hai ô chọn và nút **TÌM KIẾM** vẽ sẵn trong ảnh.
Ba frame `MẠNG LƯỚI ĐẠI LÝ - 1/2/3` hoá ra **không phải carousel** mà là ba trạng thái
của cùng một form: trống → chọn hãng → ra kết quả.

Đã gắn điều khiển thật lên đúng toạ độ (ghost khi nhàn rỗi) và trích **16 đại lý thật**
từ frame số 3 vào `src/data/dealers.json` — đã sửa lỗi dấu của OCR (`Đà Năng` → `Đà Nẵng`)
và bỏ bản trùng sinh ra ở vùng chồng lấn giữa các mảnh ảnh.

Tỉnh chưa có dữ liệu trong thiết kế thì báo *"đang được cập nhật"* kèm hotline — **không**
khẳng định là không có đại lý nào.

## Bộ nhận diện

`public/brand/` có 5 biến thể logo, trích thẳng từ pixel gốc của
`Design System 3.png` (tách nền thành alpha, không vẽ lại):
ngang trên nền tối · xếp dọc · xếp dọc gọn · đơn sắc trắng · đơn sắc đen.

Favicon sinh riêng từ emblem tròn: `favicon.ico` (6 cỡ), `icon.png`, `apple-icon.png`
(nền navy bo góc vì iOS không hỗ trợ nền trong suốt), icon PWA 192/512 + maskable.

```bash
npm run brand:logos    # sinh lại toàn bộ
```

## Trang quản trị (`/admin`)

| Module | Chức năng |
|---|---|
| **Tổng quan** | Hero figure + 3 stat tile, cột theo 14 ngày, phân bố trạng thái, top trang nguồn |
| **Nội dung trang** | Sửa chữ/link từng phần tử của 6 trang, ẩn phần tử, so sánh & khôi phục bản Figma |
| **Trang con** | Tổng quan 31 trang theo section: chiều cao, số lát, khối text, nút dò được |
| **Khách hàng** | Lọc theo trạng thái, tìm theo tên/SĐT, phân trang, ghi chú nội bộ, xuất CSV |
| **Thư viện media** | Tải trực tiếp lên Supabase Storage, copy URL, xoá |
| **Nhật ký** | 80 thao tác gần nhất, ai làm gì lúc nào |
| **Cài đặt** | Thông tin site, liên hệ, bật/tắt hiệu ứng |

**Phân quyền** (`admin_profiles.role`): `viewer` < `editor` < `admin` < `owner`.
Xoá lead/media và sửa cài đặt cần `admin`.

### Bảo mật

- **RLS bật trên mọi bảng.** `anon` chỉ đọc được nội dung công khai (`page_items`,
  `settings`, `media`) — **không** đọc được lead, nhật ký, hồ sơ.
- Lead ghi vào DB **qua service-role** từ `/api/leads`, không mở quyền insert cho
  `anon` (chặn ghi rác trực tiếp vào DB).
- Mọi HTML do admin nhập đi qua `sanitizeInlineHtml`: allowlist thẻ
  (`br span b strong i em div`) + allowlist thuộc tính style **chỉ typography**.
  Đã có 21 unit test, gồm các payload XSS.
- Rate limit: form 5 lần/10 phút/IP · tìm kiếm 60 lần/phút/IP.
- Honeypot chống bot — **cố ý** đặt ngoài khung nhìn thay vì `display:none`, vì
  nhiều bot bỏ qua field `display:none`.
- Xuất CSV chặn CSV injection (ô bắt đầu `= + - @` bị vô hiệu hoá).
- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng phía server, không bao giờ mang tiền tố `NEXT_PUBLIC_`.

### Màu biểu đồ

Palette được **tính toán, không chọn bằng mắt**. Đã xác thực bằng validator của
skill `dataviz` cho bề mặt tối `#121927`:

```
#7A62DE #1E9BC2 #BE8311 #37A663 #B93A54
Lightness band PASS · Chroma floor PASS · Normal-vision floor PASS (ΔE 17,1)
Contrast vs surface PASS · CVD separation WARN (ΔE 7,8 — dải 6–8)
```

Cảnh báo CVD ở dải 6–8 **chỉ hợp lệ khi có mã hoá phụ**: mỗi trạng thái luôn kèm
**nhãn chữ** trực tiếp. **Không được bỏ nhãn chữ** khỏi biểu đồ dùng palette này.

---

## Sẵn sàng production

**Security headers** (`next.config.ts`, áp cho mọi route):

| Header | Giá trị |
|---|---|
| `Content-Security-Policy` | `default-src 'self'` · `object-src 'none'` · `frame-ancestors 'none'` · `base-uri 'self'` · `form-action 'self'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | tắt camera, mic, vị trí, thanh toán, USB |

`X-Powered-By` đã ẩn. Ảnh và font (`/slices`, `/fonts`, `/brand`) có
`Cache-Control: public, max-age=31536000, immutable` — tên tệp bất biến nên cache vĩnh viễn.

> `script-src` buộc phải có `'unsafe-inline'`: Next nhúng sẵn script nội dòng để truyền
> dữ liệu hydrate, và 47 trang công khai đều sinh **tĩnh** nên không gắn nonce theo
> request được — gắn nonce sẽ biến tất cả thành render động, mất hết lợi thế tốc độ.
> Bù lại mọi hướng khác đều đóng, và HTML do admin nhập đều qua bộ lọc trong
> `src/lib/sanitize.ts` (21 test, gồm cả payload XSS).

**Error boundary** ở cả ba tầng, đều theo token thương hiệu:
`global-error.tsx` (hỏng cả layout gốc) · `error.tsx` (mọi trang site) ·
`admin/(dash)/error.tsx` (khu quản trị, gợi ý kiểm tra Supabase).

Không còn `console.log` nào; 15 chỗ `console.error` đều nằm trong khối `catch`.

## Kiểm chứng độ chính xác

```bash
npm run verify              # typecheck → lint → coverage → build → e2e
npm run verify:fidelity     # 6 trang chính vs prototype Figma
npm run verify:fidelity:sub # 31 trang con vs PNG thiết kế gốc
npm run verify:buttons      # detector nút vs toạ độ thật
```

`tools/fidelity/compare.mjs` mở prototype gốc và site đã build trong cùng một
Chromium, ép cả hai về zoom 1:1 và trạng thái tĩnh, chụp full-page rồi so từng pixel:

```
  trang          proto        next         lech px      % lech
  ----------------------------------------------------------------
  home           1440x3566    1440x3566            0     0.000%
  trai-nghiem    1440x3464    1440x3464            0     0.000%
  giai-phap      1440x5977    1440x5977            0     0.000%
  cong-nghe      1440x4087    1440x4087            0     0.000%
  dai-ly         1440x4577    1440x4577            0     0.000%
  nhan-su        1440x3374    1440x3374            0     0.000%
```

31 trang con so với PNG gốc: **lệch tối đa 0,002%**, kích thước khớp tuyệt đối cả 31.

**Chạy lại kiểm chứng này sau mỗi lần sửa CSS.** Nó đã bắt được 4 lỗi thật:
nút biến mất do ghi đè `position`, `padding` gốc bị reset xoá, inline style của
khối `raw` bị sanitizer cắt, và `&amp;` bị escape hai lần.

---

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Build & chạy production |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | 97 unit test |
| `npm run test:coverage` | Unit test + coverage (ngưỡng 80%) |
| `npm run test:e2e` | 45 E2E test (Playwright) |
| `npm run verify` | Toàn bộ pipeline |
| `npm run verify:fidelity` | So pixel với prototype |
| `npm run parse:prototype` | Sinh lại assets + page spec của 6 trang chính |
| `npm run parse:subpages` | Cắt lại 31 trang con từ PNG + dò nút |
| `npm run ocr:build` / `ocr:run` | Build binary OCR / chạy lại lớp văn bản |
| `npm run verify:buttons` | Kiểm chứng detector nút (25/25) |
| `npm run verify:fidelity:sub` | So pixel 31 trang con |
| `npm run verify:lazy` | Đo số ảnh tải lúc vào trang và sau khi cuộn |
| `npm run detect:sliders` | Dò băng ảnh trong 37 frame thiết kế |
| `npm run detect:pagination` | Dò bộ phân trang |
| `npm run verify:reach` | Crawl từ trang chủ, tìm trang không bấm tới được |
| `npm run scrub:slices` | Xoá điều khiển vẽ sẵn khỏi lát nền |
| `npm run brand:hero` | Sinh lại ảnh hero đã xoá điều khiển |
| `npm run brand:logos` | Sinh lại bộ logo + favicon |
| `npm run assets:upload` | Đưa ảnh lên Supabase Storage |

---

## Việc còn lại

1. **Sửa nội dung trang con qua admin.** Hiện chữ nằm trong ảnh nên chỉ sửa được ở
   Figma rồi export lại. Muốn sửa trực tiếp thì cần bản export HTML có đủ 37 frame
   (giống cách đã tạo `TC-Auto-Website-Prototype.html`) — khi đó trang con cũng đạt
   chuẩn 0 pixel và chữ chọn/copy được như 6 trang chính.

2. **Hai trang con chưa có lối vào bằng nút.** `/giai-phap/phim-dan-kinh` và
   `/giai-phap/loa` — frame `/giai-phap` không có nút CTA cho hai mục này (detector dò
   0 vùng đỏ). Hiện tới được qua tìm kiếm và sitemap. Cần biết phần nào trong thiết kế
   đóng vai trò nút để phủ vùng bấm.

3. **Ba trang "Mạng lưới đại lý 1/2/3"** đang là 3 URL riêng. Nếu thiết kế định làm
   carousel 3 slide thì gộp lại thành một trang có chuyển slide sẽ đúng ý hơn.

4. **Mobile.** Thiết kế chỉ có frame desktop 1440px.

5. **Supabase** — chưa cấu hình (theo yêu cầu). Site public chạy đủ không cần nó.

## Ghi chú vận hành

- `revalidate = 60` trên trang public: nội dung admin sửa lên sóng sau tối đa 1 phút
  (server action cũng gọi `revalidatePath` nên thường thấy ngay).
- Không dùng SQLite: deploy serverless (Vercel/Netlify) không chạy được SQLite.
- Tổng dung lượng asset: **3,1MB ảnh nền** (30 lát @2x) + **584KB font** (15 subset
  có tiếng Việt). Lát 1–2 tải ngay, còn lại lazy.

## Đưa ảnh lên Supabase Storage

69,1 MB ảnh trong repo làm mỗi lần deploy nặng và chậm. Có thể chuyển sang Storage:

```bash
# 1. Điền NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY vào .env.local
npm run assets:upload          # tạo bucket công khai + tải 328 tệp lên
# 2. Thêm dòng script in ra vào .env.local:
#    NEXT_PUBLIC_ASSET_BASE_URL=https://<ref>.supabase.co/storage/v1/object/public/site-assets
npm run build
```

Bỏ biến đó đi thì site quay lại phục vụ ảnh từ `/public` — đổi qua đổi lại không cần
build lại ảnh.
