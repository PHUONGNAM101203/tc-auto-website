# TC Auto Solutions — sổ tay dựng site

Tài liệu này ghi lại **mọi số đo và quy ước đã dò được**, để lần sau không phải
đo lại từ đầu. Viết cho người chưa từng đụng vào repo này.

---

## 1. Nguyên tắc gốc

Website được dựng lại từ một **prototype HTML export** và một bộ **PNG thiết kế**
(`~/Downloads/[TC] Website`). Cam kết ban đầu: *lệch 0 pixel so với thiết kế,
chỉ thêm hiệu ứng*.

Điều đó dẫn tới kiến trúc:

- Mỗi trang là một **canvas tuyệt đối rộng 1440px**. Mọi phần tử đặt theo toạ độ
  `left/top` đúng như Figma.
- Canvas được thu/phóng bằng `zoom: var(--tc-zoom)` — **không phải** `transform:
  scale()`. Lý do: `zoom` cho chữ được bố trí lại nên vẫn nét, và chiều cao
  trang tự đúng theo tỉ lệ.
- `--tc-zoom = clientWidth / 1440`, đặt bởi inline script **trước khi paint**.

> ⚠️ Script đó chỉ chạy ở lần tải tài liệu đầu tiên. Điều hướng phía client vào
> nhóm `(site)` (ví dụ từ trang 404) **không** chạy lại nó — script chèn bằng
> `innerHTML` không bao giờ thực thi. Vì vậy có thêm `CanvasZoom.tsx` đồng bộ
> lại khi mount, dùng `ResizeObserver` (sự kiện `resize` **không** bắn khi thanh
> cuộn xuất hiện/biến mất, mà lúc đó `clientWidth` đã đổi ~15px).
> Cổng chặn tái phát: `npm run verify:zoom` — **chỉ tái hiện được trên bản
> build**, ở chế độ dev Next tải lại cả trang khi rời trang 404.

---

## 2. Bố cục thư mục

```
tools/                 công cụ dựng ảnh + dữ liệu (Python/Node)
  brand/               bóc phần tử ra khỏi ảnh nền
  fidelity/            các cổng kiểm tra
  ocr/                 trích chữ từ ảnh (Swift Vision, tiếng Việt)
src/data/              dữ liệu sinh ra từ công cụ — KHÔNG sửa tay
src/lib/               đọc dữ liệu, kiểu dữ liệu, logic thuần
src/components/
  canvas/              phần tử đặt theo toạ độ 1440px
  site/                lớp tương tác phủ lên canvas
  mobile/              bản dành cho màn nhỏ
src/styles/canvas.css  CSS chép nguyên từ prototype — KHÔNG BAO GIỜ SỬA
```

---

## 3. Quy trình dựng ảnh

Một lệnh làm tất cả:

```bash
npm run parse:prototype
```

Chuỗi đó chạy, **theo đúng thứ tự**:

1. `parse-prototype.py` — cắt 30 lát nền + 15 font + 6 page spec từ prototype.
2. `add-retina-main.py` — thay lát của 6 trang chính bằng bản @3x từ `Website_TC`.
3. `patch-from-design.py` — vá những chỗ prototype export **sai so với thiết kế**.
4. `brand/extract-cards.py` — bóc ruột 3 thẻ mục *Ứng dụng*.
5. `brand/extract-solution-cards.py` — bóc dải 4 thẻ *Giải pháp*.
6. `brand/extract-lift-cards.py` — bóc các thẻ có hiệu ứng nhấc lên.
7. `brand/extract-photo-sliders.py` — bóc các slider ảnh.
8. `brand/extract-mobile-tiles.py` — cắt ảnh cho bản mobile.
9. `stamp-slices.py` — đóng dấu mã nội dung vào URL ảnh.

Trang con có chuỗi riêng: `npm run parse:subpages`.

> ⚠️ Các bước 4–8 **sửa trực tiếp lát nền**. Chạy lại bước 1 mà quên các bước sau
> là ảnh nền có lại phần tử cũ, và website sẽ hiện **hai lần** cùng một thứ.

### Đóng dấu mã nội dung — vì sao cần

`/slices` được phục vụ với `Cache-Control: immutable`. Tên tệp **không đổi** khi
ta sửa ảnh, nên trình duyệt giữ mãi bản cũ: người dùng thấy ảnh cũ còn điều khiển
thật vẽ đè lên. `stamp-slices.py` gắn `?v=<8 ký tự hash>` vào mọi đường dẫn ảnh
trong page spec — nội dung đổi thì URL đổi.

---

## 4. Bảng số đo

Mọi toạ độ theo hệ canvas 1440px.

### 4.1 Trang chủ (`home`)

| Thứ | Hộp | Ghi chú |
|---|---|---|
| Bảng hero | ảnh nền + điều khiển | 5 slide, slide 1 là ảnh đã xoá điều khiển vẽ sẵn |
| Mũi tên hero trái | x16 y426 40×50 | vẽ thật |
| Mũi tên hero phải | x1385 y423 40×50 | vẽ thật |
| Vạch chỉ mục hero | x640 y826 160×2 | vạch rộng 11, vạch đang chọn 84, cách nhau 8 |
| Dải thẻ *Giải pháp* | khung nhìn x539 y1458 901×371 | thẻ 263×371, bước 279, 4 thẻ |
| Mũi tên dải Giải pháp | x1400 y1629 10,33×30 | tam giác trắng đặc |
| 4 ô *Công nghệ* | y2066 cao 330 | vạch ngăn tại x136/394, 440/698, 744/1002, 1048/1304 |
| Ảnh *Câu chuyện khởi nghiệp* | x458 y2976 876×376 | mũi tên x1335 y3108 12×33 |
| Ô tìm kiếm header | x1123 y37 235×30 | trùng khít ô vẽ sẵn trong thiết kế |

### 4.2 Trang Công nghệ (`cong-nghe`)

| Thứ | Hộp |
|---|---|
| Khung thẻ *Hiệu suất* | x139 y2057 310×287 |
| Khung thẻ *Kho ứng dụng* | x475 y1970 492×400 |
| Khung thẻ *Cập nhật & vá lỗi* | x989 y2057 310×287 |
| Ruột thẻ | khung thụt vào: hai bên 24, trên 14, **dưới 4** |
| Nút *Khám phá ngay* | x630 y1903 179×34 |

Ruột thụt dưới chỉ 4px vì **dòng phụ đề nằm sát viền**.

### 4.3 Trang Đại lý (`dai-ly`)

| Thứ | Hộp |
|---|---|
| Hai thẻ *Câu chuyện đồng hành* | x82 và x454, y1574, 358×495 |
| Ảnh *Chân dung đại lý* | x650 y2167 697×416 |
| Mũi tên | x1386 y2370 12×30 |

### 4.4 Trang Nhân sự (`nhan-su`)

| Thứ | Hộp |
|---|---|
| Ảnh *Con người TC* | x310 y1312 811×447 |
| Mũi tên lùi | x210 y1497 12×33 |
| Mũi tên tiến | x1218 y1497 12×33 |

### 4.5 Phân trang (10 trang con)

Hộp chuẩn: `x=591, rộng 257, cao 56`. **Hai ngoại lệ** đã đo tay vì viền sáng
hắt xuống làm bộ dò lấy đáy khối thấp hơn thật ~12px:

- `giai-phap/du-an`: y **3360**, cao 64
- `cong-nghe/tien-phong-cong-nghe/bai-viet`: y **3287**, cao 65

---

## 5. Cách bóc một phần tử khỏi ảnh nền

Khi một điều khiển được **vẽ chết** vào ảnh nhưng cần hoạt động thật:

1. Đo hộp của nó.
2. Cắt phần tử ra thành ảnh riêng.
3. **Dựng lại nền** ở chỗ nó vừa rời đi.
4. Ghi một mục vào `src/lib/design-deviations.ts` kèm **lý do**.

### Chọn cách dựng lại nền

| Nền | Cách | Dùng ở |
|---|---|---|
| Phẳng (trắng thuần) | tô màu | dải thẻ Giải pháp, 2 thẻ Đại lý |
| Gradient dọc | **nội suy dọc** từng cột | 4 ô Công nghệ |
| Có chữ sát bên dưới | **nội suy ngang** từng hàng | ruột 3 thẻ Ứng dụng |
| Có chi tiết phức tạp (bóng cây) | **vá từ bản thiết kế** | ô tìm kiếm Công nghệ |

Hàm dùng chung: `tools/brand/_backdrop.py`.

### Những cái bẫy đã sụp

- **Lát gạch một dải nền** → lộ mạch ngang khi nền có gradient. Phải nội suy.
- **Chép dải ngay phía trên** → nếu phía trên có chữ ("XEM THÊM") thì chép luôn
  cả chữ xuống. Nay `scrub-slices.py` tự chọn dải **phẳng hơn** (trên hoặc dưới).
- **Viền mờ dần trên nền phẳng** → tạo quầng sáng, lệch 16.038 pixel. Nền phẳng
  thì cắt sắc (`FEATHER_FLAT = 0`).
- **Mất kênh trong suốt** khi `convert("RGB")` → ảnh nghiêng 3D thành ô đen che
  hết các lớp phía sau. Luôn `convert("RGBA")` với ảnh có alpha.
- **Khung vượt ngoài phạm vi lát nền** → phần thừa để nguyên màu đen.
- **`glob` với đường dẫn chứa `[TC]`** → trả về 0 kết quả (dấu ngoặc vuông là lớp
  ký tự). Dùng `os.walk`.
- **Tên tệp tiếng Việt trên macOS** ở dạng NFD, JSON ở NFC → phải chuẩn hoá.

---

## 6. Các sai lệch có chủ ý

`src/lib/design-deviations.ts` là nguồn duy nhất. Mọi cổng kiểm tra đọc từ đó.
Không được sửa giao diện mà không thêm mục vào đây.

Hiện có: nav trang chủ, điều khiển hero, phân trang, dải thẻ Giải pháp, 4 ô
Công nghệ, ruột 3 thẻ Ứng dụng, 2 thẻ Đại lý, ảnh Câu chuyện khởi nghiệp, ô tìm
kiếm Công nghệ.

---

## 7. Bản mobile

Canvas 1440px là khung **cứng**: trên màn 390px nó bị thu còn 27%, chữ thân bài
chỉ còn 3–4px. Nên dưới **900px** canvas bị ẩn và bản mobile hiện ra.

- Nội dung lấy từ **cùng một nguồn dữ liệu** (page spec / OCR trang con), nên hai
  bản không bao giờ lệch nội dung.
- `src/data/mobile-sections.json` — do `extract-mobile-tiles.py` sinh.
- Ảnh từng mục: cắt ở **cột đối diện với cột chữ** (thiết kế luôn xếp chữ một
  bên, ảnh một bên). Ảnh bị loại nếu quá phẳng, quá trắng, quá đen, hoặc tối
  quá (trên nền navy nhìn ra như chỗ trống) — khi đó dùng ảnh sạch đã bóc.
- Trang con: chữ nằm trong ảnh nên bản mobile vẽ lại từ **OCR**; nhãn của các nút
  bị lọc bỏ (đã có nút thật).
- Ô nhập liệu để **16px** — dưới mức đó iOS tự phóng to trang khi gõ.
- **Chân trang** (`MobileFooter.tsx`): desktop vẽ chết chân trang vào ảnh nền, nên
  số liệu phải đọc lại từ `Home.png` — lưu ở `src/lib/site-contact.ts`.
- Ảnh trang con: `extract-subpage-tiles.py`. Cắt ở **khoảng hở giữa hai dải chữ**
  OCR, hoặc **nửa đối diện** khi chữ lệch hẳn một bên. Ảnh đầu trang cắt bỏ cột
  tiêu đề vẽ sẵn (biên lấy từ toạ độ chữ, không đặt cứng) — nếu không tiêu đề
  hiện hai lần.

### Bốn cái bẫy của bản mobile

1. **Khung cắt tràn ra ngoài dải của mục.** Nới khung để đạt 4:3 thì nó nuốt luôn
   vạch phân cách, dải chân trang, hoặc nửa ảnh của mục kế bên. Khung chỉ được
   **co lại trong dải**; tỉ lệ để `tidy()` lo.
2. **Gọt rác từ mép vào là sai.** Dưới một vạch trắng thường còn vài hàng tối,
   gọt từ ngoài sẽ dừng ngay ở đó. Phải lấy **đoạn liên tục sạch dài nhất**.
3. **Chỉ số vân ảnh tách ảnh chụp khỏi hình vẽ.** Khoảng hở giữa hai dải chữ có
   khi là một hàng biểu tượng ứng dụng chứ không phải ảnh. Ảnh chụp có hạt li ti
   khắp nơi (0,24–0,56); hình vẽ phẳng chỉ có viền sắc ở đường bao (0,00–0,09).
4. **Chữ thân bài bị OCR gán nhầm là tiêu đề.** Trên trang bài viết chữ được vẽ
   khá to nên gần hết bị đánh `h3`; để nguyên thì cả bài thành một chuỗi tiêu đề
   hoa in đậm, dài gấp gần hai lần. Chỉ khối **ngắn hơn 60 ký tự** mới là tiêu đề.

Chữ trong thiết kế còn **bị vẽ lặp 2–4 lần** (desktop khung cố định nên cắt mất,
mobile chảy tự do thì lòi ra) — `dedupe_repeats()` lấy chu kỳ ngắn nhất.

Khối OCR của trang con phải gom theo **dải rồi tới cột** trước khi đọc. Thiết kế
hay xếp ba bốn thẻ cạnh nhau, dòng đầu của cả bốn thẻ cùng một `y`; sắp theo `y`
rồi `x` thì bốn thẻ bị **đan xen** thành một đoạn vô nghĩa.

> ⚠️ Khi chụp ảnh toàn trang bằng Playwright headless, `backdrop-filter` trên
> thanh dính làm phần dưới màn hình **trắng/đen giả**. Đó là hiện vật của ảnh
> chụp, không phải lỗi bố cục — hãy đo DOM hoặc chụp theo từng màn.

---

## 8. Các cổng kiểm tra

| Lệnh | Bảo đảm điều gì |
|---|---|
| `npm run verify:fidelity` | 6 trang chính lệch ≤ ngưỡng so với prototype |
| `npm run verify:fidelity:sub` | 31 trang con |
| `npm run verify:zoom` | canvas luôn đúng tỉ lệ ở **mọi đường vào** (cần bản build) |
| `npm run verify:pager` | hình phân trang vẽ sẵn đã bị xoá sạch |
| `npm run verify:reach` | 37/37 trang bấm tới được |
| `npm run verify:lazy` | ảnh chỉ tải khi cuộn tới |
| `npm run verify:buttons` | bộ dò nút đúng 25/25 |

Mức lệch hiện tại: trang chính tối đa **0,071%**, trang con **0,006%**. Phần lệch
còn lại nằm **bên trong thân ảnh** — là nhiễu nén WebP, không phải sai vị trí.

---

## 9. Chỗ còn chờ TC Auto cung cấp

- 4 ảnh hero thật (hiện slide 2–5 mượn ảnh trang khác, đánh dấu `placeholder`).
- Bài viết thật cho các ô đang để tiêu đề mẫu **"TÊN BÀI VIẾT"**.
- Ảnh gốc từng tấm của lưới *Bộ sưu tập theo thương hiệu* (muốn bấm để đưa ra
  giữa thì cần ảnh rời, hiện chỉ có ảnh giữa).
- Ảnh slide thứ hai cho slider ở `/giai-phap/ppf`.
- **Instagram** — thiết kế có vẽ biểu tượng nhưng TC Auto chưa có tài khoản
  Instagram nào (những tài khoản trùng tên đều là hãng khác ở Brazil, Hawaii,
  Úc). Biểu tượng để nguyên, không gắn liên kết.
- **Địa chỉ đường của từng đại lý.** Danh mục chỉ có tên + khu vực nên liên kết
  bản đồ dùng dạng *tìm kiếm* (`maps/search?api=1&query=…`) — luôn mở đúng khu
  vực, không bao giờ ghim sai. Riêng hai cơ sở Thanh Bình Auto đã có số nhà.
- Danh sách bản **Bravo** kèm thông số và ảnh (trang `giai-phap/man-hinh/bravo`
  đang để mục *Đang cập nhật*).
- Tên và mô tả thật cho ba sản phẩm **"5DO ..."** ở `/giai-phap/phim-dan-kinh` —
  chỗ này là placeholder của chính designer.
- Số liệu nghiệp vụ cho hai trang tự soạn: `cong-nghe/bao-hanh` và
  `cong-nghe/khong-gian-trai-nghiem` (xem `src/data/authored-pages.json`).

---

## 9b. Ba khối tương tác tách khỏi ảnh nền

Cùng một phương pháp: **đo hộp → tách phần tử → dựng lại nền → ghi sai lệch**.

| Khối | Ở đâu | Hình học | Công cụ |
|---|---|---|---|
| Dải thẻ 3M PPF | `/giai-phap/ppf` | thẻ 354×444 tại y1090, bước 434 | `extract-ppf-cards.py` |
| Trắc nghiệm phong cách | `/trai-nghiem/ban-sac-rieng` | khối 830×572 tại (310,1424) | `extract-quiz.py` |
| Tab WINCA \| BRAVO | `/giai-phap/man-hinh` | hai ô 720×88 tại y878 | `EXTRA_HOTSPOTS` |

- Thẻ nào **lộ trọn vẹn** trong thiết kế thì cắt nguyên ảnh (kể cả chữ) — lúc
  đứng yên màn hình trùng khớp tuyệt đối. Thẻ **bị cắt ở mép canvas** mới dựng
  lại từ nền thẻ rỗng + ảnh minh hoạ rời, chữ do CSS vẽ.
- Cỡ chữ CSS đo lại từ thẻ nguyên: **chiều cao nét hoa ÷ 0,72** cho chữ không
  dấu, **÷ 1,4** cho chữ Việt có dấu.
- Trắc nghiệm: thiết kế chỉ có **một** câu kèm nút "câu tiếp theo" — bốn câu sau
  và phần kết quả là nội dung ta viết (`src/lib/style-quiz.ts`).
- Tab BRAVO **không có frame nào** trong bộ thiết kế nên nó dẫn sang một trang tự
  soạn, thay vì đổi nội dung tại chỗ.

### Cỡ chữ: nẹp về thang, đừng ước từ nét mực

Đừng suy cỡ chữ từ chiều cao nét mực của khối OCR. Nét cao hay thấp còn tuỳ dòng
đó có dấu mũ và nét thả xuống hay không — **cùng một cỡ chữ mà chênh nhau tới
40%**. Thay vào đó đo **nhịp dòng** (rất ổn định) rồi nẹp về đúng một trong hai
cỡ thân bài mà thiết kế dùng. Đếm trên bản xuất prototype: chỉ có **16px/20px**
(22 lần) và **14px/17px** (5 lần), không có cỡ nào khác.

Thiết kế còn **làm mờ dần** mấy dòng cuối cho tới khi khuất hẳn, nên OCR đọc tới
đâu hết tới đó — thường đứt ngang giữa một từ. Khi bung ra phải lùi về **câu trọn
vẹn gần nhất**, để nguyên thì người đọc tưởng trang bị lỗi.

### Băng chuyền: bấm liên tục mà không giật

Ba lỗi phải tránh cùng lúc:

1. `transitionend` của **các thẻ con** (hiệu ứng mờ dần) **nổi bọt** lên dải →
   lọc theo `event.target === currentTarget && propertyName === "transform"`.
2. Bấm đúng khung hình dải đang được đặt lại (hoạt ảnh đang tắt) → **nhớ lại** cú
   bấm rồi làm ngay sau khi bật lại, đừng bỏ.
3. Bấm nhanh hơn thời gian truợt thì nhịp vượt qua một vòng từ lúc nào → đặt lại
   bằng **phần dư**, và nhân đủ số bản sao thẻ (16 bản) để dải không bao giờ hở.

> ⚠️ Các bộ tách ở trên **xoá trực tiếp** trên lát nền, chạy hai lần là xoá hai
> lần. Vì vậy `cards:ppf` / `cards:quiz` đều trỏ về `parse:subpages` — bước đầu
> của chuỗi đó tạo lại lát **gốc** nên mới an toàn.

---

## 9c. Ba cái bẫy của trang quản trị

1. **`redirect()` của Next làm việc bằng cách NÉM RA một lỗi.** Bọc hành động
   trong `try/catch` rồi nuốt luôn nó thì trang không chuyển đi đâu — bài đã lưu
   vào cơ sở dữ liệu rồi mà người dùng vẫn ngồi ở biểu mẫu, tưởng là hỏng.
   `fromError()` giờ **ném lại** mọi lỗi có `digest` bắt đầu bằng `NEXT_REDIRECT`
   hay `NEXT_NOT_FOUND`. Một chỗ sửa bao cả 9 biểu mẫu quản trị.
2. **Đừng đặt `force-static` cho trang nằm trong layout có kiểm tra đăng nhập.**
   Lúc build, layout chạy khi chưa có người dùng nên lệnh chuyển về trang đăng
   nhập bị *nướng luôn* vào bản tĩnh. Vào là bị đá ra đăng nhập, rồi middleware
   thấy đã đăng nhập nên đẩy tiếp về `/admin` — mục đó không bao giờ mở được.
3. **Xem trước phải xem được BẢN NHÁP.** Trang công khai chỉ trả về bài đã đăng,
   nên nếu xem trước trỏ vào đó thì phải đăng bài lên mới xem được — tức là đã
   lộ ra ngoài rồi. Đường dẫn `/admin/preview/[id]` nằm trong vùng middleware
   bảo vệ, đọc bằng quyền quản trị, và **dùng chung** `PostArticle` với trang
   thật nên không thể lệch nhau.

---

## 10. Bài viết (CMS)

Bảng `posts` (migration `0002_posts.sql`). Admin tự thêm/sửa tại `/admin/posts`,
không cần đụng mã nguồn.

- Bản nháp chỉ admin thấy; RLS chỉ cho khách đọc bài `status = 'published'`.
- Slug tự sinh từ tiêu đề, nhưng **không tự đổi** với bài đã xuất bản — đổi slug
  là hỏng mọi liên kết đã chia sẻ.
- Trường `section` khớp với slug trang con. Các ô để tiêu đề mẫu
  **"TÊN BÀI VIẾT"** của mục đó tự nối sang bài, **theo đúng thứ tự xuất hiện**.
  Chưa có bài thì ô vẫn xổ nội dung tại chỗ như cũ.
- Bài hiển thị ở `/bai-viet/<slug>`, dùng chung khuôn `.tc-doc` nên đọc tốt trên
  điện thoại.
- `supabase/scripts/seed-posts.mjs` nạp 3 bài thật lấy từ `tcauto.vn`; nội dung
  được viết lại cho hợp bố cục và mỗi bài ghi rõ `source_url`.

> ⚠️ Trang con dùng ISR (`revalidate = 300`). Sau khi thêm bài, bản build cũ có
> thể còn trong `.next/cache` — trên máy phát triển hãy `rm -rf .next` rồi dựng
> lại; trên môi trường thật thì tối đa 5 phút là tự cập nhật.

---

## 11. Supabase

- Project: **TC Auto Website** (`gwxmbakqmszprycowhmn`, ap-southeast-1).
- Schema ở `supabase/migrations/0001_init.sql`; đẩy bằng `supabase db push --linked`.
- `supabase/scripts/grant-admin.sql` **không phải** migration — nó cần một tài
  khoản có sẵn, để trong `migrations/` thì mọi lần push đều thất bại.
- Trang công khai phải dùng `createSupabasePublicClient()` (**không** cookie).
  Chỉ cần chạm vào `cookies()` là Next coi cả tuyến đường là động, và 47 trang
  tĩnh mất hết lợi thế tốc độ.
