import { getAllPageSpecs } from "./pages";
import { getAllPageText } from "./subpage-text";
import { getSubPage } from "./subpages";

export interface SearchHit {
  readonly pageTitle: string;
  readonly slug: string;
  readonly route: string;
  /** Id phan tu de nhay toi (trang chinh). Rong voi trang con dang anh. */
  readonly itemId: string;
  /** Toa do y trong canvas — dung de cuon toi dung doan tren trang con. */
  readonly y: number | null;
  readonly snippet: string;
  readonly score: number;
}

/** Bo dau tieng Viet + ha chu thuong de tim kiem khong phan biet dau. */
export function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

interface IndexEntry {
  readonly pageTitle: string;
  readonly slug: string;
  readonly route: string;
  readonly itemId: string;
  readonly y: number | null;
  readonly text: string;
  readonly haystack: string;
  readonly weight: number;
}

/** Tieu de duoc uu tien cao hon doan van. */
function weightFor(classes: readonly string[]): number {
  if (classes.includes("herot")) return 3;
  if (classes.includes("h") || classes.includes("hi")) return 2.5;
  if (classes.includes("lbl")) return 2.2;
  if (classes.includes("btn")) return 1.4;
  return 1;
}

/** Tieu de trang con duoc uu tien hon doan van. */
function weightForKind(kind: string): number {
  if (kind === "h2") return 2.5;
  if (kind === "h3") return 2.0;
  return 1;
}

function buildIndex(): readonly IndexEntry[] {
  // 6 trang chinh: van ban that, co id phan tu de nhay toi chinh xac.
  const mains = getAllPageSpecs().flatMap((page) =>
    page.items
      .filter((item) => item.text.length > 1)
      .map((item) => ({
        pageTitle: page.title,
        slug: page.slug as string,
        route: page.route,
        itemId: item.id,
        y: item.y,
        text: item.text,
        haystack: normalise(item.text),
        weight: weightFor(item.classes),
      })),
  );

  // 31 trang con: van ban trich bang OCR tu frame thiet ke.
  // Nhan he so 0.9 vi day la ket qua nhan dang, khong chac chan bang van ban goc.
  const subs = getAllPageText().flatMap(([slug, text]) => {
    const page = getSubPage(slug);
    if (!page) {
      return [];
    }
    return text.blocks
      .filter((block) => block.text.length > 1)
      .map((block) => ({
        pageTitle: page.title,
        slug,
        route: page.route,
        itemId: "",
        y: block.y,
        text: block.text,
        haystack: normalise(block.text),
        weight: weightForKind(block.kind) * 0.9,
      }));
  });

  return [...mains, ...subs];
}

const INDEX = buildIndex();

function snippetAround(text: string, haystack: string, needle: string, radius = 68): string {
  const at = haystack.indexOf(needle);
  if (at < 0 || text.length <= radius * 2) {
    return text.slice(0, radius * 2).trim();
  }
  const start = Math.max(0, at - radius);
  const end = Math.min(text.length, at + needle.length + radius);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

/** Tim kiem toan site tren text da extract tu Figma. */
export function searchSite(rawQuery: string, limit = 8): readonly SearchHit[] {
  const needle = normalise(rawQuery);
  if (needle.length < 2) {
    return [];
  }

  const hits: SearchHit[] = [];

  for (const entry of INDEX) {
    const at = entry.haystack.indexOf(needle);
    if (at < 0) {
      continue;
    }
    // Khop dau chuoi va khop tu tron duoc cong diem.
    const wholeWord = new RegExp(`(^|\\s)${escapeRegExp(needle)}(\\s|$)`).test(entry.haystack);
    const score = entry.weight * (at === 0 ? 2 : 1) * (wholeWord ? 1.6 : 1);

    hits.push({
      pageTitle: entry.pageTitle,
      slug: entry.slug,
      route: entry.route,
      itemId: entry.itemId,
      y: entry.y,
      snippet: snippetAround(entry.text, entry.haystack, needle),
      score,
    });
  }

  // Moi trang chi giu ket qua tot nhat — tranh mot trang dai chiem het danh sach.
  const bestPerPage = new Map<string, SearchHit>();
  for (const hit of hits) {
    const current = bestPerPage.get(hit.route);
    if (!current || hit.score > current.score) {
      bestPerPage.set(hit.route, hit);
    }
  }

  return [...bestPerPage.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
