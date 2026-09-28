"use client";

import Link from "next/link";
import type { LiftCard } from "@/lib/lift-cards";

/**
 * Cac the anh duoc tach khoi anh nen: ro chuot vao the nao thi the do noi len
 * va sang len, cac the con lai lui lai mot chut — de mat biet dang tro vao dau.
 *
 * Anh cua tung the giu nguyen 100% tu ban thiet ke nen luc khong tro chuot man
 * hinh trung khop tuyet doi.
 */
export function LiftCards({ cards }: { cards: readonly LiftCard[] }) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="tc-lift">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={card.href}
          prefetch={false}
          className="tc-lift-card"
          style={{ left: card.x, top: card.y, width: card.width, height: card.height }}
          aria-label={`${card.title} — ${card.subtitle}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- anh the cat san
              tu ban thiet ke o ti le @3x, khong qua image optimizer */}
          <img
            src={card.src}
            alt=""
            width={card.width}
            height={card.height}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </Link>
      ))}
    </div>
  );
}
