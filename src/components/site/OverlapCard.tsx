import overlap from "@/data/overlap-cards.json";

/**
 * Chan the tai ung dung duoc VE LAI bang phan tu that.
 *
 * Trang "Cập nhật & vá lỗi" xep the theo luoi; nut "TẢI VỀ" nam o mot do cao
 * co dinh, nen the nao co tieu de dai phai xuong hai dong thi dong thu hai
 * chui xuong duoi nut — ban thiet ke ve nut DE LEN chu. Ca hai deu nam trong
 * anh nen nen khong keo nut xuong duoc: phan chu bi che da mat khoi anh.
 *
 * Nen cum do bi xoa khoi anh (tools/brand/fix-overlap-card.py) va ve lai o
 * day: tieu de tu xuong dong theo be rong the, nut nam ngay DUOI no.
 */

interface Card {
  readonly page: string;
  readonly footer: { readonly x: number; readonly y: number; readonly width: number };
  readonly title: string;
  readonly button: {
    readonly label: string;
    readonly width: number;
    readonly height: number;
    /** Tep tai that tren wincavn.com, neu co. */
    readonly href?: string;
  };
}

const CARDS = (overlap as unknown as { cards: readonly Card[] }).cards;

export function OverlapCards({ slug }: { slug: string }) {
  const here = CARDS.filter((card) => card.page === slug);
  if (here.length === 0) {
    return null;
  }

  return (
    <>
      {here.map((card) => (
        <div
          key={`${card.footer.x}-${card.footer.y}`}
          className="tc-appfoot"
          style={{
            left: card.footer.x,
            top: card.footer.y,
            width: card.footer.width,
          }}
        >
          <p className="tc-appfoot-title">{card.title}</p>
          {card.button.href ? (
            /* Tep tai nam tren wincavn.com — the <a> thuong, mo tab moi. */
            <a
              className="tc-appfoot-btn"
              href={card.button.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ width: card.button.width, height: card.button.height }}
            >
              {card.button.label}
            </a>
          ) : (
            <span
              className="tc-appfoot-btn"
              style={{ width: card.button.width, height: card.button.height }}
            >
              {card.button.label}
            </span>
          )}
        </div>
      ))}
    </>
  );
}
