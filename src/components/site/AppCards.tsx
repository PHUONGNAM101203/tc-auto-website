import Link from "next/link";
import type { AppCard } from "@/lib/app-cards";

/**
 * Ba the muc "Ứng dụng" tren trang Cong nghe.
 *
 * ── Bam thi sao ────────────────────────────────────────────────────────────
 * Bam the nao thi di thang sang trang cua the do. Ro chuot thi the noi len,
 * the khac mo di — chi vay thoi.
 *
 * Truoc day bam the ben canh thi RUOT cua no chay vao khung giua nhu mot bang
 * chuyen. Khach bo han cach do (02/10/2026): "bấm cái nào nó vào cái đấy luôn
 * không cần ra giữa nữa mà chỉ có khi hover nó nổi lên thôi".
 *
 * ── Mot khung duy nhat ─────────────────────────────────────────────────────
 * Anh cua tung the nay cat TRUM ca khung bo tron, khong thut vao trong nua.
 * Hoi con thut thi khung ve chet trong anh nen lo ra thanh mot hinh vuong thu
 * hai bao quanh — khach chi dung cho do. Xem INSET_* trong
 * tools/brand/extract-cards.py.
 *
 * Khong con `useState` nao: the dung yen, nen day tro lai la mot component
 * may chu. Hieu ung noi len do CSS lo.
 */
export function AppCards({ cards }: { cards: readonly AppCard[] }) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="tc-cards">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={card.href}
          prefetch={false}
          className="tc-card"
          style={{
            left: card.content.x,
            top: card.content.y,
            width: card.content.width,
            height: card.content.height,
          }}
          aria-label={card.title}
        >
          {/* Lop boc rieng de nhac the len khi ro chuot. */}
          <span className="tc-card-lift">
            {/* eslint-disable-next-line @next/next/no-img-element -- anh cat san tu
                ban thiet ke o ti le @3x, khong qua image optimizer */}
            <img
              src={card.src}
              alt=""
              width={card.content.width}
              height={card.content.height}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </span>
        </Link>
      ))}
    </div>
  );
}
