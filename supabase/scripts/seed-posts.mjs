/**
 * Nap ba bai viet THAT cua TC Auto vao bang `posts`.
 *
 * Ban thiet ke de san nhung o tieu de mau "TÊN BÀI VIẾT"; day la noi dung that
 * thay vao do. Noi dung duoc VIET LAI tu bai goc tren tcauto.vn cho hop voi bo
 * cuc trang nay, va moi bai deu ghi ro `source_url` tro ve ban goc.
 *
 * Idempotent: chay lai nhieu lan chi cap nhat, khong nhan doi.
 *
 * Chay: node supabase/scripts/seed-posts.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const at = line.indexOf("=");
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SECTION = "cong-nghe/tien-phong-cong-nghe/bai-viet";

const POSTS = [
  {
    slug: "top-3-man-hinh-o-to-ban-chay-nua-dau-2026",
    title: "Ba mẫu màn hình ô tô bán chạy nhất nửa đầu 2026",
    excerpt:
      "Bravo Lite, S170+ QLED và S200+ QLED 2K — ba phân khúc, ba kiểu người dùng khác nhau.",
    published_at: "2026-07-31T09:00:00+07:00",
    source_url: "https://tcauto.vn/top-3-man-hinh-o-to-ban-chay-nhat-nua-dau-nam-2026/",
    body: `Nửa đầu năm 2026, ba mẫu màn hình Android dẫn đầu doanh số ở ba tầm giá khác nhau. Điều đáng chú ý không nằm ở thứ hạng, mà ở chỗ mỗi mẫu phục vụ một kiểu người dùng rất riêng.

Bravo Lite — 5,5 triệu đồng — dành cho người mới rời khỏi màn hình nguyên bản. Chip 8581, RAM 2GB, độ phân giải 720p, có dẫn đường Vietmap và camera hành trình. Đủ dùng cho nhu cầu cơ bản, và là lựa chọn phổ biến với xe chạy dịch vụ.

S170+ QLED — 7,8 triệu đồng — là bản tầm trung bán chạy nhất. RAM 4GB, chạy Android 10, có điều khiển giọng nói Winca AI. Mẫu này đặc biệt phổ biến trên VF3 và Limo, phù hợp với chủ xe cá nhân dùng hằng ngày.

S200+ QLED 2K — 9,8 triệu đồng — là bản cao cấp. Android 12, chip 7862s xung nhịp 2.0GHz, màn hình 2K thực. Khác biệt lớn nhất so với hai mẫu trên là tích hợp sẵn cảm biến áp suất lốp, nên hợp với người đi đường dài thường xuyên.

Cả ba mẫu đều được TC Auto phân phối kèm bảo hành điện tử và hỗ trợ kỹ thuật qua hệ thống đại lý.`,
  },
  {
    slug: "vi-sao-tam-dau-va-cuoi-cuon-phim-hay-bi-loi",
    title: "Vì sao tấm đầu và tấm cuối cuộn phim cách nhiệt hay bị lỗi",
    excerpt:
      "Đây là đặc điểm vật lý của cuộn phim, không phải lỗi sản xuất — nhưng cần biết để không hiểu nhầm.",
    published_at: "2026-06-27T09:00:00+07:00",
    source_url: "https://tcauto.vn/ly-do-cuon-phim-cach-nhiet-hay-bi-loi-o-dau-va-cuoi/",
    body: `Người thi công lâu năm đều gặp: tấm ngoài cùng và tấm trong cùng của một cuộn phim cách nhiệt hay có vấn đề, trong khi phần giữa hoàn toàn bình thường. Nguyên nhân nằm ở cấu trúc vật lý của cuộn phim, không phải lỗi sản xuất.

Tấm ngoài cùng tiếp xúc trực tiếp với lớp bao bì trong suốt quá trình vận chuyển. Ma sát và bụi bám khiến nó dễ có vết xước mờ hoặc lớp phủ bề mặt bị ảnh hưởng nhẹ. Những khuyết điểm này thường chỉ lộ ra sau khi đã dán lên kính.

Tấm trong cùng thì ngược lại: nó bị ép sát vào lõi cuộn suốt thời gian lưu kho. Áp lực tích lũy tạo ra nếp gấp nhỏ hoặc vùng căng không đều.

Điều này liên quan trực tiếp đến bảo hành. Chính sách bảo hành 10 năm của phim 3M không bao gồm thiệt hại do bảo quản sai hoặc vận chuyển không đúng chuẩn. Vì vậy nếu lỗi lan quá hai đầu cuộn, đó là dấu hiệu bảo quản có vấn đề và cần làm việc lại với đại lý.

Cách xử lý của kỹ thuật viên có kinh nghiệm rất đơn giản: luôn kiểm tra kỹ hai tấm này trước khi quyết định dùng hay bỏ. Đây là hiện tượng bình thường trong thực tế, biết trước thì không phải lo.`,
  },
  {
    slug: "bon-dieu-nen-biet-truoc-khi-nang-cap-xe",
    title: "Bốn điều nên biết trước khi chi tiền nâng cấp xe",
    excerpt:
      "Phim tối chưa chắc chống UV tốt, RAM cao chưa chắc chạy mượt — bốn hiểu nhầm hay gặp.",
    published_at: "2026-08-07T09:00:00+07:00",
    source_url: "https://tcauto.vn/top-4-kien-thuc-nang-cap-xe-o-to-can-biet/",
    body: `Phần lớn tiếc nuối khi nâng cấp xe đến từ việc chọn sai ngay từ đầu, chứ không phải sản phẩm kém. Bốn điểm dưới đây là những chỗ hay bị hiểu nhầm nhất.

Thứ nhất, phim cách nhiệt và PPF là hai thứ khác nhau. Phim dán lên kính để chống nắng; PPF phủ lên sơn để bảo vệ bề mặt. Và một hiểu nhầm phổ biến: độ tối của phim chỉ quyết định khả năng cản sáng nhìn bằng mắt thường, không quyết định khả năng lọc tia UV. Chọn phim nên nhìn vào chỉ số lọc UV thực tế, không nhìn vào giá rẻ.

Thứ hai, với màn hình Android, RAM không phải yếu tố duy nhất. Độ mượt là kết quả phối hợp giữa chip xử lý, số nhân, xung nhịp và RAM. So sánh hai sản phẩm chỉ bằng con số RAM là cách nhanh nhất để chọn sai.

Thứ ba, áp suất lốp cần kiểm tra định kỳ hằng tháng. Lốp thoát hơi từ từ gần như không thể nhận ra bằng mắt, nhưng đủ để gây mòn không đều, tốn nhiên liệu và giảm an toàn. Cảm biến áp suất lốp giúp việc theo dõi này trở nên dễ dàng.

Thứ tư, xe chạy dịch vụ cần tiêu chuẩn khác xe gia đình. Tần suất hoạt động cao hơn nhiều, nên màn hình, phim cách nhiệt hay cảm biến lốp đều cần độ bền đã được chứng minh qua thực tế — không phải chọn theo giá.`,
  },
];

const rows = POSTS.map((post) => ({ ...post, section: SECTION, status: "published" }));

const { data, error } = await supabase
  .from("posts")
  .upsert(rows, { onConflict: "slug" })
  .select("slug, title");

if (error) {
  console.error("Không nạp được bài viết:", error.message);
  process.exit(1);
}

console.log(`Đã nạp ${data.length} bài:`);
for (const row of data) {
  console.log(`  /bai-viet/${row.slug} — ${row.title}`);
}
