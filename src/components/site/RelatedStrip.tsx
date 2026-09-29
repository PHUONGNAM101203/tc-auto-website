"use client";

import Link from "next/link";
import {
  RELATED_BACKGROUND,
  RELATED_BOX,
  RELATED_CARD,
  RELATED_CARDS,
  RELATED_PAD_TOP,
  RELATED_PITCH,
  RELATED_TITLE_GAP,
  repeatCount,
  repeatedCards,
} from "@/lib/related-strip";

/**
 * Dai the "CÁC BÀI VIẾT KHÁC" tu cuon ngang.
 *
 * ── Vi sao PHU LEN chu khong xoa khoi anh nen ───────────────────────────────
 * Cac khoi tuong tac khac trong du an deu xoa phan ve san khoi lat nen roi ve
 * de len. O day thi khong: dai nay PHU mot lop mau nen dac (#03111c, do tu
 * chinh anh nen phia tren va duoi dai) len toan bo vung do. Lam vay de con lui
 * lai duoc — bo trang khoi `pages` trong related-strip.json la moi thu ve nhu
 * cu, khong phai dung lai anh. Cac bo xoa thi chay hai lan la xoa hai lan.
 *
 * ── Vi sao cuon bang CSS chu khong bang JavaScript ──────────────────────────
 * Hoat anh CSS chay tren luong ghep hinh, khong bi giat khi luong chinh ban.
 * Mot chu ky = dich trai dung `so the × buoc` roi nhay ve 0; vi danh sach da
 * duoc lap nguyen chu ky nen mat nguoi khong thay cho nhay.
 *
 * Danh sach duoc lap du de phu HET khung nhin CONG mot chu ky — thieu la luc
 * dich trai se ho mot khoang trong o mep phai.
 */

const VIEW_WIDTH = RELATED_BOX.width;
/** Giay cho MOT the di het mot buoc. Cang nho cang nhanh. */
const SECONDS_PER_CARD = 6;

export function RelatedStrip() {
  const cards = repeatedCards(VIEW_WIDTH);
  const lap = RELATED_CARDS.length * RELATED_PITCH;
  const duration = RELATED_CARDS.length * SECONDS_PER_CARD;

  return (
    <div
      className="tc-related"
      style={{
        left: RELATED_BOX.x,
        top: RELATED_BOX.y,
        width: RELATED_BOX.width,
        height: RELATED_BOX.height,
        background: RELATED_BACKGROUND,
      }}
      aria-label="Các bài viết khác"
    >
      <div
        className="tc-related-track"
        style={
          {
            "--tc-related-lap": `${lap}px`,
            "--tc-related-title-gap": `${RELATED_TITLE_GAP}px`,
            paddingTop: `${RELATED_PAD_TOP}px`,
            animationDuration: `${duration}s`,
            gap: `${RELATED_CARD.gap}px`,
          } as React.CSSProperties
        }
      >
        {cards.map((card, index) => {
          const body = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- anh cat
                  san tu bo tai nguyen o ti le goc, khong qua image optimizer */}
              <img
                className="tc-related-shot"
                src={card.src}
                alt={card.title || ""}
                width={RELATED_CARD.width}
                height={RELATED_CARD.height}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
              {/* Bo han phan chu khi chua co tieu de — xem `_doc_title` trong
                  src/data/related-strip.json. */}
              {card.title ? (
                <span className="tc-related-title">{card.title}</span>
              ) : null}
            </>
          );

          return (
            <div
              key={card.key}
              className="tc-related-card"
              style={{ width: RELATED_CARD.width }}
              /* Ban sao thu hai tro di chi de lap day mat nhin. */
              aria-hidden={index >= RELATED_CARDS.length ? true : undefined}
            >
              {card.href ? (
                <Link
                  href={card.href}
                  prefetch={false}
                  className="tc-related-link"
                >
                  {body}
                </Link>
              ) : (
                body
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { repeatCount };
