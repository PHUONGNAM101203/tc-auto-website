import { describe, expect, it } from "vitest";
import { getFaq } from "@/lib/faq";
import { GALLERY_CENTRE, GALLERY_STEP, getGalleryPhotos } from "@/lib/gallery";
import { getMainHotspots } from "@/lib/main-hotspots";
import { getMobileLinks } from "@/lib/mobile-links";
import {
  filterOptions,
  getScreenModels,
  has360,
  is2K,
} from "@/lib/screen-catalogue";
import { getAllSubPages } from "@/lib/subpages";

/**
 * Cac bo du lieu them vao ngay 30/09–01/10/2026.
 *
 * Diem canh chung cua ca nhom: chung deu la BANG TRA CUU theo khoa (slug hoac
 * toa do). Go sai mot khoa thi ham tra ve rong ma khong ai biet — nen moi bo
 * deu phai co mot phep kiem "khoa tro dung cho co that".
 */

describe("câu hỏi thường gặp", () => {
  const items = getFaq();

  it("có câu, câu nào cũng đủ hỏi và đáp", () => {
    expect(items.length).toBeGreaterThanOrEqual(8);
    for (const item of items) {
      expect(item.question.trim().endsWith("?"), item.question).toBe(true);
      expect(item.answer.trim().length, item.question).toBeGreaterThan(60);
    }
  });

  it("không câu nào hỏi trùng nhau", () => {
    const seen = items.map((i) => i.question);
    expect(new Set(seen).size).toBe(seen.length);
  });
});

describe("dải ảnh BỘ SƯU TẬP", () => {
  it("chỉ trang Khoảnh khắc mới có, trang khác trả rỗng", () => {
    expect(getGalleryPhotos("trai-nghiem/khoanh-khac").length).toBe(3);
    expect(getGalleryPhotos("trai-nghiem/hanh-trinh")).toEqual([]);
    expect(getGalleryPhotos("khong/co/that")).toEqual([]);
  });

  it("hình học đo từ thiết kế, không phải số tròn gõ tay", () => {
    expect(GALLERY_CENTRE.width).toBeGreaterThan(400);
    expect(GALLERY_CENTRE.height).toBeGreaterThan(300);
    // Buoc phai RONG hon the giua, khong thi hai the chong len nhau.
    expect(GALLERY_STEP).toBeGreaterThan(GALLERY_CENTRE.width);
  });
});

describe("vùng bấm thêm trên trang chính", () => {
  it("chỉ trang Giải pháp có, và trỏ tới trang có thật", () => {
    const spots = getMainHotspots("giai-phap");
    expect(spots.length).toBeGreaterThan(0);
    for (const spot of spots) {
      expect(spot.href.startsWith("/")).toBe(true);
      expect(spot.label.trim().length).toBeGreaterThan(0);
      // Vung bam phai du to de bam.
      expect(Math.min(spot.w, spot.h)).toBeGreaterThanOrEqual(24);
    }
    expect(getMainHotspots("home")).toEqual([]);
    expect(getMainHotspots("khong-co")).toEqual([]);
  });
});

describe("liên kết trong trang cho bản điện thoại", () => {
  it("gộp liên kết trùng nhau thay vì liệt kê lặp", () => {
    // Sau the tren trang Loa deu tro ve cung mot trang va deu khong co tieu
    // de rieng — liet ke ca sau la sau dong y het.
    const links = getMobileLinks("giai-phap/loa");
    const keys = links.map((l) => `${l.href}|${l.label}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("tệp tải của hãng được đánh dấu là liên kết ra ngoài", () => {
    const links = getMobileLinks("cong-nghe/ung-dung/kho-ung-dung");
    const outside = links.filter((l) => l.href.startsWith("http"));
    expect(outside.length).toBeGreaterThanOrEqual(15);
    for (const link of outside) {
      expect(link.external, link.href).toBe(true);
    }
  });

  it("nhãn nào cũng có chữ — không thì bản điện thoại hiện dòng trống", () => {
    for (const page of getAllSubPages()) {
      for (const link of getMobileLinks(page.slug)) {
        expect(link.label.trim().length, `${page.slug} -> ${link.href}`)
          .toBeGreaterThan(0);
      }
    }
  });

  it("trang không có liên kết nào thì trả rỗng, không nổ", () => {
    expect(getMobileLinks("khong/co/that")).toEqual([]);
  });
});

describe("danh mục màn hình", () => {
  const models = getScreenModels();

  it("mẫu nào cũng đủ trường để dựng thẻ", () => {
    expect(models.length).toBeGreaterThanOrEqual(19);
    for (const model of models) {
      for (const key of ["name", "brand", "family", "size", "resolution"] as const) {
        expect(model[key].trim().length, `${model.slug}.${key}`).toBeGreaterThan(0);
      }
      expect(model.source, model.slug).toMatch(/^https:\/\/wincavn\.com\//);
      expect(model.image, model.slug).toBeTruthy();
    }
  });

  it("slug không trùng nhau", () => {
    const slugs = models.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("bộ lọc sinh TỪ dữ liệu, không gõ tay", () => {
    const options = filterOptions();
    for (const brand of options.brands) {
      expect(models.some((m) => m.brand === brand)).toBe(true);
    }
    for (const size of options.sizes) {
      expect(models.some((m) => m.size === size)).toBe(true);
    }
    // Moi mau phai roi vao MOT lua chon cua tung bo loc — khong mau nao lot
    // ra ngoai het moi bo loc.
    for (const model of models) {
      expect(options.brands).toContain(model.brand);
      expect(options.sizes).toContain(model.size);
    }
  });

  it("nhận ra camera 360 và màn 2K từ chính dòng mô tả", () => {
    const pro = models.filter(has360);
    expect(pro.length).toBeGreaterThan(0);
    for (const model of pro) {
      expect(model.camera, model.slug).toContain("360");
    }
    for (const model of models.filter(is2K)) {
      expect(model.resolution, model.slug).toMatch(/2K|1920 × 1200/);
    }
    // Mau khong phai 2K thi phai that su khong phai.
    for (const model of models.filter((m) => !is2K(m))) {
      expect(model.resolution, model.slug).not.toContain("2K");
    }
  });
});
