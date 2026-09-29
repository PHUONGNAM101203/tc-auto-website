import { describe, expect, it } from "vitest";
import { getMobileBlocks, getMobileHero } from "@/lib/mobile-subpage";
import { getAllSubPages, getSubPage } from "@/lib/subpages";

/**
 * Ban mobile cua 31 trang con.
 *
 * Trang con duoc dung tu PNG thiet ke, nen tren dien thoai khong the thu nho
 * ca trang xuong — chu se khong doc noi. Thay vao do noi dung duoc dung LAI tu
 * lop van ban OCR cong voi cac lat anh cat tu chinh trang.
 *
 * Day la cho de sai am tham nhat trong du an: gate pixel chi do ban desktop,
 * nen ban mobile hong ma khong co gi bao. Cac test duoi day canh dung nhung
 * cai da tung hong that.
 */
describe("bản mobile của trang con", () => {
  const pages = getAllSubPages();

  it("mọi trang con đều dựng được nội dung, không trang nào trắng", () => {
    for (const page of pages) {
      const spec = getSubPage(page.slug);
      expect(spec, page.slug).toBeTruthy();
      const blocks = getMobileBlocks(spec!);
      expect(blocks.length, `${page.slug} không có khối nào`).toBeGreaterThan(0);
    }
  });

  it("khối nào cũng có nội dung đọc được hoặc một tấm ảnh", () => {
    for (const page of pages) {
      for (const block of getMobileBlocks(getSubPage(page.slug)!)) {
        if (block.kind === "figure") {
          expect(block.image, `${page.slug} figure thiếu ảnh`).toBeTruthy();
        } else {
          expect(block.text.trim().length, `${page.slug}/${block.kind}`).toBeGreaterThan(
            0,
          );
        }
      }
    }
  });

  it("các khối xếp theo đúng thứ tự đọc từ trên xuống", () => {
    // Thu tu sai la doan van dan xen vao nhau, doc ra vo nghia — day chinh la
    // ly do `toColumns` phai gom theo cot truoc khi doc.
    for (const page of pages) {
      const ys = getMobileBlocks(getSubPage(page.slug)!).map((b) => b.y);
      const sorted = [...ys].sort((a, b) => a - b);
      expect(ys, page.slug).toEqual(sorted);
    }
  });

  it("đã lọc sạch chữ trên các nút vẽ sẵn", () => {
    // Nut da co phan tu that rieng; de chu do lai trong phan doc la lap noi
    // dung, va OCR con dinh ca dau ">" phia truoc.
    const BUTTONS = [
      "TÌM HIỂU THÊM",
      "XEM THÊM",
      "KHÁM PHÁ NGAY",
      "THAM GIA TUYỂN DỤNG",
      "GỬI",
    ];
    for (const page of pages) {
      for (const block of getMobileBlocks(getSubPage(page.slug)!)) {
        const bare = block.text.replace(/^[>›»\s]+/, "").trim().toUpperCase();
        for (const word of BUTTONS) {
          expect(bare, `${page.slug}: còn chữ nút "${word}"`).not.toBe(word);
        }
      }
    }
  });

  it("không có khối nào rơi vào vùng header hay chân trang", () => {
    for (const page of pages) {
      const spec = getSubPage(page.slug)!;
      for (const block of getMobileBlocks(spec)) {
        expect(block.y, `${page.slug} lọt lên header`).toBeGreaterThan(0);
        expect(block.y, `${page.slug} lọt xuống chân trang`).toBeLessThan(
          spec.height,
        );
      }
    }
  });

  it("ảnh xen vào đúng mạch đọc chứ không dồn hết xuống cuối", () => {
    // Co it nhat mot trang co anh nam GIUA cac khoi chu — neu tat ca anh deu
    // o cuoi thi buoc xen anh theo toa do da hong.
    const interleaved = pages.some((page) => {
      const blocks = getMobileBlocks(getSubPage(page.slug)!);
      const figure = blocks.findIndex((b) => b.kind === "figure");
      return figure > 0 && figure < blocks.length - 1;
    });
    expect(interleaved).toBe(true);
  });

  it("tiêu đề luôn ngắn hơn đoạn văn", () => {
    // `looksLikeHeading` chan o 60 ky tu. Nhan nham mot doan giua cau lam tieu
    // de thi doan van bi dut lam doi.
    for (const page of pages) {
      for (const block of getMobileBlocks(getSubPage(page.slug)!)) {
        if (block.kind === "heading") {
          expect(block.text.length, `${page.slug}: "${block.text}"`).toBeLessThanOrEqual(
            60,
          );
        }
      }
    }
  });

  it("không có hai khối chữ trùng nhau liền kề", () => {
    // OCR doc cung mot cau o hai cho hay lech vai ky tu; buoc gop doan phai
    // nhan ra chung la mot.
    for (const page of pages) {
      const texts = getMobileBlocks(getSubPage(page.slug)!)
        .filter((b) => b.kind !== "figure")
        .map((b) => b.text);
      for (let i = 1; i < texts.length; i += 1) {
        expect(texts[i], `${page.slug} lặp khối`).not.toBe(texts[i - 1]);
      }
    }
  });
});

describe("ảnh đầu trang bản mobile", () => {
  it("trang nào có ảnh riêng thì trả về đường dẫn có dấu phiên bản", () => {
    const withHero = getAllSubPages()
      .map((page) => getMobileHero(page.slug))
      .filter((hero): hero is string => hero !== null);
    expect(withHero.length).toBeGreaterThan(0);
    for (const hero of withHero) {
      expect(hero).toMatch(/^\/mobile\/sub\/.+\.webp\?v=[a-z0-9]+$/);
    }
  });

  it("đường dẫn lạ thì trả null chứ không ném lỗi", () => {
    expect(getMobileHero("khong-ton-tai")).toBeNull();
  });
});
