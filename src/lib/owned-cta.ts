import overlap from "@/data/overlap-cards.json";
import ppf from "@/data/ppf-cards.json";

/**
 * Vung ma mot COMPONENT RIENG da ve nut that len roi.
 *
 * `ReadMore` phu mot vung bam "xem thêm" len tung nut ve san trong anh. Nhung
 * vai trang co component rieng tu ve nut that o dung cho do:
 *   - `OverlapCards`  nut "TẢI VỀ" tren hai trang kho ung dung
 *   - `PpfCarousel`   nut "XEM THÊM" tren tung the PPF
 *
 * Phu them vung bam len chung thi co HAI lop tren cung mot nut, va lop tren
 * (`.tc-readmore`, z-index 6) nuot het cu bam — nut that nhin thay ma bam
 * khong duoc. `verify:clickable` bat duoc ca ba cho.
 *
 * `z-index` khong chua duoc: hai ben nam o hai NGU CANH XEP LOP khac nhau
 * (the PPF nam trong mot khoi co `transform`), nen so sanh z-index giua chung
 * la vo nghia. Phai khong ve lop kia ngay tu dau.
 */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

interface OverlapCard {
  readonly page: string;
  readonly footer: { readonly x: number; readonly y: number; readonly width: number };
}

const OVERLAP = (overlap as unknown as { cards: readonly OverlapCard[] }).cards;

const PPF = ppf as unknown as {
  readonly view: { readonly x: number; readonly y: number };
  readonly firstX: number;
  readonly pitch: number;
  readonly layout: {
    readonly button: {
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
    };
  };
  readonly cards: readonly unknown[];
};

/** Cao uoc cua mot khoi `.tc-appfoot` — du de trum ca tieu de lan nut. */
const FOOTER_HEIGHT = 150;

export function ownedCtaRects(slug: string): readonly Rect[] {
  const out: Rect[] = [];

  for (const card of OVERLAP) {
    if (card.page !== slug) continue;
    out.push({
      x: card.footer.x,
      y: card.footer.y,
      w: card.footer.width,
      h: FOOTER_HEIGHT,
    });
  }

  if (slug === "giai-phap/ppf") {
    // The PPF xep deu nhau: tam dau o `firstX`, moi tam cach nhau `pitch`.
    // Dai nay TRUOT duoc, nhung cac o "xem thêm" ve san trong anh thi dung o
    // vi tri ban dau — nen chi can doi chieu voi vi tri do.
    const { button } = PPF.layout;
    PPF.cards.forEach((_, index) => {
      out.push({
        x: PPF.view.x + PPF.firstX + index * PPF.pitch + button.x,
        y: PPF.view.y + button.y,
        w: button.width,
        h: button.height,
      });
    });
  }

  return out;
}
