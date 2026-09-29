import { describe, expect, it } from "vitest";
import spots from "@/data/cta-links.json";
import { getCtaSpots, readMorePanel, type CtaSpot } from "@/lib/cta-links";

/**
 * Khoi chu xo ra khi bam "XEM THÊM".
 *
 * ── Vi sao co cac rang buoc nay ─────────────────────────────────────────────
 * Noi dung khoi duoc doc bang OCR tu chinh ban thiet ke: lay cac dong chu nam
 * GIUA tieu de va nut. Khi OCR khong nhan ra tieu de, pham vi "giua" bat dau tu
 * DINH TRANG — va the la khoi nuot tron moi thu trong cot do. Tren
 * /giai-phap/man-hinh no tro thanh mot mang xam cao 1036px phu kin ca the san
 * pham, chu xam tren nen xam, ghep lan lon "CLARITY... BRAVO... 19:00 | 2524".
 *
 * 30 tren 109 nut tung dinh loi nay. Hai rang buoc duoi day chan dung cai
 * nguyen nhan do, chu khong phai vá tung trang.
 */
type Spot = {
  readonly x: number;
  readonly y: number;
  readonly body?: readonly string[];
  readonly bodyBox?: { readonly y: number; readonly height: number } | null;
};

const ALL: ReadonlyArray<readonly [string, Spot]> = Object.entries(
  spots as Record<string, readonly Spot[]>,
).flatMap(([slug, list]) => list.map((spot) => [slug, spot] as const));

/** Khop voi HEADING_LOOKBACK trong tools/match-cta.py. */
const MAX_REACH = 520;

describe("khối chữ xổ ra của nút XEM THÊM", () => {
  it("có nút để kiểm tra", () => {
    expect(ALL.length).toBeGreaterThan(50);
  });

  it("không với ngược lên quá xa phía trên nút", () => {
    for (const [slug, spot] of ALL) {
      if (!spot.bodyBox) continue;
      const reach = spot.y - spot.bodyBox.y;
      expect(reach, `${slug} tại y=${spot.y} với lên ${reach.toFixed(0)}px`).
        toBeLessThanOrEqual(MAX_REACH);
    }
  });

  it("không cao hơn khoảng cách tới nút — khối phải nằm gọn phía trên", () => {
    for (const [slug, spot] of ALL) {
      if (!spot.bodyBox) continue;
      expect(
        spot.bodyBox.height,
        `${slug} tại y=${spot.y} cao ${spot.bodyBox.height.toFixed(0)}px`,
      ).toBeLessThanOrEqual(MAX_REACH);
    }
  });

  it("không gom nhầm cả trang: mỗi khối tối đa 20 dòng", () => {
    // Hai rang buoc hinh hoc phia tren moi la cai chan that. Day chi la cai
    // luoi tho phong khi co kieu gom nham khac.
    //
    // 20 chu khong phai 12: khoi dai NHAT ma thiet ke that su co la doan mo
    // bai "CÔNG NGHỆ MỚI" tren /cong-nghe/tien-phong-cong-nghe — 14 dong, ba
    // doan, rong 747px. Do la noi dung that, khong phai rac.
    for (const [slug, spot] of ALL) {
      const lines = spot.body?.length ?? 0;
      expect(lines, `${slug} tại y=${spot.y} có ${lines} dòng`).
        toBeLessThanOrEqual(20);
    }
  });
});

/**
 * Khung cua mang che khi xo noi dung ra.
 *
 * Mang phai che KIN chu "XEM THÊM" da ve chet trong anh nen, khong thi nguoi
 * dung thay ca hai cung luc: nut ve san va nut "Thu gọn" cua ta. Chu "XEM THÊM"
 * trong thiet ke nam trong mot NUT DO rong 159px, trong khi khoi chu phia tren
 * chi rong 306px va le trai lech nhau — nen lay khoi chu lam khung la ho mat
 * mot mau do o mep phai.
 */
describe("khung mảng che của khối xổ ra", () => {
  const spot = (extra: Partial<CtaSpot>): CtaSpot => ({
    x: 1202, y: 1497, w: 106, h: 36,
    heading: "", isPlaceholder: false, body: [],
    bodyBox: {
      paragraphs: [], x: 1019, y: 1365, width: 306, height: 107,
      fontSize: 14, lineHeight: 17, paragraphGap: 23,
    },
    ...extra,
  }) as CtaSpot;

  it("chưa đọc được khối chữ thì không có mảng nào", () => {
    expect(readMorePanel(spot({ bodyBox: null }))).toBeNull();
  });

  it("che kín nút đỏ vẽ sẵn, kể cả phần thò ra ngoài khối chữ", () => {
    // Nut do that: x 1175..1334. Khoi chu: x 1019..1325. Thieu 9px o mep phai.
    const panel = readMorePanel(
      spot({ coverBox: { x: 1175, y: 1498, w: 159, h: 32 } } as Partial<CtaSpot>),
    )!;
    expect(panel.left).toBeLessThanOrEqual(1019);
    expect(panel.left + panel.width).toBeGreaterThanOrEqual(1175 + 159);
    expect(panel.top).toBeLessThanOrEqual(1365);
    expect(panel.top + panel.minHeight).toBeGreaterThanOrEqual(1498 + 32);
  });

  it("làm tròn ra ngoài, không để hở sợi nào ở mép", () => {
    // Nut do that o x 1175..1334 con khoi chu o 1019,3..1325,3: cong lai ra
    // 1333,98 — thieu 0,02px, du de lo mot soi do sau khi khu rang cua.
    const panel = readMorePanel(
      spot({ coverBox: { x: 1175, y: 1498, w: 159, h: 32 } } as Partial<CtaSpot>),
    )!;
    expect(Number.isInteger(panel.left)).toBe(true);
    expect(Number.isInteger(panel.top)).toBe(true);
    // Phai VUOT mep nut do, khong chi cham toi: anh nen @2x lam mep do bi khu
    // rang cua nen con nua diem anh do ngay ben ngoai.
    expect(panel.left + panel.width).toBeGreaterThan(1334);
    expect(panel.left).toBeLessThan(1019);
  });

  it("không có nút đỏ thì vẫn che hết vùng bấm", () => {
    const panel = readMorePanel(spot({}))!;
    expect(panel.left + panel.width).toBeGreaterThanOrEqual(1202 + 106);
    expect(panel.top + panel.minHeight).toBeGreaterThanOrEqual(1497 + 36);
  });

  it("mọi nút thật trên site đều có mảng che kín vùng bấm của nó", () => {
    for (const slug of Object.keys(spots as Record<string, unknown>)) {
      for (const real of getCtaSpots(slug)) {
        const panel = readMorePanel(real);
        if (!panel) continue;
        const where = `${slug} tại y=${real.y}`;
        expect(panel.left, where).toBeLessThanOrEqual(real.x);
        expect(panel.left + panel.width, where).toBeGreaterThanOrEqual(
          real.x + real.w,
        );
        expect(panel.top + panel.minHeight, where).toBeGreaterThanOrEqual(
          real.y + real.h,
        );
      }
    }
  });
});
