import raw from "@/data/cta-links.json";

/**
 * Cac nut chu "XEM THÊM" / "TÌM HIỂU THÊM" ve san trong anh trang con.
 *
 * Toa do lay tu ket qua OCR cua chinh frame thiet ke (tools/match-cta.py).
 * Nut nao co trang chi tiet that thi tro thang toi do; nut con lai mo mot bang
 * cho biet noi dung dang duoc cap nhat — KHONG bia ra bai viet khong co that.
 */

export interface CtaSpot {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** Tieu de bai viet doc duoc ngay phia tren nut. */
  readonly heading: string;
  /** Thiet ke dung tieu de mau "TÊN BÀI VIẾT" — bai nay chua co noi dung that. */
  readonly isPlaceholder: boolean;
  /** Chi co khi tim duoc trang chi tiet khop tieu de. */
  readonly href?: string;
  /**
   * Noi dung bai doc duoc tu chinh anh thiet ke, GOM CA phan bi lop mo che.
   * Nho vay bam "XEM THÊM" moi co gi de xo ra thay vi chi bao "dang cap nhat".
   */
  readonly body: readonly string[];
  /**
   * Hop bao cua khoi chu trong ban thiet ke. Bam "XEM THÊM" thi phan con lai
   * duoc xo ra DUNG CHO nay — khong mo lop phu nao.
   */
  readonly bodyBox: {
    /** Cac DOAN nhom san theo khoang cach dong doc tu ban thiet ke. */
    readonly paragraphs: readonly string[];
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    /** Co chu va khoang dong DO TU ban thiet ke — phan xo ra phai giong het. */
    readonly fontSize: number;
    readonly lineHeight: number;
    /** Khoang cach THEM giua hai doan, ngoai khoang dong. */
    readonly paragraphGap: number;
  } | null;
  /**
   * Nut DO ve san bao quanh chu "XEM THÊM", do bang tools/detect-buttons.py.
   * Mang che phai phu kin ca cai nay, khong thi mep do con tho ra ben canh nut
   * "Thu gọn" cua ta. Nut nao khong nam trong khung do nao thi khong co truong
   * nay.
   */
  readonly coverBox?: {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
  };
  /** Mau nen lay tu chinh ban thiet ke tai cho do, de khoi xo ra hoa dung nen. */
  readonly background?: string;
  /** Nen sang thi chu phai toi. */
  readonly darkText?: boolean;
}

const SPOTS = raw as Readonly<Record<string, readonly CtaSpot[]>>;

/**
 * Do dai toi da cua mot dong DAY trong cot bai viet. Dong ngan hon nhieu so voi
 * cac dong xung quanh la dong KET doan — sau no phai xuong dong moi.
 */
const SHORT_LINE_RATIO = 0.72;

/** Dau ket cau — dong ket doan bao gio cung ket thuc bang mot trong so nay. */
const SENTENCE_END = /[.!?:…]["')\]]?$/;

/**
 * Ghep cac dong OCR thanh doan van.
 *
 * OCR tra ve TUNG DONG cua bai. Neu moi dong lam mot doan thi doc rat roi: chu
 * bi ngat giua cau, va khi can giua thi thanh mot mo chu le. Cach nhan biet cho
 * xuong dong that: dong do vua NGAN hon han cac dong khac, vua ket thuc bang
 * dau cham — dung dac trung cua doan van can deu.
 */
export function toParagraphs(lines: readonly string[]): readonly string[] {
  const cleaned = lines.map((line) => line.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return [];
  }

  const longest = Math.max(...cleaned.map((line) => line.length));
  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const line of cleaned) {
    current.push(line);
    const endsParagraph =
      SENTENCE_END.test(line) && line.length <= longest * SHORT_LINE_RATIO;
    if (endsParagraph) {
      paragraphs.push(current.join(" "));
      current = [];
    }
  }
  if (current.length > 0) {
    paragraphs.push(current.join(" "));
  }
  return paragraphs;
}

export function getCtaSpots(slug: string): readonly CtaSpot[] {
  return SPOTS[slug] ?? [];
}

export interface CtaStats {
  readonly total: number;
  readonly linked: number;
  readonly placeholder: number;
  readonly pending: number;
}

export function getCtaStats(): CtaStats {
  const all = Object.values(SPOTS).flat();
  const linked = all.filter((s) => Boolean(s.href)).length;
  const placeholder = all.filter((s) => s.isPlaceholder).length;
  return {
    total: all.length,
    linked,
    placeholder,
    pending: all.length - linked - placeholder,
  };
}

/** Khoang ho ra duoi cung cua mang che, de vien duoi khong sat chu. */
const PANEL_PAD = 6;

/**
 * Noi them ra HAI BEN va PHIA DUOI.
 *
 * Nut do ve san ket thuc dung o mep mang che, nhung anh nen la ban @2x thu nho
 * nen mep do bi khu rang cua — con lai nua diem anh mau do ngay ben ngoai.
 * Noi them 2px la het. Khong noi len TREN: mep tren phai trung voi dong chu
 * dau tien, xe dich la thay ngay.
 *
 * An toan vi mang che to dung MAU NEN lay tu chinh cho do trong ban thiet ke,
 * nen 2px them chi to lai dung mau von co o day.
 */
const OVERSCAN = 2;

export interface ReadMorePanel {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly minHeight: number;
}

/**
 * Khung cua mang che khi bam "XEM THÊM".
 *
 * Mang nay khong phai lop phu: no dung DUNG CHO khoi chu trong thiet ke va dai
 * xuong de len phan ben duoi. Nen no phai bao tron HAI thu:
 *   - khoi chu (de phan xo ra noi tiep lien mach voi phan dang hien), va
 *   - nut "XEM THÊM" ve chet trong anh nen — khong che kin thi nguoi dung thay
 *     ca nut ve san lan nut "Thu gọn" cua ta cung luc.
 *
 * Nut do trong thiet ke rong 159px trong khi khoi chu chi rong 306px va le
 * trai lech nhau, nen lay rieng khoi chu lam khung se ho mot mau do o mep phai.
 */
export function readMorePanel(spot: CtaSpot): ReadMorePanel | null {
  const box = spot.bodyBox;
  if (!box) {
    return null;
  }
  // Vung bam luon phai duoc che; nut do (neu do duoc) con rong hon vung bam.
  const cover = spot.coverBox ?? { x: spot.x, y: spot.y, w: spot.w, h: spot.h };
  const left = Math.min(box.x, cover.x, spot.x);
  const top = Math.min(box.y, cover.y, spot.y);
  const right = Math.max(box.x + box.width, cover.x + cover.w, spot.x + spot.w);
  const bottom = Math.max(
    box.y + box.height,
    cover.y + cover.h,
    spot.y + spot.h,
  );
  // Lam tron RA NGOAI. Toa do do tu OCR le den mot chu so thap phan, va thieu
  // 0,02px cung du de mot soi do cua nut ve san lo ra o mep — trinh duyet khu
  // rang cua se to no thanh mot duong mo nhin thay ro.
  const x0 = Math.floor(left) - OVERSCAN;
  const y0 = Math.floor(top);
  return {
    left: x0,
    top: y0,
    width: Math.ceil(right) + OVERSCAN - x0,
    minHeight: Math.ceil(bottom) + OVERSCAN - y0 + PANEL_PAD,
  };
}

/**
 * Nut nay co gi de nguoi dung bam khong?
 *
 * Co hai duong: dan sang trang chi tiet (`href`), hoac xo khoi chu ra
 * (`bodyBox`). Khong co duong nao thi dung dat vung bam trong suot len chu
 * "XEM THÊM" ve san — bam ma khong xay ra gi con lam nguoi dung tuong trang
 * hong hon la de no khong bam duoc.
 */
export function hasSomethingToShow(spot: CtaSpot): boolean {
  return Boolean(spot.href) || spot.bodyBox !== null;
}
