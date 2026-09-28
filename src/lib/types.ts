/** Kieu du lieu cho page spec sinh ra tu tools/parse-prototype.py */

export const PAGE_SLUGS = [
  "home",
  "trai-nghiem",
  "giai-phap",
  "cong-nghe",
  "dai-ly",
  "nhan-su",
] as const;

export type PageSlug = (typeof PAGE_SLUGS)[number];

export interface SliceVariant {
  readonly src: string;
  readonly scale: number;
}

export interface SliceSpec {
  /** Duong dan tinh trong /public (ban mac dinh @2x) */
  readonly src: string;
  /** Cac ban do phan giai cho srcset — man retina tai ban @3x. */
  readonly srcSet: readonly SliceVariant[];
  /** Toa do y trong canvas 1440px */
  readonly y: number;
  /** Chieu cao hien thi (CSS px) */
  readonly displayHeight: number;
  readonly intrinsicWidth: number;
  readonly intrinsicHeight: number;
  readonly bytes: number;
  readonly bytesByScale: Readonly<Record<string, number>>;
}

export interface NavSpec {
  readonly label: string;
  readonly href: string;
  readonly x: number;
  readonly active: boolean;
}

export type ItemTag = "div" | "a";

export interface ItemSpec {
  readonly id: string;
  readonly tag: ItemTag;
  /** Class goc tu Figma: herot | slogan | lbl | h | hi | p | pi | btn | raw | dark ... */
  readonly classes: readonly string[];
  readonly x: number;
  readonly y: number;
  readonly w: number | null;
  readonly h: number | null;
  /** Cac khai bao CSS inline con lai (font-size, color, --tri, ...) */
  readonly css: Readonly<Record<string, string>>;
  readonly href: string | null;
  /** Noi dung HTML goc (co the chua <br>, <span class="c-red">) */
  readonly html: string;
  /** Ban text thuan de tim kiem / hien thi trong admin */
  readonly text: string;
}

export interface ContactFormSpec {
  readonly y: number;
}

export interface PageSpec {
  readonly slug: PageSlug;
  readonly route: string;
  readonly title: string;
  readonly canvasWidth: number;
  readonly height: number;
  readonly slices: readonly SliceSpec[];
  readonly nav: readonly NavSpec[];
  readonly items: readonly ItemSpec[];
  readonly contactForm: ContactFormSpec | null;
}

export interface PageIndexEntry {
  readonly slug: PageSlug;
  readonly route: string;
  readonly title: string;
  readonly height: number;
  readonly items: number;
  readonly slices: number;
}

/** Ban ghi ghi de noi dung do admin tao (bang page_items trong Supabase) */
export interface ItemOverride {
  readonly itemId: string;
  readonly slug: PageSlug;
  readonly html: string | null;
  readonly href: string | null;
  readonly hidden: boolean;
  readonly updatedAt: string;
}

export interface Lead {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly message: string | null;
  readonly sourcePage: string;
  readonly status: LeadStatus;
  readonly note: string | null;
  readonly createdAt: string;
}

export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABEL: Readonly<Record<LeadStatus, string>> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  qualified: "Tiềm năng",
  won: "Chốt đơn",
  lost: "Không thành",
};
