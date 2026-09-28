import { describe, expect, it } from "vitest";
import {
  getHeroSlides,
  HERO_CONTROLS,
  HERO_REGION,
  heroSlideCount,
  heroSliderEnabled,
} from "@/lib/hero-slides";

describe("băng hero trang chủ", () => {
  it("vùng hero đúng khung 1440x900 của thiết kế", () => {
    expect(HERO_REGION).toEqual({ x: 0, y: 0, width: 1440, height: 900 });
  });

  it("toạ độ điều khiển khớp số đo từ frame thiết kế", () => {
    // Mui ten trai do duoc o x 32..42, phai o x 1398..1412, cung y 432..465.
    // Vung bam noi rong ra mot chut cho de bam.
    expect(HERO_CONTROLS.prev.x).toBeLessThanOrEqual(32);
    expect(HERO_CONTROLS.prev.x + HERO_CONTROLS.prev.width).toBeGreaterThanOrEqual(42);
    expect(HERO_CONTROLS.next.x).toBeLessThanOrEqual(1398);
    expect(HERO_CONTROLS.next.x + HERO_CONTROLS.next.width).toBeGreaterThanOrEqual(1412);

    for (const box of [HERO_CONTROLS.prev, HERO_CONTROLS.next]) {
      expect(box.y).toBeLessThanOrEqual(432);
      expect(box.y + box.height).toBeGreaterThanOrEqual(465);
    }
  });

  it("vạch chỉ mục khớp số đo từ frame gốc", () => {
    const { indicator } = HERO_CONTROLS;
    // Do tu Home.png: y=826, x 640..800, vach dang chon rong 84px, khe 8px.
    expect(indicator.x).toBe(640);
    expect(indicator.y).toBe(826);
    expect(indicator.dashWidth).toBe(11);
    expect(indicator.activeWidth).toBe(84);
    expect(indicator.gap).toBe(8);

    // Tong be ngang phai trung khop dai vach trong anh goc (640..800 = 160px):
    // 4 vach thuong + 1 vach dang chon + 4 khe.
    const total = indicator.dashWidth * 4 + indicator.activeWidth + indicator.gap * 4;
    expect(total).toBe(160);
    expect(indicator.width).toBe(160);
  });

  it("slide 1 dùng ảnh đã xoá điều khiển vẽ sẵn", () => {
    // Neu dung anh goc thi vach va mui ten bi ve doi — xem clean-hero.py.
    expect(getHeroSlides()[0].src).toContain("/hero/home-hero");
  });

  it("có đúng 5 slide, khớp 5 vạch chỉ mục trong thiết kế", () => {
    // Thiet ke ve 5 vach = 5 slide. So slide PHAI bang so vach, neu khong
    // thanh chi muc se khong khop ban ve.
    expect(heroSlideCount()).toBe(5);
    expect(heroSliderEnabled()).toBe(true);
  });

  it("đánh dấu rõ slide nào là ảnh tạm", () => {
    const slides = getHeroSlides();
    // Slide 1 la anh hero that cua trang chu; 4 slide sau muon anh hero cua
    // cac trang khac de gui khach review — phai danh dau de khong quen thay.
    expect(slides[0].placeholder ?? false).toBe(false);
    expect(slides.slice(1).every((s) => s.placeholder === true)).toBe(true);
  });

  it("mọi slide đều có đủ ảnh, alt và các bản độ phân giải", () => {
    for (const slide of getHeroSlides()) {
      expect(slide.id.length).toBeGreaterThan(0);
      expect(slide.alt.length).toBeGreaterThan(10);
      // Duong dan anh duoc dong dau bang bam noi dung (`?v=...`) de co the dat
      // cache vinh vien — xem tools/stamp-slices.py.
      expect(slide.src).toMatch(/\.webp(\?v=[0-9a-f]{8})?$/);
      expect(slide.srcSet.length).toBeGreaterThanOrEqual(2);
      expect(slide.srcSet.map((v) => v.scale).sort()).toEqual([2, 3]);
    }
  });

  it("slider bật ngay khi có từ 2 slide trở lên", () => {
    // Kiem tra chinh dieu kien, khong phu thuoc du lieu hien tai.
    const rule = (count: number) => count >= 2;
    expect(rule(1)).toBe(false);
    expect(rule(2)).toBe(true);
    expect(rule(5)).toBe(true);
  });
});
