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
