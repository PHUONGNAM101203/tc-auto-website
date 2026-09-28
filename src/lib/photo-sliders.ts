import data from "@/data/photo-sliders.json";

/**
 * Cac slider anh duoc ve chet trong ban thiet ke.
 *
 * Thiet ke ve mot tam anh kem mui ten "›" — y la con anh nua, keo di. Muon mui
 * ten do bam duoc thi vung anh phai la phan tu that.
 *
 * Slide DAU duoc cat tu chinh ban thiet ke nen luc dung yen man hinh trung khop
 * tuyet doi; cac slide sau lay tu bo tai nguyen roi. Xem
 * tools/brand/extract-photo-sliders.py.
 */

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PhotoSlider {
  readonly id: string;
  readonly label: string;
  readonly box: Box;
  /** Mui ten TIEN ve san trong anh — ta dat mot nut that dung cho do. */
  readonly arrow: Box;
  /** Mui ten LUI, neu thiet ke co ve (vi du muc "Con người TC"). */
  readonly prev?: Box;
  readonly slides: readonly string[];
}

const PAGES = (data as unknown as { pages: Record<string, readonly PhotoSlider[]> }).pages;

export function getPhotoSliders(slug: string): readonly PhotoSlider[] {
  return PAGES[slug] ?? [];
}

/** Slide ke tiep — chay vong, khong bao gio het. */
export function nextSlide(index: number, count: number): number {
  return count <= 0 ? 0 : (index + 1) % count;
}

/** Slide truoc do — cung chay vong. */
export function prevSlide(index: number, count: number): number {
  return count <= 0 ? 0 : (index - 1 + count) % count;
}
