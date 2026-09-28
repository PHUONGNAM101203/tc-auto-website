/**
 * Lam sach doan HTML inline truoc khi render qua dangerouslySetInnerHTML.
 *
 * Noi dung goc den tu page spec (do chinh ta sinh ra) NHUNG admin duoc phep
 * chinh sua, nen van phai loc. Chi cho phep dung cac the trang tri ma thiet ke
 * Figma thuc su dung: <br>, <span>, <b>, <strong>, <i>, <em>, <div>.
 *
 * Giu lai `class` (de con .c-red / .c-blue / .ub800) va `style` nhung CHI voi
 * cac thuoc tinh typography trong allowlist — mot so khoi trong thiet ke Figma
 * (vi du "3M | NANO SUN | 5DO") mang font-size/line-height inline, xoa di la
 * lech pixel. Moi thuoc tinh co kha nang tai tai nguyen ngoai hoac chay code
 * (background, behavior, -moz-binding...) deu bi loai.
 */

const ALLOWED_TAGS = new Set(["br", "span", "b", "strong", "i", "em", "div"]);
const VOID_TAGS = new Set(["br"]);
const CLASS_ALLOWLIST = /^[A-Za-z0-9 _-]{0,120}$/;

/** Thuoc tinh CSS inline duoc phep — thuan typography, khong tai tai nguyen. */
const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "font-family",
  "font-size",
  "font-style",
  "font-variant",
  "font-weight",
  "letter-spacing",
  "line-height",
  "opacity",
  "text-align",
  "text-decoration",
  "text-transform",
  "white-space",
  "word-spacing",
]);

/** Ky tu duoc phep trong gia tri: chu, so, khoang trang va dau cham cau CSS. */
const STYLE_VALUE_SAFE = /^[A-Za-z0-9\s#.,%'"()/_-]{1,160}$/;

/** Chuoi nguy hiem: tai tai nguyen ngoai hoac chay code. */
const STYLE_VALUE_BANNED = /url\(|image-set\(|expression|javascript:|data:|@import|\\/i;

const ENTITY_MAP: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Entity da hop le (&amp; &#39; &#x2F; ...) — khong escape lai, neu khong
 * "&amp;" se thanh "&amp;amp;" va hien thi ra chu "&amp;" tren trang.
 */
const EXISTING_ENTITY = /&(?:[a-zA-Z][a-zA-Z0-9]{1,31}|#\d{1,7}|#[xX][0-9a-fA-F]{1,6});/;

function escapeText(value: string): string {
  return value.replace(/[&<>"']/g, (char, at: number, whole: string) => {
    if (char === "&" && EXISTING_ENTITY.test(whole.slice(at, at + 34))) {
      return "&";
    }
    return ENTITY_MAP[char] ?? char;
  });
}

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^<>]*?)?)\/?>/g;

/**
 * Tra ve HTML da loc. The khong hop le bi bo (ke ca noi dung cua <script>),
 * text duoc escape lai dung cach.
 */
export function sanitizeInlineHtml(input: string): string {
  if (!input) {
    return "";
  }

  // Bo hoan toan script/style ke ca noi dung ben trong truoc khi loc the.
  const stripped = input.replace(
    /<(script|style|iframe|object|embed)\b[\s\S]*?(<\/\1\s*>|$)/gi,
    "",
  );

  const open: string[] = [];
  let out = "";
  let cursor = 0;

  for (const match of stripped.matchAll(TAG_RE)) {
    const at = match.index;
    out += escapeText(stripped.slice(cursor, at));
    cursor = at + match[0].length;

    const tag = match[1].toLowerCase();
    const isClosing = match[0].startsWith("</");

    if (!ALLOWED_TAGS.has(tag)) {
      continue;
    }

    if (VOID_TAGS.has(tag)) {
      if (!isClosing) {
        out += `<${tag}>`;
      }
      continue;
    }

    if (isClosing) {
      const last = open.lastIndexOf(tag);
      if (last !== -1) {
        // Dong dung thu tu lo-ng vao.
        for (let i = open.length - 1; i >= last; i -= 1) {
          out += `</${open[i]}>`;
        }
        open.length = last;
      }
      continue;
    }

    const attrs = match[2] ?? "";
    const className = readClass(attrs);
    const style = readStyle(attrs);
    out +=
      `<${tag}` +
      (className ? ` class="${className}"` : "") +
      (style ? ` style="${style}"` : "") +
      ">";
    open.push(tag);
  }

  out += escapeText(stripped.slice(cursor));

  // Dong cac the con mo.
  for (let i = open.length - 1; i >= 0; i -= 1) {
    out += `</${open[i]}>`;
  }

  return out;
}

/**
 * Loc thuoc tinh style: chi giu cap property/value nam trong allowlist.
 * Tra ve null neu khong con khai bao nao hop le.
 */
function readStyle(attrs: string): string | null {
  const match = /\bstyle\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs);
  const raw = match?.[2] ?? match?.[3];
  if (!raw) {
    return null;
  }

  const kept: string[] = [];
  for (const declaration of raw.split(";")) {
    const at = declaration.indexOf(":");
    if (at < 0) {
      continue;
    }
    const prop = declaration.slice(0, at).trim().toLowerCase();
    const value = declaration.slice(at + 1).trim();

    if (!ALLOWED_STYLE_PROPS.has(prop)) {
      continue;
    }
    if (!STYLE_VALUE_SAFE.test(value) || STYLE_VALUE_BANNED.test(value)) {
      continue;
    }
    kept.push(`${prop}:${value}`);
  }

  return kept.length > 0 ? escapeText(kept.join(";")) : null;
}

function readClass(attrs: string): string | null {
  const match = /\bclass\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs);
  const value = match?.[2] ?? match?.[3];
  if (!value || !CLASS_ALLOWLIST.test(value)) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? escapeText(trimmed) : null;
}

const BR_RE = /<br\s*\/?>/gi;

/**
 * Tach noi dung tieu de theo <br> de lam hieu ung wipe theo tung dong.
 * Moi phan tu tra ve la HTML da sanitize.
 */
export function splitHeadingLines(html: string): readonly string[] {
  return html
    .split(BR_RE)
    .map((line) => sanitizeInlineHtml(line).trim())
    .filter((line) => line.length > 0);
}
