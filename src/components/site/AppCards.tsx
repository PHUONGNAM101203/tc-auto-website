import Link from "next/link";
import type { AppCard } from "@/lib/app-cards";

/**
 * Ba the muc "Ứng dụng" tren trang Cong nghe.
 *
 * KHUNG cua tung the nam trong anh nen, dung vi tri thiet ke ve. Chi RUOT (anh
 * minh hoa + tieu de + phu de) duoc tach ra thanh anh rieng — nho vay ro chuot
 * vao the nao thi ruot the do nhac len duoc.
 *
 * Bam la vao thang trang cua muc do, khong qua buoc trung gian nao.
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
          {/* Lop boc rieng de nhac ruot the len khi ro chuot. */}
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
