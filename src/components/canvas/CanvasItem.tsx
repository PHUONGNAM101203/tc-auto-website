import Link from "next/link";
import type { CSSProperties } from "react";
import { sanitizeInlineHtml, splitHeadingLines } from "@/lib/sanitize";
import type { ItemSpec } from "@/lib/types";
import { cssToStyle } from "./cssToStyle";

/** Class tieu de -> dung hieu ung wipe theo dong thay vi fade-up ca khoi. */
const HEADING_CLASSES = new Set(["herot", "h", "hi", "slogan"]);

/** Huong reveal chon theo loai phan tu, giu cam giac tu nhien theo mat doc. */
function revealDirection(classes: readonly string[]): string {
  if (classes.includes("lbl")) return "left";
  if (classes.includes("btn")) return "scale";
  return "up";
}

function boxStyle(item: ItemSpec): CSSProperties {
  return {
    left: `${item.x}px`,
    top: `${item.y}px`,
    ...(item.w !== null ? { width: `${item.w}px` } : {}),
    ...(item.h !== null ? { height: `${item.h}px` } : {}),
    ...cssToStyle(item.css),
  };
}

interface CanvasItemProps {
  readonly item: ItemSpec;
}

/**
 * Render mot phan tu tu page spec: toa do, kich thuoc va style giu nguyen 100%
 * gia tri Figma. Class hieu ung (.rv / .hero-line) duoc them vao nhung trang
 * thai ket thuc cua chung trung khop voi thiet ke goc.
 */
export function CanvasItem({ item }: CanvasItemProps) {
  const isHeading = item.classes.some((name) => HEADING_CLASSES.has(name));
  const style = boxStyle(item);
  const baseClass = ["it", ...item.classes].join(" ");

  const content = isHeading ? (
    <HeadingLines html={item.html} />
  ) : (
    <span dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(item.html) }} />
  );

  // Nut / link noi bo -> dung <Link> de dieu huong client-side, giu hieu ung chuyen trang.
  if (item.tag === "a" && item.href) {
    const isInternal = item.href.startsWith("/");
    const className = `${baseClass} rv`;

    if (isInternal) {
      return (
        <Link
          id={item.id}
          href={item.href}
          prefetch={false}
          className={className}
          style={style}
          data-rv={revealDirection(item.classes)}
          data-magnetic=""
        >
          {content}
        </Link>
      );
    }

    return (
      <a
        id={item.id}
        href={item.href}
        className={className}
        style={style}
        data-rv={revealDirection(item.classes)}
        data-magnetic=""
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  // Nut trong Figma chua tro den dau -> giu hinh dang nut nhung khong dieu huong.
  if (item.tag === "a") {
    return (
      <button
        id={item.id}
        type="button"
        className={`${baseClass} rv`}
        style={style}
        data-rv={revealDirection(item.classes)}
        data-magnetic=""
      >
        {content}
      </button>
    );
  }

  // Phan tu khong phai the <a> nhung da duoc gan dich den (vi du NHAN MUC dung
  // lam loi vao trang con vi thiet ke khong ve nut) -> render thanh lien ket.
  if (item.href) {
    return (
      <Link
        id={item.id}
        href={item.href}
        prefetch={false}
        className={`${baseClass} tc-label-link${isHeading ? "" : " rv"}`}
        style={style}
        {...(isHeading
          ? { "data-reveal-group": "" }
          : { "data-rv": revealDirection(item.classes) })}
      >
        {content}
      </Link>
    );
  }

  // Tieu de: khoi cha KHONG bi clip nen dung lam moc quan sat cho cac .hero-line
  // ben trong (xem ghi chu trong MotionLayer / CanvasSlices).
  return (
    <div
      id={item.id}
      className={isHeading ? baseClass : `${baseClass} rv`}
      style={style}
      {...(isHeading
        ? { "data-reveal-group": "" }
        : { "data-rv": revealDirection(item.classes) })}
    >
      {content}
    </div>
  );
}

/**
 * Tach tieu de theo <br> thanh cac dong khoi rieng.
 * `.hero-line { display: block }` ke thua line-height cua khoi cha nen hinh hoc
 * y het nhu khi dung <br>.
 */
function HeadingLines({ html }: { readonly html: string }) {
  const lines = splitHeadingLines(html);

  if (lines.length === 0) {
    return null;
  }

  return (
    <>
      {lines.map((line, index) => (
        <span
          key={`${index}-${line.slice(0, 24)}`}
          className="hero-line"
          style={{ "--rv-delay": `${index * 110}ms` } as CSSProperties}
          dangerouslySetInnerHTML={{ __html: line }}
        />
      ))}
    </>
  );
}
